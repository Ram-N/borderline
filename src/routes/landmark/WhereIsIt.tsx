import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { LandmarkDataset } from '../../types/landmark/landmark';
import type { Difficulty } from '../../types/landmark/game';
import { LANDMARK_MAP_CONFIG } from '../../data/landmarkMapConfig';
import useWhereIsItEngine from '../../hooks/landmark/useWhereIsItEngine';
import WhereIsItMapView from '../../components/landmark/WhereIsItMapView';
import ConfidencePicker from '../../components/landmark/ConfidencePicker';
import DistanceFeedback from '../../components/landmark/DistanceFeedback';

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  1: 'Tourist',
  2: 'Traveler',
  3: 'Explorer',
  4: 'Cartographer',
  5: 'Navigator',
};

function GameContent({
  dataset,
  difficulty,
  n,
  mapKey,
}: {
  dataset: LandmarkDataset;
  difficulty: Difficulty;
  n: number;
  mapKey: string;
}) {
  const navigate = useNavigate();
  const cfg = LANDMARK_MAP_CONFIG[mapKey];
  const svgSrc = difficulty >= 4 ? cfg.blankSvg : cfg.labeledSvg;

  const engine = useWhereIsItEngine({ dataset, difficulty, n, diagonalKm: cfg.diagonalKm });

  useEffect(() => {
    if (engine.done) {
      navigate('/landmark/results', {
        state: { rounds: engine.rounds, totalScore: engine.totalScore, difficulty, city: mapKey },
      });
    }
  }, [engine.done, engine.rounds, engine.totalScore, difficulty, navigate]);

  if (engine.done) return null;

  const currentRound = engine.rounds[engine.currentIndex];
  const landmark = currentRound.landmark;
  const revealedRound = engine.phase === 'reveal' ? currentRound : null;

  return (
    <div className="where-is-it">
      {/* Header row */}
      <div className="wii-header">
        <span className="wii-progress">
          Round {engine.currentIndex + 1} / {engine.total}
        </span>
        <span className="wii-difficulty">{DIFFICULTY_LABELS[difficulty]}</span>
        <span className="wii-score">Score: {engine.totalScore}</span>
      </div>

      {/* Landmark prompt */}
      <div className="wii-prompt">
        <h2 className="wii-landmark-name">{landmark.name}</h2>
        {difficulty <= 2 && landmark.hint && (
          <p className="wii-hint">{landmark.hint}</p>
        )}
      </div>

      {/* Map */}
      <WhereIsItMapView
        svgSrc={svgSrc}
        viewBox={dataset.viewBox}
        playerPin={engine.pendingPin ?? revealedRound?.placedPin ?? null}
        correctPin={
          engine.phase === 'reveal'
            ? { svgX: landmark.svgX, svgY: landmark.svgY }
            : undefined
        }
        phase={engine.phase}
        onMapClick={engine.placePin}
      />

      {/* Action row */}
      <div className="wii-actions">
        {engine.phase === 'question' ? (
          <div className="wii-question-row">
            <ConfidencePicker
              value={engine.pendingConfidence}
              onChange={engine.setConfidence}
            />
            <button
              className="wii-btn wii-btn-confirm"
              onClick={engine.confirm}
              disabled={!engine.pendingPin || !engine.pendingConfidence}
            >
              Confirm Pin
            </button>
          </div>
        ) : (
          <>
            {revealedRound?.distanceKm !== undefined && (
              <DistanceFeedback
                distanceKm={revealedRound.distanceKm!}
                baseScore={revealedRound.baseScore!}
                finalScore={revealedRound.finalScore!}
                confidence={revealedRound.confidence!}
              />
            )}
            <button className="wii-btn wii-btn-next" onClick={engine.next}>
              {engine.currentIndex + 1 < engine.total ? 'Next Landmark' : 'See Results'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function WhereIsIt() {
  const [searchParams] = useSearchParams();
  const mapKey = searchParams.get('map') ?? 'nyc';
  const difficulty = (Number(searchParams.get('difficulty') ?? '1') as Difficulty) || 1;
  const n = Number(searchParams.get('n') ?? '5') || 5;

  const [dataset, setDataset] = useState<LandmarkDataset | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cfg = LANDMARK_MAP_CONFIG[mapKey];

  useEffect(() => {
    if (!cfg) {
      setError(`Unknown map: ${mapKey}`);
      return;
    }
    fetch(cfg.dataUrl)
      .then((r) => r.json())
      .then((data: LandmarkDataset) => setDataset(data))
      .catch(() => setError('Failed to load landmark data.'));
  }, [cfg, mapKey]);

  if (error) return <div className="landmark-error">{error}</div>;
  if (!dataset) return <div className="landmark-loading">Loading map…</div>;

  return (
    <GameContent
      dataset={dataset}
      difficulty={difficulty}
      n={n}
      mapKey={mapKey}
    />
  );
}

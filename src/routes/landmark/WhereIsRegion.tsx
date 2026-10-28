import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { RegionDataset, WhereIsRegionRound } from '../../types/landmark/region';
import type { Difficulty } from '../../types/landmark/game';
import { REGION_MAP_CONFIG } from '../../data/regionMapConfig';
import useWhereIsRegionEngine from '../../hooks/landmark/useWhereIsRegionEngine';
import WhereIsItMapView from '../../components/landmark/WhereIsItMapView';
import ConfidencePicker from '../../components/landmark/ConfidencePicker';
import DistanceFeedback from '../../components/landmark/DistanceFeedback';
import { geoToSvg, kmToSvgPx, parseViewBox } from '../../utils/landmark/coordTransform';

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
  mode,
  n,
  mapKey,
}: {
  dataset: RegionDataset;
  difficulty: Difficulty;
  mode: 'regions' | 'cities';
  n: number;
  mapKey: string;
}) {
  const navigate = useNavigate();
  const cfg = REGION_MAP_CONFIG[mapKey];
  // Difficulty 1–3: show region boundaries; 4–5: outline only
  const svgSrc = difficulty >= 4 ? cfg.outlineSvg : cfg.boundariesSvg;

  const engine = useWhereIsRegionEngine({ dataset, difficulty, mode, n });

  useEffect(() => {
    if (engine.done) {
      navigate('/landmark/results', {
        state: {
          rounds: engine.rounds,
          totalScore: engine.totalScore,
          difficulty,
          city: mapKey,
        },
      });
    }
  }, [engine.done, engine.rounds, engine.totalScore, difficulty, navigate, mapKey]);

  if (engine.done) return null;

  const currentRound = engine.rounds[engine.currentIndex] as WhereIsRegionRound;
  const target = currentRound.target;
  const revealedRound = engine.phase === 'reveal' ? currentRound : null;

  // Confidence circle: preview while choosing, the claimed one on reveal
  const circleKm = revealedRound?.radiusKm
    ?? (engine.pendingConfidence ? engine.radiusKmFor(engine.pendingConfidence) : null);
  const claimRadiusPx = circleKm !== null
    ? kmToSvgPx(circleKm, dataset.bounds, parseViewBox(dataset.viewBox))
    : null;
  const claimHit = revealedRound?.finalScore !== undefined && revealedRound.finalScore > 0;

  // Regions are areas, so the reveal outlines the whole region rather than a centroid pin
  const correctArea = revealedRound && 'polygons' in target
    ? {
        d: target.polygons
          .map((poly) => 'M' + poly
            .map(([lat, lon]) => {
              const p = geoToSvg(lat, lon, dataset.bounds, parseViewBox(dataset.viewBox));
              return `${p.svgX.toFixed(1)},${p.svgY.toFixed(1)}`;
            })
            .join('L') + 'Z')
          .join(''),
        hit: !!revealedRound.insideRegion,
      }
    : undefined;

  return (
    <div className="pinpoint">
      {/* Header row */}
      <div className="wii-header">
        <span className="wii-progress">
          Round {engine.currentIndex + 1} / {engine.total}
        </span>
        <span className="wii-difficulty">{DIFFICULTY_LABELS[difficulty]}</span>
        <span className="wii-score">Score: {engine.totalScore}</span>
      </div>

      {/* Target prompt */}
      <div className="wii-prompt">
        <h2 className="wii-landmark-name">{target.name}</h2>
        {difficulty <= 2 && target.hint && (
          <p className="wii-hint">{target.hint}</p>
        )}
        <p className="wii-mode-label">
          {mode === 'regions' ? 'Find this state / region' : 'Find this city'}
        </p>
      </div>

      {/* Map */}
      <WhereIsItMapView
        svgSrc={svgSrc}
        viewBox={dataset.viewBox}
        playerPin={engine.pendingPin ?? revealedRound?.placedPin ?? null}
        correctPin={
          engine.phase === 'reveal'
            ? { svgX: target.svgX, svgY: target.svgY }
            : undefined
        }
        correctArea={correctArea}
        phase={engine.phase}
        claimRadius={claimRadiusPx}
        claimHit={claimHit}
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
            {revealedRound?.radiusKm !== undefined && (
              <DistanceFeedback
                distanceKm={revealedRound.distanceKm ?? 0}
                radiusKm={revealedRound.radiusKm!}
                finalScore={revealedRound.finalScore!}
                confidence={revealedRound.confidence!}
                insideRegion={revealedRound.insideRegion}
              />
            )}
            <button className="wii-btn wii-btn-next" onClick={engine.next}>
              {engine.currentIndex + 1 < engine.total ? 'Next' : 'See Results'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function WhereIsRegion() {
  const [searchParams] = useSearchParams();
  const mapKey = searchParams.get('map') ?? 'india';
  const difficulty = (Number(searchParams.get('difficulty') ?? '1') as Difficulty) || 1;
  const mode = (searchParams.get('mode') ?? 'regions') as 'regions' | 'cities';
  const n = Number(searchParams.get('n') ?? '5') || 5;

  const [dataset, setDataset] = useState<RegionDataset | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cfg = REGION_MAP_CONFIG[mapKey];

  useEffect(() => {
    if (!cfg) {
      setError(`Unknown region map: ${mapKey}`);
      return;
    }
    fetch(cfg.dataUrl)
      .then((r) => r.json())
      .then((data: RegionDataset) => setDataset(data))
      .catch(() => setError('Failed to load region data.'));
  }, [cfg, mapKey]);

  if (error) return <div className="landmark-error">{error}</div>;
  if (!dataset) return <div className="landmark-loading">Loading map…</div>;

  return (
    <GameContent
      dataset={dataset}
      difficulty={difficulty}
      mode={mode}
      n={n}
      mapKey={mapKey}
    />
  );
}

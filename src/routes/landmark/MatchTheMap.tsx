import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { LandmarkDataset, Landmark } from '../../types/landmark/landmark';
import type { Difficulty } from '../../types/landmark/game';
import { LANDMARK_MAP_CONFIG } from '../../data/landmarkMapConfig';
import useMatchTheMapEngine from '../../hooks/landmark/useMatchTheMapEngine';

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  1: 'Tourist',
  2: 'Traveler',
  3: 'Explorer',
  4: 'Cartographer',
  5: 'Navigator',
};

/** A numbered circle pin rendered directly in SVG space. */
function NumberedPin({
  pin,
  index,
  fill,
  onPin,
}: {
  pin: Landmark;
  index: number;
  fill: string;
  onPin?: () => void;
}) {
  function handleClick(e: React.MouseEvent<SVGGElement>) {
    e.stopPropagation();
    onPin?.();
  }
  return (
    <g onClick={handleClick} style={{ cursor: onPin ? 'pointer' : 'default' }}>
      <circle
        cx={pin.svgX}
        cy={pin.svgY}
        r={13}
        fill={fill}
        stroke="white"
        strokeWidth={2}
      />
      <text
        x={pin.svgX}
        y={pin.svgY + 4}
        textAnchor="middle"
        fontSize={12}
        fontWeight="bold"
        fill="white"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {index + 1}
      </text>
    </g>
  );
}

function GameContent({
  dataset,
  difficulty,
  mapKey,
}: {
  dataset: LandmarkDataset;
  difficulty: Difficulty;
  mapKey: string;
}) {
  const cfg = LANDMARK_MAP_CONFIG[mapKey];
  const svgSrc = difficulty >= 4 ? cfg.blankSvg : cfg.labeledSvg;

  const engine = useMatchTheMapEngine(dataset, difficulty);
  const svgRef = useRef<SVGSVGElement>(null);
  const [, , vbWidth, vbHeight] = dataset.viewBox.split(' ').map(Number);

  function pinFill(pin: Landmark): string {
    if (engine.selectedPin === pin.id) return '#f59e0b'; // amber — selected
    if (pin.id in engine.assignments) return '#7c3aed';  // purple — assigned
    return '#2563eb';                                     // blue — default
  }

  function revealPinFill(pin: Landmark): string {
    return engine.assignments[pin.id] === pin.id ? '#16a34a' : '#dc2626';
  }

  // ── Reveal phase ─────────────────────────────────────────────────────────
  if (engine.phase === 'reveal') {
    const correct = engine.pins.filter((p) => engine.assignments[p.id] === p.id).length;
    const total = engine.pins.length;

    return (
      <div className="mtm-game">
        <div className="wii-header">
          <span className="wii-difficulty">{DIFFICULTY_LABELS[difficulty]}</span>
          <span className="wii-score">
            {correct}/{total} correct · {engine.totalScore}/100 pts
          </span>
        </div>

        <div className="map-view-wrapper">
          <svg viewBox={dataset.viewBox} className="map-svg">
            <image href={svgSrc} x={0} y={0} width={vbWidth} height={vbHeight} />
            {engine.pins.map((pin, i) => (
              <g key={pin.id}>
                <NumberedPin pin={pin} index={i} fill={revealPinFill(pin)} />
                <text
                  x={pin.svgX + 16}
                  y={pin.svgY + 5}
                  fontSize={11}
                  fontWeight="bold"
                  fill={revealPinFill(pin)}
                  stroke="white"
                  strokeWidth={3}
                  paintOrder="stroke"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {pin.name}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div className="mtm-reveal-list">
          {engine.pins.map((pin, i) => {
            const assignedChip = engine.chips.find(
              (c) => c.id === engine.assignments[pin.id],
            );
            const isCorrect = engine.assignments[pin.id] === pin.id;
            return (
              <div
                key={pin.id}
                className={`mtm-reveal-row ${isCorrect ? 'mtm-reveal-correct' : 'mtm-reveal-wrong'}`}
              >
                <span className="mtm-reveal-num">{i + 1}</span>
                <span className="mtm-reveal-name">{pin.name}</span>
                {!isCorrect && (
                  <>
                    <span className="mtm-reveal-arrow">←</span>
                    <span className="mtm-reveal-answer">{assignedChip?.name ?? '—'}</span>
                  </>
                )}
                <span className="mtm-reveal-pts">{isCorrect ? `+${engine.pointsPerMatch}` : '+0'}</span>
              </div>
            );
          })}
        </div>

        <div className="mtm-reveal-summary">
          {engine.totalScore} / 100 pts
        </div>

        <div className="results-actions" style={{ justifyContent: 'center', marginTop: '16px' }}>
          <Link to="/landmark" className="results-btn results-btn--secondary">
            All Games
          </Link>
        </div>
      </div>
    );
  }

  // ── Matching phase ────────────────────────────────────────────────────────
  const assignedCount = Object.keys(engine.assignments).length;
  const statusMsg = engine.selectedPin
    ? 'Now click a name chip below'
    : engine.selectedChip
    ? 'Now click a numbered pin on the map'
    : `${assignedCount}/${engine.pins.length} matched — click a pin or a chip to start`;

  return (
    <div className="mtm-game">
      <div className="wii-header">
        <span className="wii-difficulty">{DIFFICULTY_LABELS[difficulty]}</span>
        <span className="wii-score">{assignedCount}/{engine.pins.length} matched</span>
      </div>

      <p className="mtm-instruction">{statusMsg}</p>

      <div className="map-view-wrapper">
        <svg
          ref={svgRef}
          viewBox={dataset.viewBox}
          className="map-svg map-svg--clickable"
          onClick={engine.deselect}
        >
          <image href={svgSrc} x={0} y={0} width={vbWidth} height={vbHeight} />
          {engine.pins.map((pin, i) => (
            <NumberedPin
              key={pin.id}
              pin={pin}
              index={i}
              fill={pinFill(pin)}
              onPin={() => engine.clickPin(pin.id)}
            />
          ))}
        </svg>
      </div>

      <div className="mtm-chip-row">
        {engine.chips.map((chip) => {
          const isSelected = engine.selectedChip === chip.id;
          const assignedToPinIndex = engine.pins.findIndex(
            (p) => engine.assignments[p.id] === chip.id,
          );
          const isAssigned = assignedToPinIndex >= 0;
          return (
            <button
              key={chip.id}
              className={`mtm-chip${isSelected ? ' mtm-chip--selected' : ''}${isAssigned ? ' mtm-chip--assigned' : ''}`}
              onClick={() => engine.clickChip(chip.id)}
            >
              {isAssigned && (
                <span className="mtm-chip-num">{assignedToPinIndex + 1}</span>
              )}
              {chip.name}
            </button>
          );
        })}
      </div>

      <div className="wii-actions">
        <button
          className="wii-btn wii-btn-confirm"
          disabled={!engine.allAssigned}
          onClick={engine.confirm}
        >
          Confirm Matches
        </button>
      </div>
    </div>
  );
}

export default function MatchTheMap() {
  const [searchParams] = useSearchParams();
  const mapKey = searchParams.get('map') ?? 'nyc';
  const difficulty = (Number(searchParams.get('difficulty') ?? '1') as Difficulty) || 1;

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

  return <GameContent dataset={dataset} difficulty={difficulty} mapKey={mapKey} />;
}

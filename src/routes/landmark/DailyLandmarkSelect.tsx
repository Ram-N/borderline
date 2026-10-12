import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LANDMARK_MAP_CONFIG } from '../../data/landmarkMapConfig';
import useDailyLandmarkSelectEngine from '../../hooks/landmark/useDailyLandmarkSelectEngine';
import type {
  SelectRound,
  LandmarkChoice,
  DailyLandmarkSelectPuzzle,
} from '../../hooks/landmark/useDailyLandmarkSelectEngine';
import type { Landmark } from '../../types/landmark/landmark';

const LS_KEY = 'bl_daily_landmark_select';

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface SavedResult {
  phase1Score: number;
  phase2Score: number;
  total: number;
  date: string;
  phase1Emoji: string;
  phase2Emoji: string;
}

function loadSavedResult(date: string): SavedResult | null {
  try {
    const raw = localStorage.getItem(`${LS_KEY}_${date}`);
    return raw ? (JSON.parse(raw) as SavedResult) : null;
  } catch {
    return null;
  }
}

function saveResult(date: string, result: SavedResult) {
  try {
    localStorage.setItem(`${LS_KEY}_${date}`, JSON.stringify(result));
  } catch {}
}

function buildEmojiRow(pins: Landmark[], assignments: Record<string, string>): string {
  return pins.map((p) => (assignments[p.id] === p.id ? '🟩' : '🟥')).join('');
}

// ── Numbered pin — clickable variant matches MatchTheMap's NumberedPin ────────
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
      <circle cx={pin.svgX} cy={pin.svgY} r={13} fill={fill} stroke="white" strokeWidth={2} />
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

// ── Final results / already-completed screen ─────────────────────────────────
function ResultsScreen({ result }: { result: SavedResult }) {
  const [copied, setCopied] = useState(false);
  const shareText = `Landmark Select ${result.date}\nPhase 1: ${result.phase1Emoji}\nPhase 2: ${result.phase2Emoji}\n${result.total}/12`;

  function share() {
    if (navigator.share) {
      navigator.share({ text: shareText }).catch(() => {});
    } else {
      copyToClipboard();
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  return (
    <div className="dls-final">
      <div className="dls-final-badge">Daily Landmark Select</div>
      <div className="dls-final-date">{result.date}</div>
      <div className="dls-final-score">{result.total} / 12</div>
      <div className="dls-final-breakdown">
        <div className="dls-final-row">
          <span>Phase 1 (labeled map)</span>
          <span>
            {result.phase1Emoji} {result.phase1Score}/6
          </span>
        </div>
        <div className="dls-final-row">
          <span>Phase 2 (blank map)</span>
          <span>
            {result.phase2Emoji} {result.phase2Score}/6
          </span>
        </div>
      </div>
      <div className="dls-final-actions">
        <button className="dls-btn dls-btn--share" onClick={share}>
          Share
        </button>
        <button className="dls-btn dls-btn--copy" onClick={copyToClipboard}>
          {copied ? 'Copied!' : 'Copy results'}
        </button>
        <Link to="/landmark" className="dls-btn dls-btn--home">
          All Games
        </Link>
      </div>
    </div>
  );
}

// ── Single phase: matching (click pin → click chip) + reveal ─────────────────
function PhaseView({
  round,
  phaseNum,
  onPhaseComplete,
}: {
  round: SelectRound;
  phaseNum: 1 | 2;
  onPhaseComplete: (score: number, emoji: string) => void;
}) {
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const { dataset, pins, choices, pointsPerCorrect } = round;
  const [, , vbWidth, vbHeight] = dataset.viewBox.split(' ').map(Number);
  const cfg = LANDMARK_MAP_CONFIG[round.mapId];
  const svgSrc = round.isLabeled ? cfg.labeledSvg : cfg.blankSvg;

  function clickPin(pinId: string) {
    if (revealed) return;
    if (selectedChip !== null) {
      const chipId = selectedChip;
      setAssignments((prev) => {
        const next = { ...prev };
        for (const pid of Object.keys(next)) {
          if (next[pid] === chipId) delete next[pid];
        }
        next[pinId] = chipId;
        return next;
      });
      setSelectedPin(null);
      setSelectedChip(null);
    } else {
      setSelectedPin((prev) => (prev === pinId ? null : pinId));
      setSelectedChip(null);
    }
  }

  function clickChip(chipId: string) {
    if (revealed) return;
    if (selectedPin !== null) {
      const pinId = selectedPin;
      setAssignments((prev) => {
        const next = { ...prev };
        for (const pid of Object.keys(next)) {
          if (next[pid] === chipId) delete next[pid];
        }
        next[pinId] = chipId;
        return next;
      });
      setSelectedPin(null);
      setSelectedChip(null);
    } else {
      setSelectedChip((prev) => (prev === chipId ? null : chipId));
      setSelectedPin(null);
    }
  }

  function deselect() {
    setSelectedPin(null);
    setSelectedChip(null);
  }

  function pinFill(pin: Landmark): string {
    if (selectedPin === pin.id) return '#f59e0b';  // amber — selected
    if (pin.id in assignments) return '#7c3aed';    // purple — assigned
    return '#2563eb';                                // blue — default
  }

  function revealPinFill(pin: Landmark): string {
    return assignments[pin.id] === pin.id ? '#16a34a' : '#dc2626';
  }

  const allAssigned = Object.keys(assignments).length === pins.length;
  const assignedCount = Object.keys(assignments).length;

  const statusMsg = selectedPin
    ? 'Now click a name chip below'
    : selectedChip
    ? 'Now click a numbered pin on the map'
    : `${assignedCount}/${pins.length} matched — click a pin or a chip to start`;

  function confirm() {
    setRevealed(true);
  }

  function proceed() {
    const correctCount = pins.filter((p) => assignments[p.id] === p.id).length;
    const score = correctCount * pointsPerCorrect;
    const emoji = buildEmojiRow(pins, assignments);
    onPhaseComplete(score, emoji);
  }

  // ── Reveal phase ────────────────────────────────────────────────────────────
  if (revealed) {
    const correctCount = pins.filter((p) => assignments[p.id] === p.id).length;
    const phaseScore = correctCount * pointsPerCorrect;

    return (
      <div className="dls-phase">
        <div className="dls-phase-header">
          <span className="dls-phase-badge">Phase {phaseNum} of 2</span>
          <span className="dls-phase-name">
            {round.mapName} · {round.isLabeled ? 'labeled map' : 'blank map'}
          </span>
          <span className="wii-score">
            {correctCount}/{pins.length} correct · {phaseScore}/{round.maxPoints} pts
          </span>
        </div>

        <div className="map-view-wrapper">
          <svg viewBox={dataset.viewBox} className="map-svg">
            <image href={svgSrc} x={0} y={0} width={vbWidth} height={vbHeight} />
            {pins.map((pin, i) => (
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
          {pins.map((pin, i) => {
            const assignedChip = choices.find((c) => c.id === assignments[pin.id]);
            const isCorrect = assignments[pin.id] === pin.id;
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
                <span className="mtm-reveal-pts">
                  {isCorrect ? `+${pointsPerCorrect}` : '+0'}
                </span>
              </div>
            );
          })}
        </div>

        <div className="wii-actions" style={{ marginTop: '14px' }}>
          <button className="wii-btn wii-btn-confirm" onClick={proceed}>
            {phaseNum === 1 ? 'Next Phase →' : 'See Results →'}
          </button>
        </div>
      </div>
    );
  }

  // ── Matching phase ──────────────────────────────────────────────────────────
  return (
    <div className="dls-phase">
      <div className="dls-phase-header">
        <span className="dls-phase-badge">Phase {phaseNum} of 2</span>
        <span className="dls-phase-name">
          {round.mapName} · {round.isLabeled ? 'labeled map' : 'blank map'}
        </span>
      </div>

      <p className="mtm-instruction">{statusMsg}</p>

      <div className="map-view-wrapper">
        <svg
          viewBox={dataset.viewBox}
          className="map-svg map-svg--clickable"
          onClick={deselect}
        >
          <image href={svgSrc} x={0} y={0} width={vbWidth} height={vbHeight} />
          {pins.map((pin, i) => (
            <NumberedPin
              key={pin.id}
              pin={pin}
              index={i}
              fill={pinFill(pin)}
              onPin={() => clickPin(pin.id)}
            />
          ))}
        </svg>
      </div>

      <div className="mtm-chip-row">
        {choices.map((choice: LandmarkChoice) => {
          const isSelected = selectedChip === choice.id;
          const assignedToPinIndex = pins.findIndex((p) => assignments[p.id] === choice.id);
          const isAssigned = assignedToPinIndex >= 0;
          return (
            <button
              key={choice.id}
              className={`mtm-chip${isSelected ? ' mtm-chip--selected' : ''}${isAssigned ? ' mtm-chip--assigned' : ''}`}
              onClick={() => clickChip(choice.id)}
            >
              {isAssigned && (
                <span className="mtm-chip-num">{assignedToPinIndex + 1}</span>
              )}
              {choice.name}
            </button>
          );
        })}
      </div>

      <div className="wii-actions">
        <button
          className="wii-btn wii-btn-confirm"
          disabled={!allAssigned}
          onClick={confirm}
        >
          Confirm Matches
        </button>
      </div>
    </div>
  );
}

// ── Main game content ─────────────────────────────────────────────────────────
function GameContent({ puzzle }: { puzzle: DailyLandmarkSelectPuzzle }) {
  const [gamePhase, setGamePhase] = useState<1 | 2 | 'done'>(1);
  const [p1Score, setP1Score] = useState(0);
  const [p1Emoji, setP1Emoji] = useState('');
  const [p2Score, setP2Score] = useState(0);
  const [p2Emoji, setP2Emoji] = useState('');

  function completePhase1(score: number, emoji: string) {
    setP1Score(score);
    setP1Emoji(emoji);
    setGamePhase(2);
  }

  function completePhase2(score: number, emoji: string) {
    setP2Score(score);
    setP2Emoji(emoji);
    const result: SavedResult = {
      phase1Score: p1Score,
      phase2Score: score,
      total: p1Score + score,
      date: puzzle.date,
      phase1Emoji: p1Emoji,
      phase2Emoji: emoji,
    };
    saveResult(puzzle.date, result);
    setGamePhase('done');
  }

  if (gamePhase === 'done') {
    const result: SavedResult = {
      phase1Score: p1Score,
      phase2Score: p2Score,
      total: p1Score + p2Score,
      date: puzzle.date,
      phase1Emoji: p1Emoji,
      phase2Emoji: p2Emoji,
    };
    return <ResultsScreen result={result} />;
  }

  return (
    <div className="dls-game">
      <div className="dls-header">
        <span className="daily-badge">Daily</span>
        <span className="dls-title">Landmark Select</span>
        <span className="dls-date">{puzzle.date}</span>
      </div>
      {gamePhase === 1 && (
        <PhaseView round={puzzle.phase1} phaseNum={1} onPhaseComplete={completePhase1} />
      )}
      {gamePhase === 2 && (
        <PhaseView round={puzzle.phase2} phaseNum={2} onPhaseComplete={completePhase2} />
      )}
    </div>
  );
}

// ── Route wrapper ─────────────────────────────────────────────────────────────
export default function DailyLandmarkSelect() {
  const date = todayString();
  const { puzzle, error } = useDailyLandmarkSelectEngine(date);
  const saved = loadSavedResult(date);

  if (error) return <div className="landmark-error">{error}</div>;
  if (!puzzle) return <div className="landmark-loading">Loading daily puzzle…</div>;
  if (saved) return <ResultsScreen result={saved} />;

  return <GameContent puzzle={puzzle} />;
}

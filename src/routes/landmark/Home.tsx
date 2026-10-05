import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LANDMARK_MAP_CONFIG } from '../../data/landmarkMapConfig';
import { CITY_GROUPS, REGION_MAPS } from '../../generated/geoRegistry';

const GAMES = [
  { id: 'match-the-map',   title: 'Match the Map',   desc: 'Match numbered pins to their landmark names.' },
  { id: 'where-is-it',     title: 'Where Is It?',    desc: 'Drop a pin on the map to locate a landmark.' },
  { id: 'where-is-region', title: 'Find the Region', desc: 'Pin a named country or state on a continent map.' },
];

const DIFFICULTIES = [
  { value: 1, name: 'Tourist' },
  { value: 2, name: 'Traveler' },
  { value: 3, name: 'Explorer' },
  { value: 4, name: 'Cartographer' },
  { value: 5, name: 'Navigator' },
];

type Step = 1 | 2 | 3;

export default function LandMarkHome() {
  const navigate = useNavigate();
  const [step,       setStep]       = useState<Step>(1);
  const [gameId,     setGameId]     = useState<string | null>(null);
  const [mapKey,     setMapKey]     = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<number | null>(null);

  const isRegionGame = gameId === 'where-is-region';
  const gameLabel = GAMES.find((g) => g.id === gameId)?.title ?? '';
  const mapLabel  = isRegionGame
    ? REGION_MAPS.find((r) => r.key === mapKey)?.label ?? ''
    : LANDMARK_MAP_CONFIG[mapKey ?? '']?.label ?? '';

  function pickGame(id: string) {
    setGameId(id); setMapKey(null); setDifficulty(null); setStep(2);
  }
  function pickMap(key: string) {
    setMapKey(key); setDifficulty(3); setStep(3);
  }
  function pickDiff(d: number) {
    setDifficulty(d);
  }
  function goBack(toStep: Step) {
    setStep(toStep);
    if (toStep <= 2) { setMapKey(null); setDifficulty(null); }
    if (toStep === 1) { setGameId(null); }
  }
  function start() {
    if (!gameId || !mapKey || !difficulty) return;
    const params = isRegionGame
      ? new URLSearchParams({ map: mapKey, mode: 'regions', difficulty: String(difficulty) })
      : new URLSearchParams({ map: mapKey, difficulty: String(difficulty) });
    navigate(`/landmark/games/${gameId}?${params}`);
  }

  return (
    <div className="lm-home">
      <h1 className="lm-title">LandMark</h1>

      {/* ── Step 1: Game Mode ── */}
      {step === 1 ? (
        <div className="lm-wizard-step">
          <div className="lm-step-header">
            <span className="lm-step-badge">1</span>
            <span className="lm-step-label">Game Mode</span>
          </div>
          <div className="lm-game-list">
            {GAMES.map((g) => (
              <button key={g.id} className="lm-game-card" onClick={() => pickGame(g.id)}>
                <span className="lm-game-card-title">{g.title}</span>
                <span className="lm-game-card-desc">{g.desc}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button className="lm-done-row" onClick={() => goBack(1)}>
          <span className="lm-step-badge lm-step-badge--done">✓</span>
          <span className="lm-done-label">Game</span>
          <span className="lm-done-value">{gameLabel}</span>
          <span className="lm-done-change">change</span>
        </button>
      )}

      {/* ── Step 2: City / Region ── */}
      {gameId && (
        step === 2 ? (
          <div className="lm-wizard-step lm-wizard-step--reveal">
            <div className="lm-step-header">
              <span className="lm-step-badge">2</span>
              <span className="lm-step-label">{isRegionGame ? 'Region' : 'City'}</span>
            </div>
            {isRegionGame ? (
              <div className="lm-tile-row">
                {REGION_MAPS.map((rm) => (
                  <button key={rm.key} className="lm-tile" onClick={() => pickMap(rm.key)}>
                    {rm.label}
                  </button>
                ))}
              </div>
            ) : (
              CITY_GROUPS.map((group) => (
                <div key={group.label} className="lm-tile-group">
                  <div className="lm-tile-group-label">{group.label}</div>
                  <div className="lm-tile-row">
                    {group.keys.map((key) => (
                      <button key={key} className="lm-tile" onClick={() => pickMap(key)}>
                        {LANDMARK_MAP_CONFIG[key].label}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : mapKey ? (
          <button className="lm-done-row" onClick={() => goBack(2)}>
            <span className="lm-step-badge lm-step-badge--done">✓</span>
            <span className="lm-done-label">{isRegionGame ? 'Region' : 'City'}</span>
            <span className="lm-done-value">{mapLabel}</span>
            <span className="lm-done-change">change</span>
          </button>
        ) : null
      )}

      {/* ── Step 3: Difficulty ── */}
      {mapKey && (
        <div className="lm-wizard-step lm-wizard-step--reveal">
          <div className="lm-step-header">
            <span className="lm-step-badge">3</span>
            <span className="lm-step-label">Difficulty</span>
          </div>
          <div className="lm-diff-row">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                className={`lm-diff-btn${difficulty === d.value ? ' active' : ''}`}
                onClick={() => pickDiff(d.value)}
              >
                <span className="lm-diff-num">{d.value}</span>
                <span className="lm-diff-name">{d.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Start ── */}
      {difficulty && (
        <button className="start-btn" onClick={start}>Start →</button>
      )}
    </div>
  );
}

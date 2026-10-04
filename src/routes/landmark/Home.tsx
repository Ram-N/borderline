import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LANDMARK_MAP_CONFIG } from '../../data/landmarkMapConfig';

const GAMES = [
  { id: 'match-the-map',   title: 'Match the Map',   desc: 'Match numbered pins to their landmark names.' },
  { id: 'where-is-it',     title: 'Where Is It?',    desc: 'Drop a pin on the map to locate a landmark.' },
  { id: 'where-is-region', title: 'Find the Region', desc: 'Pin a named country or state on a continent map.' },
];

const CITY_GROUPS = [
  { label: 'World Cities',  keys: ['nyc', 'london', 'paris', 'rome', 'berlin'] },
  { label: 'Indian Cities', keys: ['bangalore', 'chennai', 'delhi', 'mumbai', 'kolkata'] },
];

const REGION_MAPS = [
  { key: 'india',  label: 'India' },
  { key: 'africa', label: 'Africa' },
];

const DIFFICULTIES = [
  { value: 1, name: 'Tourist' },
  { value: 2, name: 'Traveler' },
  { value: 3, name: 'Explorer' },
  { value: 4, name: 'Cartographer' },
  { value: 5, name: 'Navigator' },
];

export default function LandMarkHome() {
  const navigate = useNavigate();
  const [gameId,     setGameId]     = useState<string | null>(null);
  const [mapKey,     setMapKey]     = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<number | null>(null);

  function pickGame(id: string) {
    setGameId(id);
    setMapKey(null);
    setDifficulty(null);
  }

  function pickMap(key: string) {
    setMapKey(key);
    setDifficulty(null);
  }

  function start() {
    if (!gameId || !mapKey || !difficulty) return;
    const params = gameId === 'where-is-region'
      ? new URLSearchParams({ map: mapKey, mode: 'regions', difficulty: String(difficulty) })
      : new URLSearchParams({ map: mapKey, difficulty: String(difficulty) });
    navigate(`/landmark/games/${gameId}?${params}`);
  }

  return (
    <div className="lm-home">
      <h1 className="lm-title">LandMark</h1>

      {/* Step 1 — Game Mode */}
      <div className="lm-wizard-step">
        <div className="lm-step-header">
          <span className="lm-step-badge">1</span>
          <span className="lm-step-label">Game Mode</span>
        </div>
        <div className="lm-game-list">
          {GAMES.map((g) => (
            <button
              key={g.id}
              className={`lm-game-card${gameId === g.id ? ' active' : ''}`}
              onClick={() => pickGame(g.id)}
            >
              <span className="lm-game-card-title">{g.title}</span>
              <span className="lm-game-card-desc">{g.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2 — City / Region (reveals once game chosen) */}
      {gameId && (
        <div className="lm-wizard-step lm-wizard-step--reveal">
          <div className="lm-step-header">
            <span className="lm-step-badge">2</span>
            <span className="lm-step-label">
              {gameId === 'where-is-region' ? 'Region' : 'City'}
            </span>
          </div>

          {gameId === 'where-is-region' ? (
            <div className="lm-tile-row">
              {REGION_MAPS.map((rm) => (
                <button
                  key={rm.key}
                  className={`lm-tile${mapKey === rm.key ? ' active' : ''}`}
                  onClick={() => pickMap(rm.key)}
                >
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
                    <button
                      key={key}
                      className={`lm-tile${mapKey === key ? ' active' : ''}`}
                      onClick={() => pickMap(key)}
                    >
                      {LANDMARK_MAP_CONFIG[key].label}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Step 3 — Difficulty (reveals once map chosen) */}
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
                onClick={() => setDifficulty(d.value)}
              >
                <span className="lm-diff-num">{d.value}</span>
                <span className="lm-diff-name">{d.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Start (reveals once difficulty chosen) */}
      {difficulty && (
        <button className="start-btn" onClick={start}>
          Start →
        </button>
      )}
    </div>
  );
}

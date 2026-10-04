import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CityPicker from '../../components/landmark/CityPicker';

const DIFFICULTY_LEVELS = [
  { value: 1, name: 'Tourist',      description: 'Labeled map, hints shown' },
  { value: 2, name: 'Traveler',     description: 'Labeled map, no hints' },
  { value: 3, name: 'Explorer',     description: 'Labeled map, no hints' },
  { value: 4, name: 'Cartographer', description: 'Blank map, no hints' },
  { value: 5, name: 'Navigator',    description: 'Blank map, no hints' },
];

const GAMES: { id: string; title: string; description: string; available: boolean }[] = [
  { id: 'match-the-map',        title: 'Match the Map',           description: 'Match numbered pins to their landmark names.',                  available: true  },
  { id: 'where-is-it',          title: 'Where Is It?',            description: 'Drop a pin on the map to locate a landmark.',                    available: true  },
  { id: 'where-is-region',      title: 'Find the Region',         description: 'Drop a pin on a named state, province, or city on a country map.', available: true },
  { id: 'whats-between',        title: "What's Between?",         description: 'Identify the landmark that lies between two others.',             available: false },
  { id: 'put-them-in-order',    title: 'Put Them in Order',       description: 'Sort landmarks by direction, distance, or latitude.',            available: false },
  { id: 'connect-the-dots',     title: 'Connect the Dots',        description: 'Draw the correct route between a series of landmarks.',          available: false },
  { id: 'which-doesnt-belong',  title: "Which One Doesn't Belong?", description: 'Pick the landmark that is out of place geographically.',       available: false },
  { id: 'build-the-map',        title: 'Build the Map',           description: 'Place all the landmarks onto a blank map from memory.',          available: false },
  { id: 'zoom-in',              title: 'Zoom In',                 description: 'Identify a landmark from a progressively revealed close-up.',    available: false },
];

const REGION_MAPS: { key: string; label: string }[] = [
  { key: 'india',  label: 'India' },
  { key: 'africa', label: 'Africa' },
];

export default function LandMarkHome() {
  const navigate = useNavigate();

  const [city, setCity]           = useState<string>(() => sessionStorage.getItem('lm_city')       ?? 'nyc');
  const [gameId, setGameId]       = useState<string>(() => sessionStorage.getItem('lm_game')       ?? 'where-is-it');
  const [difficulty, setDifficulty] = useState<number>(() => Number(sessionStorage.getItem('lm_difficulty')) || 1);
  const [regionMap, setRegionMap] = useState<string>(() => sessionStorage.getItem('lm_region')     ?? 'india');

  function startGame() {
    sessionStorage.setItem('lm_city',       city);
    sessionStorage.setItem('lm_game',       gameId);
    sessionStorage.setItem('lm_difficulty', String(difficulty));
    sessionStorage.setItem('lm_region',     regionMap);
    let params: URLSearchParams;
    if (gameId === 'where-is-region') {
      params = new URLSearchParams({ map: regionMap, mode: 'regions', difficulty: String(difficulty) });
    } else {
      params = new URLSearchParams({ map: city, difficulty: String(difficulty) });
    }
    navigate(`/landmark/games/${gameId}?${params.toString()}`);
  }

  return (
    <div className="lm-home">
      <div className="lm-home-header">
        <h1>LandMark</h1>
        <p>Eight spatial-reasoning games to sharpen your geography skills.</p>
      </div>

      <hr className="home-divider" />

      <CityPicker value={city} onChange={setCity} />

      <hr className="home-divider" />

      <div className="lm-section-label">Game Mode</div>
      <div className="lm-game-grid">
        {GAMES.map((game) => (
          <button
            key={game.id}
            disabled={!game.available}
            className={`lm-game-tile${!game.available ? ' lm-game-tile--soon' : ''}${gameId === game.id ? ' active' : ''}`}
            onClick={() => game.available && setGameId(game.id)}
            title={game.available ? game.description : 'Coming soon'}
          >
            <span className="lm-game-title">{game.title}</span>
            {!game.available && <span className="lm-game-soon-badge">Soon</span>}
          </button>
        ))}
      </div>

      {gameId === 'where-is-region' && (
        <>
          <hr className="home-divider" />
          <div className="lm-section-label">Region</div>
          <div className="lm-region-picker">
            {REGION_MAPS.map((rm) => (
              <button
                key={rm.key}
                className={`lm-region-btn${regionMap === rm.key ? ' active' : ''}`}
                onClick={() => setRegionMap(rm.key)}
              >
                {rm.label}
              </button>
            ))}
          </div>
        </>
      )}

      <hr className="home-divider" />

      <div className="lm-section-label">Difficulty</div>
      <div className="lm-difficulty-buttons">
        {DIFFICULTY_LEVELS.map((level) => (
          <button
            key={level.value}
            className={`difficulty-btn${difficulty === level.value ? ' active' : ''}`}
            onClick={() => setDifficulty(level.value)}
            title={level.description}
          >
            <span className="level-num">{level.value}</span>
            <span className="level-name">{level.name}</span>
          </button>
        ))}
      </div>

      <button className="start-btn" onClick={startGame}>
        Start
      </button>
    </div>
  );
}

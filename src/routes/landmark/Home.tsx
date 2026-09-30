import { Link } from 'react-router-dom';

type GameCard = {
  id: string;
  title: string;
  description: string;
  path: string;
  available: boolean;
};

const GAMES: GameCard[] = [
  {
    id: 'where-is-it',
    title: 'Where Is It?',
    description: 'Drop a pin on the map to locate a landmark.',
    path: '/landmark/games/where-is-it',
    available: true,
  },
  {
    id: 'match-the-map',
    title: 'Match the Map',
    description: 'Match labeled outlines to their correct positions.',
    path: '/landmark/games/match-the-map',
    available: false,
  },
  {
    id: 'whats-between',
    title: "What's Between?",
    description: 'Identify the landmark that lies between two others.',
    path: '/landmark/games/whats-between',
    available: false,
  },
  {
    id: 'put-them-in-order',
    title: 'Put Them in Order',
    description: 'Sort landmarks by direction, distance, or latitude.',
    path: '/landmark/games/put-them-in-order',
    available: false,
  },
  {
    id: 'connect-the-dots',
    title: 'Connect the Dots',
    description: 'Draw the correct route between a series of landmarks.',
    path: '/landmark/games/connect-the-dots',
    available: false,
  },
  {
    id: 'which-doesnt-belong',
    title: "Which One Doesn't Belong?",
    description: 'Pick the landmark that is out of place geographically.',
    path: '/landmark/games/which-doesnt-belong',
    available: false,
  },
  {
    id: 'build-the-map',
    title: 'Build the Map',
    description: 'Place all the landmarks onto a blank map from memory.',
    path: '/landmark/games/build-the-map',
    available: false,
  },
  {
    id: 'zoom-in',
    title: 'Zoom In',
    description: 'Identify a landmark from a progressively revealed close-up.',
    path: '/landmark/games/zoom-in',
    available: false,
  },
];

export default function LandMarkHome() {
  return (
    <div className="landmark-home">
      <div className="landmark-home-header">
        <h1>LandMark</h1>
        <p>Eight spatial-reasoning games to sharpen your geography skills.</p>
      </div>
      <div className="landmark-game-grid">
        {GAMES.map((game) => (
          <div
            key={game.id}
            className={`landmark-game-card${game.available ? '' : ' landmark-game-card--coming-soon'}`}
          >
            {game.available ? (
              <Link to={game.path} className="landmark-card-link">
                <h2>{game.title}</h2>
                <p>{game.description}</p>
                <span className="landmark-play-btn">Play</span>
              </Link>
            ) : (
              <>
                <h2>{game.title}</h2>
                <p>{game.description}</p>
                <span className="landmark-coming-soon">Coming soon</span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

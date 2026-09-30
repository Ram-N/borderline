import { Link, useLocation } from 'react-router-dom';
import type { WhereIsItRound } from '../../types/landmark/game';
import type { Difficulty } from '../../types/landmark/game';

type LocationState = {
  rounds: WhereIsItRound[];
  totalScore: number;
  difficulty: Difficulty;
};

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(2)} km`;
}

export default function LandMarkResults() {
  const location = useLocation();
  const state = location.state as LocationState | null;

  if (!state) {
    return (
      <div className="landmark-results landmark-results--empty">
        <p>No results to show.</p>
        <Link to="/landmark">Back to LandMark</Link>
      </div>
    );
  }

  const { rounds, totalScore } = state;
  const maxScore = rounds.length * 100;
  const pct = Math.round((totalScore / maxScore) * 100);

  return (
    <div className="landmark-results">
      <h1>Results</h1>
      <div className="results-summary">
        <span className="results-total-score">{totalScore}</span>
        <span className="results-max"> / {maxScore} pts</span>
        <span className="results-pct">({pct}%)</span>
      </div>

      <table className="results-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Landmark</th>
            <th>Confidence</th>
            <th>Distance</th>
            <th>Base</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {rounds.map((round, i) => (
            <tr key={round.landmark.id}>
              <td>{i + 1}</td>
              <td>{round.landmark.name}</td>
              <td className={`conf-${round.confidence ?? 'none'}`}>
                {round.confidence ?? '—'}
              </td>
              <td>
                {round.distanceKm !== undefined
                  ? formatDistance(round.distanceKm)
                  : '—'}
              </td>
              <td>{round.baseScore ?? '—'}</td>
              <td className="results-score-cell">
                {round.finalScore ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="results-actions">
        <Link to="/landmark/games/where-is-it" className="results-btn">
          Play Again
        </Link>
        <Link to="/landmark" className="results-btn results-btn--secondary">
          All Games
        </Link>
      </div>
    </div>
  );
}

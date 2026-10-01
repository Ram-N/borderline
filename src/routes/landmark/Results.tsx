import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { WhereIsItRound } from '../../types/landmark/game';
import type { Difficulty } from '../../types/landmark/game';
import { LANDMARK_MAP_CONFIG } from '../../data/landmarkMapConfig';

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  1: 'Tourist',
  2: 'Traveler',
  3: 'Explorer',
  4: 'Cartographer',
  5: 'Navigator',
};

type LocationState = {
  rounds: WhereIsItRound[];
  totalScore: number;
  difficulty: Difficulty;
  city: string;
};

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(2)} km`;
}

function scoreEmoji(pct: number): string {
  if (pct >= 90) return '🟢';
  if (pct >= 70) return '🟡';
  if (pct >= 50) return '🟠';
  return '🔴';
}

export default function LandMarkResults() {
  const location = useLocation();
  const state = location.state as LocationState | null;
  const [copied, setCopied] = useState(false);

  if (!state) {
    return (
      <div className="landmark-results landmark-results--empty">
        <p>No results to show.</p>
        <Link to="/landmark">Back to LandMark</Link>
      </div>
    );
  }

  const { rounds, totalScore, difficulty, city } = state;
  const maxScore = rounds.length * 100;
  const pct = Math.round((totalScore / maxScore) * 100);
  const cityLabel = LANDMARK_MAP_CONFIG[city]?.label ?? city;
  const diffLabel = DIFFICULTY_LABELS[difficulty];
  const emoji = scoreEmoji(pct);

  const shareText =
    `🗺️ LandMark — ${cityLabel}\n` +
    `Level: ${diffLabel} · Score: ${totalScore}/${maxScore} pts ${emoji}\n\n` +
    `Think you can beat that? Try it at landmark.genwise.in`;

  async function handleCopy() {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'LandMark', text: shareText });
      } catch {
        // user cancelled
      }
    }
  }

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

      <div className="results-share-row" style={{ marginTop: '20px' }}>
        <button className="results-btn results-btn--secondary" onClick={handleCopy}>
          {copied ? '✓ Copied!' : '📋 Copy results'}
        </button>
        {typeof navigator !== 'undefined' && navigator.share && (
          <button className="results-btn results-btn--secondary" onClick={handleShare}>
            📤 Share
          </button>
        )}
      </div>

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

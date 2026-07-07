
import { useLocation, Link, Navigate } from 'react-router-dom';

const DIFFICULTY_LABELS = ['Tourist', 'Traveler', 'Explorer', 'Cartographer', 'Diplomat'];

function scoreRating(score: number, total: number): { label: string; color: string } {
  const pct = score / total;
  if (pct >= 1) return { label: 'Perfect!', color: '#1B5E20' };
  if (pct >= 0.8) return { label: 'Great job!', color: '#2E7D32' };
  if (pct >= 0.6) return { label: 'Well done', color: '#F57F17' };
  if (pct >= 0.4) return { label: 'Not bad', color: '#E65100' };
  return { label: 'Keep practicing', color: '#B71C1C' };
}

function DailyBreakdown({ results, score, correctAnswers }: { results: boolean[]; score: number; correctAnswers?: string[] }) {
  const shareGrid = results.map((correct) => correct ? '\u{1f7e9}' : '\u{1f7e5}').join('');
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const shareText = `Borderline Daily ${dateStr}\n${score}/15\n${shareGrid}`;

  return (
    <div className='daily-breakdown'>
      <h3>Breakdown</h3>
      <ul className='daily-levels'>
        {results.map((correct, i) => (
          <li key={i} className={correct ? 'level-correct' : 'level-wrong'}>
            <span>Level {i + 1} — {DIFFICULTY_LABELS[i]}</span>
            <span>
              {correct ? `+${i + 1}` : '0'} pts
              {!correct && correctAnswers?.[i] && (
                <span className='level-answer'> — Answer: {correctAnswers[i]}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
      <button
        className='results-btn results-btn-secondary'
        onClick={() => navigator.clipboard.writeText(shareText)}
      >
        Copy results
      </button>
    </div>
  );
}

export default function Results() {
  const loc = useLocation() as any;
  const score = loc.state?.score;
  const total = loc.state?.total;
  const daily = loc.state?.daily;
  const results: boolean[] | undefined = loc.state?.results;
  const correctAnswers: string[] | undefined = loc.state?.correctAnswers;

  if (score == null) {
    return <Navigate to='/' replace />;
  }

  const rating = scoreRating(score, total);
  const pct = Math.round((score / total) * 100);

  return (
    <div className='results-page'>
      <div className='results-card'>
        <h2 className='results-title'>{daily ? 'Daily Puzzle' : 'Results'}</h2>
        <div className='results-score-ring' style={{ borderColor: rating.color }}>
          <span className='results-score-num'>{score}</span>
          <span className='results-score-den'>/ {total}</span>
        </div>
        <p className='results-pct' style={{ color: rating.color }}>{pct}% — {rating.label}</p>
        {daily && results && <DailyBreakdown results={results} score={score} correctAnswers={correctAnswers} />}
        <div className='results-actions'>
          {daily ? (
            <Link to='/' className='results-btn results-btn-primary'>Back to home</Link>
          ) : (
            <>
              <Link to='/' className='results-btn results-btn-primary'>Play again</Link>
              <Link to='/play' className='results-btn results-btn-secondary'>Change settings</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

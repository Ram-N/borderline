
import { useLocation, Link, Navigate } from 'react-router-dom';

const DIFFICULTY_LABELS = ['Tourist', 'Traveler', 'Explorer', 'Cartographer', 'Diplomat'];

function DailyBreakdown({ results, score }: { results: boolean[]; score: number }) {
  const shareGrid = results.map((correct, i) => correct ? '\u{1f7e9}' : '\u{1f7e5}').join('');
  const shareText = `Borderline Daily ${new Date().toISOString().split('T')[0]}\n${score}/15\n${shareGrid}`;

  return (
    <div className='daily-breakdown'>
      <h3>Breakdown</h3>
      <ul className='daily-levels'>
        {results.map((correct, i) => (
          <li key={i} className={correct ? 'level-correct' : 'level-wrong'}>
            <span>Level {i + 1} — {DIFFICULTY_LABELS[i]}</span>
            <span>{correct ? `+${i + 1}` : '0'} pts</span>
          </li>
        ))}
      </ul>
      <button
        className='start-btn'
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

  if (score == null) {
    return <Navigate to='/' replace />;
  }

  return (
    <div className='results'>
      <h2>{daily ? 'Daily Puzzle Results' : 'Results'}</h2>
      <p>Score: {score} / {total}</p>
      {daily && results && <DailyBreakdown results={results} score={score} />}
      <Link to='/'>{daily ? 'Back to home' : 'Play again'}</Link>
    </div>
  );
}

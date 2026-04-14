
import { useLocation, Link, Navigate } from 'react-router-dom';

export default function Results() {
  const loc = useLocation() as any;
  const score = loc.state?.score;
  const total = loc.state?.total;

  if (score == null) {
    return <Navigate to='/' replace />;
  }

  return (
    <div className='results'>
      <h2>Results</h2>
      <p>Score: {score} / {total}</p>
      <Link to='/'>Play again</Link>
    </div>
  );
}

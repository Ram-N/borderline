
import { useLocation, Link } from 'react-router-dom';

export default function Results() {
  const loc = useLocation() as any;
  const score = loc.state?.score ?? 0;
  const total = loc.state?.total ?? 0;

  return (
    <div className='results'>
      <h2>Results</h2>
      <p>Score: {score} / {total}</p>
      <Link to='/'>Play again</Link>
    </div>
  );
}

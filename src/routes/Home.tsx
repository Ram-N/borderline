import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import RegionGrid from '../components/RegionGrid';
import CountPicker from '../components/CountPicker';
import DifficultyPicker from '../components/DifficultyPicker';

function formatDate(): string {
  const d = new Date();
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function Home() {
  const navigate = useNavigate();
  const [puzzleRegion, setPuzzleRegion] = useState<string>(() => sessionStorage.getItem('bl_region') ?? 'europe');
  const [puzzleCount, setPuzzleCount] = useState<number>(() => Number(sessionStorage.getItem('bl_count')) || 5);
  const [difficulty, setDifficulty] = useState<number>(() => Number(sessionStorage.getItem('bl_difficulty')) || 3);

  function startPuzzle() {
    sessionStorage.setItem('bl_region', puzzleRegion);
    sessionStorage.setItem('bl_count', String(puzzleCount));
    sessionStorage.setItem('bl_difficulty', String(difficulty));
    const params = new URLSearchParams({ region: puzzleRegion, n: String(puzzleCount), difficulty: String(difficulty) });
    navigate(`/puzzle?${params.toString()}`);
  }

  return (
    <div className='home'>
      <h1>Borderline</h1>
      <p>Can you name a country's neighbors from the map?</p>

      <Link to='/daily' className='daily-cta'>
        <span className='daily-cta-label'>Daily Puzzle</span>
        <span className='daily-cta-date'>{formatDate()}</span>
      </Link>

      <hr className='home-divider' />

      <RegionGrid value={puzzleRegion} onChange={setPuzzleRegion} />

      <CountPicker value={puzzleCount} onChange={setPuzzleCount} />

      <DifficultyPicker value={difficulty} onChange={setDifficulty} />

      <button className='start-btn' onClick={startPuzzle}>Start</button>
    </div>
  );
}

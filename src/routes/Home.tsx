import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RegionGrid from '../components/RegionGrid';
import CountPicker from '../components/CountPicker';
import DifficultyPicker from '../components/DifficultyPicker';

export default function Home() {
  const navigate = useNavigate();
  const [puzzleRegion, setPuzzleRegion] = useState<string>('europe');
  const [puzzleCount, setPuzzleCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<number>(3);

  function startPuzzle() {
    const params = new URLSearchParams({ region: puzzleRegion, n: String(puzzleCount), difficulty: String(difficulty) });
    navigate(`/puzzle?${params.toString()}`);
  }

  return (
    <div className='home'>
      <h1>Borderline</h1>
      <p>Can you name a country's neighbors from the map?</p>

      <RegionGrid value={puzzleRegion} onChange={setPuzzleRegion} />

      <CountPicker value={puzzleCount} onChange={setPuzzleCount} />

      <DifficultyPicker value={difficulty} onChange={setDifficulty} />

      <button className='start-btn' onClick={startPuzzle}>Start</button>
    </div>
  );
}

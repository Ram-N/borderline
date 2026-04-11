import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RegionPicker from '../components/RegionPicker';
import StartPanel from '../components/StartPanel';

export default function Home() {
  const navigate = useNavigate();
  const [manifest, setManifest] = useState<{ sets: { id: string; path: string }[] } | null>(null);
  const [selected, setSelected] = useState<string>('');
  const [count, setCount] = useState<number>(5);
  const [puzzleCount, setPuzzleCount] = useState<number>(5);
  const [puzzleRegion, setPuzzleRegion] = useState<string>('europe');

  useEffect(() => {
    fetch('/data/questions.index.json')
      .then(r => r.json())
      .then(setManifest)
      .catch(() => setManifest({ sets: [] }));
  }, []);

  function start() {
    if (!selected) return;
    const params = new URLSearchParams({ set: selected, n: String(count) });
    navigate(`/play?${params.toString()}`);
  }

  function startPuzzle() {
    const params = new URLSearchParams({ region: puzzleRegion, n: String(puzzleCount) });
    navigate(`/puzzle?${params.toString()}`);
  }

  return (
    <div className='home'>
      <h1>Borderline</h1>
      <p>Image-based neighbors quiz. Pick a set and start.</p>
      <RegionPicker manifest={manifest} selected={selected} onChange={setSelected} />
      <StartPanel count={count} onCount={setCount} />
      <button onClick={start} disabled={!selected}>Start Quiz</button>

      <hr className='home-divider' />

      <h2>Puzzle Mode</h2>
      <p>The map is the question — identify a hidden country or a missing neighbor.</p>
      <div className='start-panel'>
        <label>
          Region:
          <select value={puzzleRegion} onChange={e => setPuzzleRegion(e.target.value)}>
            <option value='europe'>Europe</option>
            <option value='africa'>Africa</option>
            <option value='asia'>Asia</option>
            <option value='caribbean'>Caribbean</option>
            <option value='central-america'>Central America</option>
            <option value='latin-america'>Latin America</option>
            <option value='middle-east'>Middle East</option>
            <option value='north-america'>North America</option>
            <option value='oceania'>Oceania</option>
            <option value='south-america'>South America</option>
          </select>
        </label>
        <label>
          Puzzles:
          <input type='number' value={puzzleCount} min={1} max={10} onChange={e => setPuzzleCount(Number(e.target.value))} />
        </label>
      </div>
      <button onClick={startPuzzle}>Start Puzzle</button>
    </div>
  );
}

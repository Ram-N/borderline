import { useEffect, useState } from 'react';
import type { PuzzleIndex } from '../../types/puzzleDb';

export default function QaDistribution() {
  const [index, setIndex] = useState<PuzzleIndex | null>(null);

  useEffect(() => {
    fetch('/data/puzzles/index.json')
      .then(r => r.json())
      .then(data => setIndex(data as PuzzleIndex))
      .catch(() => {});
  }, []);

  if (!index) return <div className="loading">Loading index…</div>;

  // Compute distributions
  const byDifficulty: Record<number, number> = {};
  const byRegion: Record<string, number> = {};
  const byContinent: Record<string, number> = {};
  let approved = 0;

  for (const p of index.puzzles) {
    byDifficulty[p.difficulty] = (byDifficulty[p.difficulty] ?? 0) + 1;
    byRegion[p.region] = (byRegion[p.region] ?? 0) + 1;
    byContinent[p.continent] = (byContinent[p.continent] ?? 0) + 1;
    if (p.approved) approved++;
  }

  const maxRegion = Math.max(...Object.values(byRegion));
  const maxContinent = Math.max(...Object.values(byContinent));

  return (
    <div className="qa-distribution">
      <h2>Distribution ({index.totalCount} total, {approved} approved)</h2>

      <h3>By Difficulty</h3>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        {[1, 2, 3, 4, 5].map(d => (
          <div key={d} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{byDifficulty[d] ?? 0}</div>
            <div style={{ fontSize: '0.8rem', color: '#999' }}>L{d}</div>
          </div>
        ))}
      </div>

      <h3>By Region</h3>
      {Object.entries(byRegion).sort((a, b) => b[1] - a[1]).map(([region, count]) => (
        <div key={region} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ width: '140px', fontSize: '0.85rem' }}>{region}</span>
          <div style={{
            height: '16px',
            width: `${(count / maxRegion) * 300}px`,
            background: '#4caf50',
            borderRadius: '2px',
          }} />
          <span style={{ fontSize: '0.8rem', color: '#999' }}>{count}</span>
        </div>
      ))}

      <h3>By Continent</h3>
      {Object.entries(byContinent).sort((a, b) => b[1] - a[1]).map(([continent, count]) => (
        <div key={continent} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ width: '100px', fontSize: '0.85rem' }}>{continent}</span>
          <div style={{
            height: '16px',
            width: `${(count / maxContinent) * 300}px`,
            background: '#2196f3',
            borderRadius: '2px',
          }} />
          <span style={{ fontSize: '0.8rem', color: '#999' }}>{count}</span>
        </div>
      ))}
    </div>
  );
}

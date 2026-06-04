import { useEffect, useState } from 'react';
import type { PuzzleIndex, PuzzleIndexEntry } from '../../types/puzzleDb';
import { REGION_CONFIG } from '../../data/regionConfig';

export default function QaRenderBatch() {
  const [index, setIndex] = useState<PuzzleIndex | null>(null);
  const [regionFilter, setRegionFilter] = useState('');

  useEffect(() => {
    fetch('/data/puzzles/index.json')
      .then(r => r.json())
      .then(data => setIndex(data as PuzzleIndex))
      .catch(() => {});
  }, []);

  if (!index) return <div className="loading">Loading index…</div>;

  const puzzles = regionFilter
    ? index.puzzles.filter(p => p.region === regionFilter)
    : index.puzzles;

  // Group by country
  const byCountry = new Map<string, PuzzleIndexEntry[]>();
  for (const p of puzzles) {
    const key = `${p.region}/${p.countryCode}`;
    if (!byCountry.has(key)) byCountry.set(key, []);
    byCountry.get(key)!.push(p);
  }

  return (
    <div className="qa-render-batch">
      <h2>Render Batch ({puzzles.length} puzzles)</h2>
      <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
        <option value="">All Regions</option>
        {Object.entries(REGION_CONFIG).map(([key, c]) => (
          <option key={key} value={key}>{c.label}</option>
        ))}
      </select>

      <table style={{ width: '100%', marginTop: '16px', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #444', padding: '4px' }}>Country</th>
            <th style={{ borderBottom: '1px solid #444', padding: '4px' }}>Region</th>
            <th style={{ borderBottom: '1px solid #444', padding: '4px' }}>L1</th>
            <th style={{ borderBottom: '1px solid #444', padding: '4px' }}>L2</th>
            <th style={{ borderBottom: '1px solid #444', padding: '4px' }}>L3</th>
            <th style={{ borderBottom: '1px solid #444', padding: '4px' }}>L4</th>
            <th style={{ borderBottom: '1px solid #444', padding: '4px' }}>L5</th>
          </tr>
        </thead>
        <tbody>
          {[...byCountry.entries()].sort().map(([key, entries]) => {
            const first = entries[0];
            const byDiff: Record<number, PuzzleIndexEntry[]> = {};
            entries.forEach(e => {
              if (!byDiff[e.difficulty]) byDiff[e.difficulty] = [];
              byDiff[e.difficulty].push(e);
            });
            return (
              <tr key={key}>
                <td style={{ padding: '4px' }}>{first.countryName} ({first.countryCode})</td>
                <td style={{ padding: '4px', textAlign: 'center' }}>{first.region}</td>
                {[1, 2, 3, 4, 5].map(d => {
                  const dEntries = byDiff[d] ?? [];
                  const approved = dEntries.filter(e => e.approved).length;
                  return (
                    <td key={d} style={{ padding: '4px', textAlign: 'center' }}>
                      {dEntries.length > 0
                        ? <span style={{ color: approved > 0 ? '#4caf50' : '#ff9800' }}>{dEntries.length}</span>
                        : <span style={{ color: '#666' }}>—</span>
                      }
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

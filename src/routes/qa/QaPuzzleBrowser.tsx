import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { PuzzleIndex, PuzzleIndexEntry } from '../../types/puzzleDb';
import { REGION_CONFIG } from '../../data/regionConfig';

export default function QaPuzzleBrowser() {
  const [index, setIndex] = useState<PuzzleIndex | null>(null);
  const [regionFilter, setRegionFilter] = useState('');
  const [diffFilter, setDiffFilter] = useState('');
  const [approvedFilter, setApprovedFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/data/puzzles/index.json')
      .then(r => r.json())
      .then(data => setIndex(data as PuzzleIndex))
      .catch(() => {});
  }, []);

  if (!index) return <div className="loading">Loading index…</div>;

  let puzzles = index.puzzles;
  if (regionFilter) puzzles = puzzles.filter(p => p.region === regionFilter);
  if (diffFilter) puzzles = puzzles.filter(p => p.difficulty === Number(diffFilter));
  if (approvedFilter === 'yes') puzzles = puzzles.filter(p => p.approved);
  if (approvedFilter === 'no') puzzles = puzzles.filter(p => !p.approved);
  if (search) {
    const q = search.toLowerCase();
    const regionLabels: Record<string, string> = {};
    for (const [key, c] of Object.entries(REGION_CONFIG)) {
      regionLabels[key] = c.label.toLowerCase();
    }
    puzzles = puzzles.filter(p =>
      p.id.toLowerCase().includes(q) ||
      p.countryName.toLowerCase().includes(q) ||
      p.countryCode.toLowerCase().includes(q) ||
      p.region.toLowerCase().includes(q) ||
      (regionLabels[p.region] ?? '').includes(q)
    );
  }

  return (
    <div className="qa-puzzle-browser">
      <h2>Puzzle Browser ({puzzles.length} / {index.totalCount})</h2>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search by country, code, or region…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '6px 10px', border: '2px solid #ccc', borderRadius: '6px', fontSize: '0.9rem', minWidth: '250px' }}
        />
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
          <option value="">All Regions</option>
          {Object.entries(REGION_CONFIG).map(([key, c]) => (
            <option key={key} value={key}>{c.label}</option>
          ))}
        </select>
        <select value={diffFilter} onChange={e => setDiffFilter(e.target.value)}>
          <option value="">All Levels</option>
          {[1, 2, 3, 4, 5].map(d => <option key={d} value={d}>L{d}</option>)}
        </select>
        <select value={approvedFilter} onChange={e => setApprovedFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="yes">Approved</option>
          <option value="no">Not Approved</option>
        </select>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #444', padding: '4px' }}>ID</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #444', padding: '4px' }}>Country</th>
            <th style={{ borderBottom: '1px solid #444', padding: '4px' }}>Level</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #444', padding: '4px' }}>Region</th>
            <th style={{ borderBottom: '1px solid #444', padding: '4px' }}>Approved</th>
            <th style={{ borderBottom: '1px solid #444', padding: '4px' }}>Preview</th>
          </tr>
        </thead>
        <tbody>
          {puzzles.slice(0, 200).map((p, i) => (
            <tr key={`${p.region}/${p.id}_${i}`}>
              <td style={{ padding: '4px', fontFamily: 'monospace' }}>{p.id}</td>
              <td style={{ padding: '4px' }}>{p.countryName}</td>
              <td style={{ padding: '4px', textAlign: 'center' }}>{p.difficulty}</td>
              <td style={{ padding: '4px' }}>{p.region}</td>
              <td style={{ padding: '4px', textAlign: 'center' }}>{p.approved ? '✓' : '—'}</td>
              <td style={{ padding: '4px', textAlign: 'center' }}>
                <Link to={`/qa/puzzles/${p.region}/${p.id}`}>View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {puzzles.length > 200 && <p style={{ color: '#999' }}>Showing first 200 of {puzzles.length}</p>}
    </div>
  );
}

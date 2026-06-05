import { useEffect, useState } from 'react';
import { REGION_CONFIG } from '../../data/regionConfig';
import { parseSvg } from '../../utils/parseSvg';
import { computeCentroid } from '../../utils/computeCentroid';
import type { AdjacencyData } from '../../utils/generatePuzzle';
import type { CannedPuzzle } from '../../types/puzzleDb';
import PuzzleMapView from '../../components/PuzzleMapView';
import PuzzleChoices from '../../components/PuzzleChoices';
import TextAnswer from '../../components/TextAnswer';

export default function QaRenderSingle() {
  const [region, setRegion] = useState('europe');
  const [puzzleId, setPuzzleId] = useState('');
  const [canned, setCanned] = useState<CannedPuzzle | null>(null);
  const [error, setError] = useState('');
  const [countryNames, setCountryNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const config = REGION_CONFIG[region];
    if (!config) return;
    Promise.all([
      fetch(config.adjacencyUrl).then(r => r.json()),
      parseSvg(config.svgMap),
    ]).then(([adj, { paths }]) => {
      const names: Record<string, string> = {};
      paths.forEach(p => { names[p.id] = p.title || p.id; });
      Object.entries(adj as AdjacencyData).forEach(([code, data]) => {
        if (!names[code]) names[code] = data.name;
      });
      setCountryNames(names);
    });
  }, [region]);

  function loadPuzzle() {
    if (!puzzleId) return;
    setError('');
    setCanned(null);
    fetch(`/data/puzzles/${region}/${puzzleId}.json`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => setCanned(data as CannedPuzzle))
      .catch(e => setError(e.message));
  }

  return (
    <div className="qa-render-single">
      <h2>Render Single Puzzle</h2>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <select value={region} onChange={e => setRegion(e.target.value)}>
          {Object.entries(REGION_CONFIG).map(([key, c]) => (
            <option key={key} value={key}>{c.label}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Puzzle ID (e.g. FR_1_A)"
          value={puzzleId}
          onChange={e => setPuzzleId(e.target.value)}
        />
        <button onClick={loadPuzzle}>Load</button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {canned && (
        <div>
          <h3>{canned.meta.countryName} — L{canned.meta.difficulty} ({canned.meta.variant})</h3>
          <pre style={{ fontSize: '0.75rem', background: '#1a1a2e', color: '#e0e0e0', padding: '8px', borderRadius: '4px', overflow: 'auto' }}>
            {JSON.stringify(canned.meta, null, 2)}
          </pre>
          <PuzzleMapView
            svgMap={canned.puzzle.svgMap}
            puzzle={canned.puzzle}
            phase="question"
            selectedAnswer={null}
            countryNames={countryNames}
            difficulty={canned.meta.difficulty}
          />
          {canned.meta.difficulty === 5 ? (
            <TextAnswer
              correctAnswer={canned.puzzle.correctAnswer}
              countryNames={countryNames}
              phase="question"
              selected={null}
              onSubmit={() => {}}
            />
          ) : (
            <PuzzleChoices
              choices={canned.puzzle.choices}
              countryNames={countryNames}
              selected={null}
              correct={canned.puzzle.correctAnswer}
              phase="question"
              onSelect={() => {}}
            />
          )}
        </div>
      )}
    </div>
  );
}

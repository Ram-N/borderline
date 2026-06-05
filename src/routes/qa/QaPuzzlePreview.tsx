import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { parseSvg } from '../../utils/parseSvg';
import { REGION_CONFIG } from '../../data/regionConfig';
import type { AdjacencyData } from '../../utils/generatePuzzle';
import type { CannedPuzzle } from '../../types/puzzleDb';
import PuzzleMapView from '../../components/PuzzleMapView';
import PuzzleChoices from '../../components/PuzzleChoices';
import TextAnswer from '../../components/TextAnswer';

export default function QaPuzzlePreview() {
  const { region, id } = useParams<{ region: string; id: string }>();
  const [canned, setCanned] = useState<CannedPuzzle | null>(null);
  const [countryNames, setCountryNames] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<'question' | 'reveal'>('question');
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!region || !id) return;
    fetch(`/data/puzzles/${region}/${id}.json`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => setCanned(data as CannedPuzzle))
      .catch(e => setError(e.message));
  }, [region, id]);

  useEffect(() => {
    if (!region) return;
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

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!canned) return <div className="loading">Loading puzzle…</div>;

  const { meta, puzzle } = canned;

  function handleSelect(iso: string) {
    setSelected(iso);
    setPhase('reveal');
  }

  return (
    <div className="qa-puzzle-preview">
      <h2>{meta.countryName} — Level {meta.difficulty} ({meta.variant})</h2>
      <div style={{ background: '#1a1a2e', color: '#e0e0e0', padding: '8px 12px', borderRadius: '4px', marginBottom: '12px', fontSize: '0.85rem' }}>
        <strong>Type:</strong> {puzzle.type === 'hidden_country' ? 'Hidden Country' : 'Missing Neighbor'}
        {puzzle.type === 'missing_neighbor' && (
          <span> — Center: <strong>{countryNames[puzzle.center] || puzzle.center}</strong>, answer is its hidden neighbor: <strong>{countryNames[puzzle.correctAnswer] || puzzle.correctAnswer}</strong></span>
        )}
        {puzzle.type === 'hidden_country' && (
          <span> — The orange country IS the answer: <strong>{countryNames[puzzle.correctAnswer] || puzzle.correctAnswer}</strong></span>
        )}
      </div>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <PuzzleMapView
            svgMap={puzzle.svgMap}
            puzzle={puzzle}
            phase={phase}
            selectedAnswer={selected}
            countryNames={countryNames}
            difficulty={meta.difficulty}
          />
          {meta.difficulty === 5 ? (
            <TextAnswer
              correctAnswer={puzzle.correctAnswer}
              countryNames={countryNames}
              phase={phase}
              selected={selected}
              onSubmit={handleSelect}
            />
          ) : (
            <PuzzleChoices
              choices={puzzle.choices}
              countryNames={countryNames}
              selected={selected}
              correct={puzzle.correctAnswer}
              phase={phase}
              onSelect={handleSelect}
            />
          )}
          {phase === 'reveal' && (
            <button onClick={() => { setPhase('question'); setSelected(null); }}>
              Reset
            </button>
          )}
        </div>
        <div style={{ flex: 1, minWidth: '250px' }}>
          <h3>Metadata</h3>
          <pre style={{ fontSize: '0.75rem', background: '#1a1a2e', color: '#e0e0e0', padding: '8px', borderRadius: '4px', overflow: 'auto' }}>
            {JSON.stringify(meta, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

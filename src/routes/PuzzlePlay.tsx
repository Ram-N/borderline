import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { parseSvg } from '../utils/parseSvg';
import { type AdjacencyData } from '../utils/generatePuzzle';
import { REGION_CONFIG } from '../data/regionConfig';
import usePuzzleEngine from '../hooks/usePuzzleEngine';
import PuzzleMapView from '../components/PuzzleMapView';
import PuzzleChoices from '../components/PuzzleChoices';
import ScorePanel from '../components/ScorePanel';

export default function PuzzlePlay() {
  const qs = new URLSearchParams(useLocation().search);
  const region = qs.get('region') ?? 'europe';
  const n = Number(qs.get('n') ?? '5');

  const config = REGION_CONFIG[region] ?? REGION_CONFIG.europe;

  const [adjacency, setAdjacency] = useState<AdjacencyData | null>(null);
  const [regionCodes, setRegionCodes] = useState<string[] | null>(null);
  const [countryNames, setCountryNames] = useState<Record<string, string>>({});

  useEffect(() => {
    setAdjacency(null);
    setRegionCodes(null);
    Promise.all([
      fetch(config.adjacencyUrl).then(r => r.json()),
      parseSvg(config.svgMap),
    ]).then(([adj, { paths }]) => {
      setAdjacency(adj as AdjacencyData);
      setRegionCodes(paths.map(p => p.id));
      const names: Record<string, string> = {};
      paths.forEach(p => { names[p.id] = p.title || p.id; });
      Object.entries(adj as AdjacencyData).forEach(([code, data]) => {
        if (!names[code]) names[code] = data.name;
      });
      setCountryNames(names);
    });
  }, [config.svgMap, config.adjacencyUrl]);

  if (!adjacency || !regionCodes) return <div className='loading'>Loading puzzle…</div>;

  return (
    <PuzzleContent
      adjacency={adjacency}
      regionCodes={regionCodes}
      countryNames={countryNames}
      svgMap={config.svgMap}
      region={region}
      n={n}
    />
  );
}

function PuzzleContent({
  adjacency, regionCodes, countryNames, svgMap, region, n,
}: {
  adjacency: AdjacencyData;
  regionCodes: string[];
  countryNames: Record<string, string>;
  svgMap: string;
  region: string;
  n: number;
}) {
  const navigate = useNavigate();
  const { puzzles, index, total, phase, selected, score, done, select, next } = usePuzzleEngine({
    adjacency,
    regionCodes,
    svgMap,
    region,
    n,
    types: ['hidden_country', 'missing_neighbor'],
  });

  if (done) {
    navigate('/results', { state: { score, total } });
    return null;
  }

  if (total === 0) return <div>Could not generate puzzles for this region.</div>;

  const puzzle = puzzles[index];
  const isState = region.endsWith('-states');

  return (
    <div className='play'>
      <ScorePanel index={index} total={total} score={score} />
      <PuzzleMapView
        svgMap={svgMap}
        puzzle={puzzle}
        phase={phase}
        selectedAnswer={selected}
        countryNames={countryNames}
      />
      <div className='puzzle-prompt'>
        {puzzle.type === 'hidden_country'
          ? `Which ${isState ? 'state' : 'country'} is hidden in the center?`
          : `Which ${isState ? 'state' : 'country'} is the missing neighbor?`}
      </div>
      <PuzzleChoices
        choices={puzzle.choices}
        countryNames={countryNames}
        selected={selected}
        correct={puzzle.correctAnswer}
        phase={phase}
        onSelect={select}
      />
      {phase === 'reveal' && (
        <div className='controls'>
          <button onClick={next}>Next</button>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { parseSvg } from '../utils/parseSvg';
import { type AdjacencyData } from '../utils/generatePuzzle';
import { computeCentroid } from '../utils/computeCentroid';
import { REGION_CONFIG } from '../data/regionConfig';
import usePuzzleEngine from '../hooks/usePuzzleEngine';
import PuzzleMapView from '../components/PuzzleMapView';
import PuzzleChoices from '../components/PuzzleChoices';
import TextAnswer from '../components/TextAnswer';
import ScorePanel from '../components/ScorePanel';

export default function PuzzlePlay() {
  const qs = new URLSearchParams(useLocation().search);
  const region = qs.get('region') ?? 'europe';
  const n = Number(qs.get('n') ?? '5');
  const difficulty = (Number(qs.get('difficulty') ?? '1') as 1 | 2 | 3 | 4 | 5);

  const config = REGION_CONFIG[region] ?? REGION_CONFIG.europe;

  const [adjacency, setAdjacency] = useState<AdjacencyData | null>(null);
  const [regionCodes, setRegionCodes] = useState<string[] | null>(null);
  const [countryNames, setCountryNames] = useState<Record<string, string>>({});
  const [svgViewBox, setSvgViewBox] = useState<string | null>(null);
  const [validTargets, setValidTargets] = useState<Set<string> | null>(null);

  useEffect(() => {
    setAdjacency(null);
    setRegionCodes(null);
    setValidTargets(null);
    Promise.all([
      fetch(config.adjacencyUrl).then(r => r.json()),
      parseSvg(config.svgMap),
    ]).then(([adj, { paths, viewBox }]) => {
      setAdjacency(adj as AdjacencyData);
      setRegionCodes(paths.map(p => p.id));
      setSvgViewBox(viewBox);
      const names: Record<string, string> = {};
      paths.forEach(p => { names[p.id] = p.title || p.id; });
      Object.entries(adj as AdjacencyData).forEach(([code, data]) => {
        if (!names[code]) names[code] = data.name;
      });
      setCountryNames(names);
      // Countries with bbox area >= 100 SVG units² are large enough to identify by shape
      const large = new Set(paths.filter(p => {
        const c = computeCentroid(p.d);
        return c.w * c.h >= 100;
      }).map(p => p.id));
      setValidTargets(large);
    });
  }, [config.svgMap, config.adjacencyUrl]);

  if (!adjacency || !regionCodes || !validTargets) return <div className='loading'>Loading puzzle…</div>;

  return (
    <PuzzleContent
      adjacency={adjacency}
      regionCodes={regionCodes}
      countryNames={countryNames}
      svgMap={config.svgMap}
      svgViewBox={svgViewBox ?? undefined}
      region={region}
      n={n}
      difficulty={difficulty}
      validTargets={validTargets}
    />
  );
}

function PuzzleContent({
  adjacency, regionCodes, countryNames, svgMap, svgViewBox, region, n, difficulty, validTargets,
}: {
  adjacency: AdjacencyData;
  regionCodes: string[];
  countryNames: Record<string, string>;
  svgMap: string;
  svgViewBox?: string;
  region: string;
  n: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  validTargets: Set<string>;
}) {
  const navigate = useNavigate();
  const { puzzles, index, total, phase, selected, score, done, select, next } = usePuzzleEngine({
    adjacency,
    regionCodes,
    svgMap,
    region,
    n,
    difficulty,
    validTargets,
  });

  if (done) {
    navigate('/results', { state: { score, total } });
    return null;
  }

  if (total === 0) return <div>Could not generate puzzles for this region.</div>;

  const puzzle = puzzles[index];
  const prompt = puzzle.type === 'hidden_country'
    ? 'Which country is highlighted?'
    : 'Name the highlighted neighbor.';

  return (
    <div className='play'>
      <ScorePanel index={index} total={total} score={score} />
      <p className='puzzle-prompt'>{prompt}</p>
      <PuzzleMapView
        svgMap={svgMap}
        puzzle={puzzle}
        phase={phase}
        selectedAnswer={selected}
        countryNames={countryNames}
        difficulty={difficulty}
        svgViewBox={svgViewBox}
      />
      {difficulty === 5 ? (
        <TextAnswer
          key={index}
          correctAnswer={puzzle.correctAnswer}
          countryNames={countryNames}
          phase={phase}
          selected={selected}
          onSubmit={select}
        />
      ) : (
        <PuzzleChoices
          choices={puzzle.choices}
          countryNames={countryNames}
          selected={selected}
          correct={puzzle.correctAnswer}
          phase={phase}
          onSelect={select}
        />
      )}
      {phase === 'reveal' && (
        <div className='controls'>
          <button className='start-btn' onClick={next}>Next</button>
        </div>
      )}
    </div>
  );
}

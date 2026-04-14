import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { parseSvg } from '../utils/parseSvg';
import { type AdjacencyData } from '../utils/generatePuzzle';
import { computeCentroid } from '../utils/computeCentroid';
import { REGION_CONFIG } from '../data/regionConfig';
import usePuzzleEngine, { type RegionSlot } from '../hooks/usePuzzleEngine';
import PuzzleMapView from '../components/PuzzleMapView';
import PuzzleChoices from '../components/PuzzleChoices';
import TextAnswer from '../components/TextAnswer';
import ScorePanel from '../components/ScorePanel';

export default function PuzzlePlay() {
  const qs = new URLSearchParams(useLocation().search);
  const region = qs.get('region') ?? 'europe';
  const n = Number(qs.get('n') ?? '5');
  const difficulty = (Number(qs.get('difficulty') ?? '1') as 1 | 2 | 3 | 4 | 5);

  const [adjacency, setAdjacency] = useState<AdjacencyData | null>(null);
  const [regionCodes, setRegionCodes] = useState<string[] | null>(null);
  const [countryNames, setCountryNames] = useState<Record<string, string>>({});
  const [svgViewBox, setSvgViewBox] = useState<string | null>(null);
  const [validTargets, setValidTargets] = useState<Set<string> | null>(null);
  const [regionPool, setRegionPool] = useState<RegionSlot[] | null>(null);

  useEffect(() => {
    setAdjacency(null);
    setRegionCodes(null);
    setValidTargets(null);
    setRegionPool(null);

    if (region === 'any') {
      // Load world adjacency + all regional SVGs in parallel
      const regionKeys = Object.keys(REGION_CONFIG);
      Promise.all([
        fetch('/data/adjacency.json').then(r => r.json()),
        ...regionKeys.map(key =>
          parseSvg(REGION_CONFIG[key].svgMap).then(({ paths }) => ({ key, paths }))
        ),
      ]).then(([adj, ...regionData]) => {
        const worldAdj = adj as AdjacencyData;
        const names: Record<string, string> = {};
        const pool: RegionSlot[] = regionData.map(({ key, paths }) => {
          const codes = paths.map((p: any) => p.id);
          paths.forEach((p: any) => { names[p.id] = p.title || p.id; });
          const vt = new Set(paths.filter((p: any) => {
            const c = computeCentroid(p.d);
            return c.w * c.h >= 100;
          }).map((p: any) => p.id));
          return { adjacency: worldAdj, regionCodes: codes, svgMap: REGION_CONFIG[key].svgMap, region: key, validTargets: vt };
        });
        Object.entries(worldAdj).forEach(([code, data]) => {
          if (!names[code]) names[code] = data.name;
        });
        setAdjacency(worldAdj);
        setCountryNames(names);
        setRegionPool(pool);
        setRegionCodes([]);       // not used — pool drives puzzle generation
        setValidTargets(new Set());
        setSvgViewBox(null);
      });
    } else {
      const config = REGION_CONFIG[region] ?? REGION_CONFIG.europe;
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
        const large = new Set(paths.filter(p => {
          const c = computeCentroid(p.d);
          return c.w * c.h >= 100;
        }).map(p => p.id));
        setValidTargets(large);
      });
    }
  }, [region]);

  const ready = adjacency && regionCodes !== null && validTargets !== null;
  if (!ready) return <div className='loading'>Loading puzzle…</div>;

  const config = REGION_CONFIG[region] ?? REGION_CONFIG.europe;

  return (
    <PuzzleContent
      adjacency={adjacency!}
      regionCodes={regionCodes!}
      countryNames={countryNames}
      svgMap={region === 'any' ? '' : config.svgMap}
      svgViewBox={svgViewBox ?? undefined}
      region={region}
      n={n}
      difficulty={difficulty}
      validTargets={validTargets!}
      regionPool={regionPool ?? undefined}
    />
  );
}

function PuzzleContent({
  adjacency, regionCodes, countryNames, svgMap, svgViewBox, region, n, difficulty, validTargets, regionPool,
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
  regionPool?: RegionSlot[];
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
    regionPool,
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Enter' && phase === 'reveal') next();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, next]);

  if (done) {
    navigate('/results', { state: { score, total } });
    return null;
  }

  if (total === 0) return <div>Could not generate puzzles for this region.</div>;

  const puzzle = puzzles[index];
  const prompt = puzzle.type === 'hidden_country'
    ? 'Which country is highlighted?'
    : 'Name the highlighted neighbor.';

  // In "any" mode each puzzle carries its own svgMap; viewBox is computed dynamically
  const puzzleSvgMap = regionPool ? puzzle.svgMap : svgMap;
  const puzzleSvgViewBox = regionPool ? undefined : svgViewBox;

  return (
    <div className='play'>
      <ScorePanel index={index} total={total} score={score} />
      <p className='puzzle-prompt'>{prompt}</p>
      <PuzzleMapView
        svgMap={puzzleSvgMap}
        puzzle={puzzle}
        phase={phase}
        selectedAnswer={selected}
        countryNames={countryNames}
        difficulty={difficulty}
        svgViewBox={puzzleSvgViewBox}
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

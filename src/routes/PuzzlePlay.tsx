import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { parseSvg } from '../utils/parseSvg';
import { type AdjacencyData } from '../utils/generatePuzzle';
import usePuzzleEngine from '../hooks/usePuzzleEngine';
import PuzzleMapView from '../components/PuzzleMapView';
import PuzzleChoices from '../components/PuzzleChoices';
import ScorePanel from '../components/ScorePanel';

const REGION_MAPS: Record<string, string> = {
  europe: '/images/maps/region_world_europeLow.svg',
  africa: '/images/maps/region_world_africaLow.svg',
  asia: '/images/maps/region_world_asiaLow.svg',
  caribbean: '/images/maps/region_world_caribbeanLow.svg',
  'central-america': '/images/maps/region_world_centralAmericaLow.svg',
  'latin-america': '/images/maps/region_world_latinAmericaLow.svg',
  'middle-east': '/images/maps/region_world_middleEastLow.svg',
  'north-america': '/images/maps/region_world_northAmericaLow.svg',
  oceania: '/images/maps/region_world_oceaniaLow.svg',
  'south-america': '/images/maps/region_world_southAmericaLow.svg',
};

const ADJACENCY_URL = '/data/adjacency.json';

export default function PuzzlePlay() {
  const qs = new URLSearchParams(useLocation().search);
  const region = qs.get('region') ?? 'europe';
  const n = Number(qs.get('n') ?? '5');
  const svgMap = REGION_MAPS[region] ?? REGION_MAPS.europe;

  const [adjacency, setAdjacency] = useState<AdjacencyData | null>(null);
  const [regionCodes, setRegionCodes] = useState<string[] | null>(null);
  const [countryNames, setCountryNames] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      fetch(ADJACENCY_URL).then(r => r.json()),
      parseSvg(svgMap),
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
  }, []);

  if (!adjacency || !regionCodes) return <div className='loading'>Loading puzzle…</div>;

  return (
    <PuzzleContent
      adjacency={adjacency}
      regionCodes={regionCodes}
      countryNames={countryNames}
      svgMap={svgMap}
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
          ? 'Which country is hidden in the center?'
          : 'Which country is the missing neighbor?'}
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

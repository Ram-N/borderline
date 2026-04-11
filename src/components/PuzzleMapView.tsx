import { useEffect, useMemo, useState } from 'react';
import { parseSvg, type PathData } from '../utils/parseSvg';
import { computeCentroid, computeViewBox } from '../utils/computeCentroid';
import type { Puzzle } from '../types/puzzle';

type Props = {
  svgMap: string;
  puzzle: Puzzle;
  phase: 'question' | 'reveal';
  selectedAnswer: string | null;
  countryNames: Record<string, string>;
};

export default function PuzzleMapView({ svgMap, puzzle, phase, selectedAnswer, countryNames }: Props) {
  const [paths, setPaths] = useState<PathData[]>([]);

  useEffect(() => {
    parseSvg(svgMap).then(({ paths }) => setPaths(paths));
  }, [svgMap]);

  const relevantIds = useMemo(() => {
    const ids = new Set([puzzle.center, ...puzzle.visibleNeighbors]);
    if (puzzle.type === 'missing_neighbor') {
      puzzle.hiddenNeighbors.forEach(id => ids.add(id));
    }
    return ids;
  }, [puzzle]);

  const relevantPaths = useMemo(
    () => paths.filter(p => relevantIds.has(p.id)),
    [paths, relevantIds]
  );

  const dynamicViewBox = useMemo(
    () => relevantPaths.length > 0 ? computeViewBox(relevantPaths) : null,
    [relevantPaths]
  );

  if (paths.length === 0) return <div className='loading'>Loading map…</div>;

  const vb = dynamicViewBox ?? '0 0 800 600';

  return (
    <svg viewBox={vb} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {paths.map(path => {
        const fill = getPathFill(path.id, puzzle, phase, selectedAnswer);
        const dashed = isHiddenNeighbor(path.id, puzzle, phase);
        const showLabel = shouldShowLabel(path.id, puzzle, phase);
        const centroid = showLabel ? computeCentroid(path.d) : null;

        return (
          <g key={path.id}>
            <path
              id={path.id}
              d={path.d}
              fill={fill}
              stroke="#FFFFFF"
              strokeWidth={0.5}
              strokeDasharray={dashed ? '2 2' : undefined}
            />
            {showLabel && centroid && (
              <text
                x={centroid.x}
                y={centroid.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={10}
                fill="#333333"
                pointerEvents="none"
              >
                {countryNames[path.id] ?? path.id}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function getPathFill(id: string, puzzle: Puzzle, phase: 'question' | 'reveal', selected: string | null): string {
  if (puzzle.type === 'hidden_country') {
    if (id === puzzle.center) {
      if (phase === 'reveal') return selected === puzzle.correctAnswer ? '#4CAF50' : '#F44336';
      return '#444444';
    }
    if (puzzle.visibleNeighbors.includes(id)) return '#C8D8E8';
    return '#F0F0F0';
  } else {
    if (id === puzzle.center) return '#888888';
    if (puzzle.visibleNeighbors.includes(id)) return '#C8D8E8';
    if (puzzle.hiddenNeighbors.includes(id)) {
      if (phase === 'reveal') return selected === puzzle.correctAnswer ? '#4CAF50' : '#F44336';
      return '#E8E8E8';
    }
    return '#F0F0F0';
  }
}

function isHiddenNeighbor(id: string, puzzle: Puzzle, phase: 'question' | 'reveal'): boolean {
  return puzzle.type === 'missing_neighbor' && puzzle.hiddenNeighbors.includes(id) && phase === 'question';
}

function shouldShowLabel(id: string, puzzle: Puzzle, phase: 'question' | 'reveal'): boolean {
  if (puzzle.type === 'hidden_country') {
    if (id === puzzle.center) return phase === 'reveal';
    return puzzle.visibleNeighbors.includes(id);
  } else {
    if (id === puzzle.center) return true;
    if (puzzle.visibleNeighbors.includes(id)) return true;
    if (puzzle.hiddenNeighbors.includes(id)) return phase === 'reveal';
    return false;
  }
}

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
  const vbParts = vb.split(' ').map(Number);
  const fontSize = Math.min(vbParts[2], vbParts[3]) * 0.035;

  return (
    <div style={{ width: '100%', paddingBottom: '66%', position: 'relative' }}>
    <svg
      viewBox={vb}
      preserveAspectRatio="xMidYMid meet"
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'block' }}
    >
      {paths.map(path => {
        const fill = getPathFill(path.id, puzzle, phase, selectedAnswer);
        const stroke = getPathStroke(path.id, puzzle, phase);
        const labelText = getLabelText(path.id, puzzle, phase, countryNames);
        const centroid = labelText ? computeCentroid(path.d) : null;

        return (
          <g key={path.id}>
            <path
              id={path.id}
              d={path.d}
              fill={fill}
              stroke={stroke.color}
              strokeWidth={stroke.width}
            />
            {labelText && centroid && (
              <text
                x={centroid.x}
                y={centroid.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={fontSize}
                fill={labelText === '?' ? '#BF360C' : '#333333'}
                fontWeight={labelText === '?' ? 'bold' : 'normal'}
                pointerEvents="none"
              >
                {labelText}
              </text>
            )}
          </g>
        );
      })}
    </svg>
    </div>
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
      return '#FFD54F'; // amber — clearly visible mystery country
    }
    return '#F0F0F0';
  }
}

function getPathStroke(id: string, puzzle: Puzzle, phase: 'question' | 'reveal'): { color: string; width: number } {
  if (puzzle.type === 'missing_neighbor' && puzzle.hiddenNeighbors.includes(id) && phase === 'question') {
    return { color: '#E65100', width: 1.5 };
  }
  return { color: '#FFFFFF', width: 0.5 };
}

function getLabelText(
  id: string,
  puzzle: Puzzle,
  phase: 'question' | 'reveal',
  countryNames: Record<string, string>
): string | null {
  const name = countryNames[id] ?? id;
  if (puzzle.type === 'hidden_country') {
    if (id === puzzle.center) return phase === 'reveal' ? name : null;
    if (puzzle.visibleNeighbors.includes(id)) return name;
  } else {
    if (id === puzzle.center) return name;
    if (puzzle.visibleNeighbors.includes(id)) return name;
    if (puzzle.hiddenNeighbors.includes(id)) return phase === 'reveal' ? name : '?';
  }
  return null;
}

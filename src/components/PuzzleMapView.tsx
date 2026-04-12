import { useEffect, useMemo, useState } from 'react';
import { parseSvg, type PathData } from '../utils/parseSvg';
import { computeCentroid, computeViewBox } from '../utils/computeCentroid';
import type { Puzzle } from '../types/puzzle';

// paddingFactor per difficulty level (index = difficulty - 1)
const PADDING_BY_DIFFICULTY = [0.35, 0.25, 0.15, 0.08, 0.04] as const;

// fraction of neighbor labels to show per difficulty level
const LABEL_DENSITY = [1.0, 0.75, 0.5, 0.0, 0.0] as const;

type Props = {
  svgMap: string;
  puzzle: Puzzle;
  phase: 'question' | 'reveal';
  selectedAnswer: string | null;
  countryNames: Record<string, string>;
  difficulty: 1 | 2 | 3 | 4 | 5;
  svgViewBox?: string;
};

export default function PuzzleMapView({ svgMap, puzzle, phase, selectedAnswer, countryNames, difficulty, svgViewBox }: Props) {
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

  // For L5: extreme zoom — only center + hidden neighbor
  const zoomPaths = useMemo(() => {
    if (difficulty !== 5) return relevantPaths;
    const tightIds = new Set([puzzle.center]);
    if (puzzle.type === 'missing_neighbor') puzzle.hiddenNeighbors.forEach(id => tightIds.add(id));
    return relevantPaths.filter(p => tightIds.has(p.id));
  }, [difficulty, relevantPaths, puzzle]);

  const dynamicViewBox = useMemo(() => {
    if (difficulty === 1 && svgViewBox) return svgViewBox;
    const pathsForZoom = zoomPaths.length > 0 ? zoomPaths : relevantPaths;
    if (pathsForZoom.length === 0) return null;
    return computeViewBox(pathsForZoom, PADDING_BY_DIFFICULTY[difficulty - 1]);
  }, [difficulty, svgViewBox, zoomPaths, relevantPaths]);

  // Stable subset of neighbor IDs that show labels, based on density
  const labeledNeighborIds = useMemo(() => {
    const density = LABEL_DENSITY[difficulty - 1];
    if (density >= 1.0) return null; // show all
    if (density <= 0.0) return new Set<string>(); // show none
    const sorted = [...puzzle.visibleNeighbors].sort();
    const showCount = Math.round(sorted.length * density);
    return new Set(sorted.slice(0, showCount));
  }, [puzzle.visibleNeighbors, difficulty]);

  if (paths.length === 0) return <div className='loading'>Loading map…</div>;

  const vb = dynamicViewBox ?? '0 0 800 600';
  const vbParts = vb.split(' ').map(Number);
  const maxFontSize = Math.min(vbParts[2], vbParts[3]) * 0.05;
  const MIN_LABEL_FONT = maxFontSize * 0.65;
  const mapCx = vbParts[0] + vbParts[2] / 2;
  const mapCy = vbParts[1] + vbParts[3] / 2;
  const OUTSIDE_OFFSET = Math.min(vbParts[2], vbParts[3]) * 0.18;

  return (
    <div style={{ width: '100%', paddingBottom: '66%', position: 'relative' }}>
    <svg
      viewBox={vb}
      preserveAspectRatio="xMidYMid meet"
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'block' }}
    >
      <defs>
        <marker id="arr" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
          <path d="M0,0 L0,5 L5,2.5 z" fill="#444" />
        </marker>
      </defs>
      {paths.map(path => {
        const fill = getPathFill(path.id, puzzle, phase, selectedAnswer);
        const stroke = getPathStroke(path.id, puzzle, phase);
        const labelText = getLabelText(path.id, puzzle, phase, countryNames, labeledNeighborIds);
        const centroid = labelText ? computeCentroid(path.d) : null;

        const rawFontSize = centroid
          ? Math.min(Math.min(centroid.w, centroid.h) * 0.18, maxFontSize)
          : maxFontSize;
        const isSmall = centroid !== null && labelText !== '?' && rawFontSize < MIN_LABEL_FONT;
        const fontSize = isSmall ? MIN_LABEL_FONT : rawFontSize;

        let textX = centroid?.x ?? 0;
        let textY = centroid?.y ?? 0;
        let arrowTo: { x: number; y: number } | null = null;
        if (isSmall && centroid) {
          const dx = centroid.x - mapCx;
          const dy = centroid.y - mapCy;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          textX = centroid.x + (dx / len) * OUTSIDE_OFFSET;
          textY = centroid.y + (dy / len) * OUTSIDE_OFFSET;
          arrowTo = { x: textX, y: textY };
        }

        return (
          <g key={path.id}>
            <path
              id={path.id}
              d={path.d}
              fill={fill}
              stroke={stroke.color}
              strokeWidth={stroke.width}
            />
            {labelText && centroid && arrowTo && (
              <line
                x1={centroid.x} y1={centroid.y}
                x2={arrowTo.x} y2={arrowTo.y}
                stroke="#444"
                strokeWidth={fontSize * 0.1}
                markerEnd="url(#arr)"
              />
            )}
            {labelText && centroid && (
              <text
                x={textX}
                y={textY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={fontSize}
                fill={labelText === '?' ? '#BF360C' : '#333333'}
                fontWeight={labelText === '?' ? 'bold' : 'normal'}
                stroke="white"
                strokeWidth={fontSize * 0.25}
                paintOrder="stroke"
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
      return '#FFD54F';
    }
    if (puzzle.visibleNeighbors.includes(id)) return '#C8D8E8';
    return '#F0F0F0';
  } else {
    if (id === puzzle.center) return '#888888';
    if (puzzle.visibleNeighbors.includes(id)) return '#C8D8E8';
    if (puzzle.hiddenNeighbors.includes(id)) {
      if (phase === 'reveal') return selected === puzzle.correctAnswer ? '#4CAF50' : '#F44336';
      return '#FFD54F';
    }
    return '#F0F0F0';
  }
}

function getPathStroke(id: string, puzzle: Puzzle, phase: 'question' | 'reveal'): { color: string; width: number } {
  if (phase === 'question') {
    if (puzzle.type === 'missing_neighbor' && puzzle.hiddenNeighbors.includes(id)) {
      return { color: '#E65100', width: 1.5 };
    }
    if (puzzle.type === 'hidden_country' && id === puzzle.center) {
      return { color: '#E65100', width: 1.5 };
    }
  }
  return { color: '#FFFFFF', width: 0.5 };
}

function getLabelText(
  id: string,
  puzzle: Puzzle,
  phase: 'question' | 'reveal',
  countryNames: Record<string, string>,
  labeledNeighborIds: Set<string> | null
): string | null {
  const name = countryNames[id] ?? id;
  if (puzzle.type === 'hidden_country') {
    if (id === puzzle.center) return phase === 'reveal' ? name : null;
    if (puzzle.visibleNeighbors.includes(id)) {
      // Check label density — null means show all
      if (labeledNeighborIds !== null && !labeledNeighborIds.has(id)) return null;
      return phase === 'reveal' ? name : name;
    }
  } else {
    if (id === puzzle.center) return name;
    if (puzzle.visibleNeighbors.includes(id)) {
      if (labeledNeighborIds !== null && !labeledNeighborIds.has(id)) return null;
      return name;
    }
    if (puzzle.hiddenNeighbors.includes(id)) return phase === 'reveal' ? name : '?';
  }
  return null;
}

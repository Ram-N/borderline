import { useEffect, useMemo, useState } from 'react';
import { parseSvg, type PathData } from '../utils/parseSvg';
import { computeCentroid, computeViewBox } from '../utils/computeCentroid';
import { LABEL_DENSITY_BY_DIFFICULTY } from '../utils/generatePuzzle';
import type { Puzzle } from '../types/puzzle';

// paddingFactor per difficulty level (index = difficulty - 1)
const PADDING_BY_DIFFICULTY = [0.35, 0.25, 0.15, 0.08, 0.08] as const;

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
      puzzle.contextCountries.forEach(id => ids.add(id));
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

  // Which neighbor IDs show labels:
  // - hidden_country: use LABEL_DENSITY_BY_DIFFICULTY
  // - missing_neighbor: puzzle.labeledNeighbors (computed adaptively in generatePuzzle)
  const labeledNeighborIds = useMemo(() => {
    if (puzzle.type === 'missing_neighbor') {
      return new Set(puzzle.labeledNeighbors);
    }
    // hidden_country
    const density = LABEL_DENSITY_BY_DIFFICULTY[difficulty - 1];
    if (density >= 1.0) return null; // show all
    if (density <= 0.0) return new Set<string>();
    const sorted = [...puzzle.visibleNeighbors].sort();
    const showCount = Math.round(sorted.length * density);
    return new Set(sorted.slice(0, showCount));
  }, [puzzle, difficulty]);

  if (paths.length === 0) return <div className='loading'>Loading map…</div>;

  const vb = dynamicViewBox ?? '0 0 800 600';
  const vbParts = vb.split(' ').map(Number);
  const maxFontSize = Math.min(vbParts[2], vbParts[3]) * 0.05;
  const MIN_LABEL_FONT = maxFontSize * 0.65;

  // Compute bounding box around all land mass (relevant paths)
  let landMinX = Infinity, landMinY = Infinity, landMaxX = -Infinity, landMaxY = -Infinity;
  for (const p of paths) {
    if (!relevantIds.has(p.id)) continue;
    const c = computeCentroid(p.d);
    if (!c) continue;
    landMinX = Math.min(landMinX, c.x - c.w / 2);
    landMinY = Math.min(landMinY, c.y - c.h / 2);
    landMaxX = Math.max(landMaxX, c.x + c.w / 2);
    landMaxY = Math.max(landMaxY, c.y + c.h / 2);
  }
  const labelMargin = maxFontSize * 1.5;

  return (
    <div style={{ width: '100%', paddingBottom: '66%', position: 'relative' }}>
    <svg
      viewBox={vb}
      preserveAspectRatio="xMidYMid meet"
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'block' }}
    >
      <defs>
        <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#1565C0" />
        </marker>
      </defs>
      {/* Layer 1: all country shapes (grey background, then blue neighbors, then orange highlight) */}
      {paths.map(path => {
        const fill = getPathFill(path.id, puzzle, phase, selectedAnswer);
        const stroke = getPathStroke(path.id, puzzle, phase);
        return (
          <path
            key={path.id}
            id={path.id}
            d={path.d}
            fill={fill}
            stroke={stroke.color}
            strokeWidth={stroke.width}
          />
        );
      })}
      {/* Layer 2: all labels and arrows rendered on top of all shapes */}
      {(() => {
        // Pass 1: collect label info and determine placement
        type LabelInfo = {
          id: string; labelText: string; fontSize: number;
          centroid: { x: number; y: number; w: number; h: number };
          isSmall: boolean;
        };
        const labels: LabelInfo[] = [];
        for (const path of paths) {
          const labelText = getLabelText(path.id, puzzle, phase, countryNames, labeledNeighborIds);
          if (!labelText) continue;
          const centroid = computeCentroid(path.d);
          if (!centroid) continue;
          const rawFontSize = Math.min(Math.min(centroid.w, centroid.h) * 0.18, maxFontSize);
          const isSmall = labelText !== '?' && rawFontSize < MIN_LABEL_FONT;
          const fontSize = isSmall ? MIN_LABEL_FONT : rawFontSize;
          labels.push({ id: path.id, labelText, fontSize, centroid, isSmall });
        }

        // Pass 2: for external labels, find nearest land-bbox edge and place outside
        // Group by edge to distribute evenly
        type Edge = 'top' | 'bottom' | 'left' | 'right';
        const edgeLabels: Record<Edge, LabelInfo[]> = { top: [], bottom: [], left: [], right: [] };
        const internalLabels: LabelInfo[] = [];

        for (const label of labels) {
          if (!label.isSmall) {
            internalLabels.push(label);
            continue;
          }
          // Find nearest edge of land bbox from this country's centroid
          const { centroid } = label;
          const distTop = centroid.y - landMinY;
          const distBottom = landMaxY - centroid.y;
          const distLeft = centroid.x - landMinX;
          const distRight = landMaxX - centroid.x;
          const minDist = Math.min(distTop, distBottom, distLeft, distRight);

          let edge: Edge;
          if (minDist === distTop) edge = 'top';
          else if (minDist === distBottom) edge = 'bottom';
          else if (minDist === distLeft) edge = 'left';
          else edge = 'right';

          edgeLabels[edge].push(label);
        }

        // Sort labels on each edge by their position along that edge
        edgeLabels.top.sort((a, b) => a.centroid.x - b.centroid.x);
        edgeLabels.bottom.sort((a, b) => a.centroid.x - b.centroid.x);
        edgeLabels.left.sort((a, b) => a.centroid.y - b.centroid.y);
        edgeLabels.right.sort((a, b) => a.centroid.y - b.centroid.y);

        // Compute positions for external labels
        const vbMargin = labelMargin * 0.5;
        const vbLeft = vbParts[0] + vbMargin;
        const vbRight = vbParts[0] + vbParts[2] - vbMargin;
        const vbTop = vbParts[1] + vbMargin;
        const vbBottom = vbParts[1] + vbParts[3] - vbMargin;

        type Positioned = LabelInfo & { textX: number; textY: number; needsArrow: boolean };
        const positioned: Positioned[] = [];

        // Internal labels: place at centroid
        for (const label of internalLabels) {
          positioned.push({ ...label, textX: label.centroid.x, textY: label.centroid.y, needsArrow: false });
        }

        // External labels: place outside land bbox on their assigned edge
        function placeEdge(edge: Edge, edgeList: LabelInfo[]) {
          if (edgeList.length === 0) return;
          for (let i = 0; i < edgeList.length; i++) {
            const label = edgeList[i];
            let textX: number, textY: number;
            const spacing = labelMargin * 2.5 * (i - (edgeList.length - 1) / 2);

            if (edge === 'top') {
              textX = Math.max(vbLeft, Math.min(vbRight, label.centroid.x + spacing));
              textY = Math.max(vbTop, landMinY - labelMargin);
            } else if (edge === 'bottom') {
              textX = Math.max(vbLeft, Math.min(vbRight, label.centroid.x + spacing));
              textY = Math.min(vbBottom, landMaxY + labelMargin);
            } else if (edge === 'left') {
              textX = Math.max(vbLeft, landMinX - labelMargin);
              textY = Math.max(vbTop, Math.min(vbBottom, label.centroid.y + spacing));
            } else {
              textX = Math.min(vbRight, landMaxX + labelMargin);
              textY = Math.max(vbTop, Math.min(vbBottom, label.centroid.y + spacing));
            }

            positioned.push({ ...label, textX, textY, needsArrow: true });
          }
        }

        placeEdge('top', edgeLabels.top);
        placeEdge('bottom', edgeLabels.bottom);
        placeEdge('left', edgeLabels.left);
        placeEdge('right', edgeLabels.right);

        // Pass 3: render
        return positioned.map(({ id, labelText, fontSize, centroid, textX, textY, needsArrow }) => {
          // Line from country centroid to label (no arrowhead — the line itself indicates connection)
          let arrowLine: { x1: number; y1: number; x2: number; y2: number } | null = null;
          if (needsArrow) {
            arrowLine = { x1: centroid.x, y1: centroid.y, x2: textX, y2: textY };
          }

          return (
            <g key={`label-${id}`}>
              {arrowLine && (
                <line
                  x1={arrowLine.x1} y1={arrowLine.y1}
                  x2={arrowLine.x2} y2={arrowLine.y2}
                  stroke="#1565C0"
                  strokeWidth={fontSize * 0.15}
                />
              )}
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
            </g>
          );
        });
      })()}
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
    if (puzzle.contextCountries.includes(id)) return '#E8EEF4'; // subtle tint — context reference
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
      if (labeledNeighborIds !== null && !labeledNeighborIds.has(id)) return null;
      return name;
    }
  } else {
    if (id === puzzle.center) return name;
    if (puzzle.visibleNeighbors.includes(id)) {
      if (labeledNeighborIds !== null && !labeledNeighborIds.has(id)) return null;
      return name;
    }
    if (puzzle.hiddenNeighbors.includes(id)) return phase === 'reveal' ? name : '?';
    // contextCountries: shown on map for geographic reference, but NOT labeled
    // (they appear as choices — player must identify them, same as unlabeled neighbors)
  }
  return null;
}

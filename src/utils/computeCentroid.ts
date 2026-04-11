import type { PathData } from './parseSvg';

type Bbox = { minX: number; maxX: number; minY: number; maxY: number };

/**
 * Extract endpoint coordinates from an SVG path segment.
 * Handles arc commands correctly — skips the 5 non-coordinate arc params
 * (rx, ry, x-rotation, large-arc-flag, sweep-flag).
 */
function extractPoints(d: string): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const segs = d.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) ?? [];

  for (const seg of segs) {
    const cmd = seg[0];
    const nums = Array.from(
      seg.slice(1).matchAll(/-?\d*\.?\d+(?:[eE][+-]?\d+)?/g),
      m => parseFloat(m[0])
    );

    switch (cmd) {
      case 'M': case 'L':
        for (let i = 0; i + 1 < nums.length; i += 2)
          points.push({ x: nums[i], y: nums[i + 1] });
        break;
      case 'C':
        for (let i = 4; i + 1 < nums.length; i += 6)
          points.push({ x: nums[i], y: nums[i + 1] });
        break;
      case 'S': case 'Q':
        for (let i = 2; i + 1 < nums.length; i += 4)
          points.push({ x: nums[i], y: nums[i + 1] });
        break;
      case 'A':
        // arc: rx ry x-rotation large-arc-flag sweep-flag x y (7 params)
        for (let i = 5; i + 1 < nums.length; i += 7)
          points.push({ x: nums[i], y: nums[i + 1] });
        break;
      // Relative commands and H/V: skipped — unreliable without position tracking
    }
  }
  return points;
}

function bboxOf(points: { x: number; y: number }[]): Bbox | null {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const { x, y } of points) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return isFinite(minX) ? { minX, maxX, minY, maxY } : null;
}

/**
 * Split a path by Z/z into closed subpolygons and return the bbox of the
 * LARGEST one (by area). This prevents far-flung islands/territories from
 * inflating the bounding box — e.g. Thailand has tiny polygons near x=9 and
 * the mainland near x=200, Russia spans Siberia to the Pacific, etc.
 */
function mainBodyBbox(d: string): Bbox | null {
  const subpaths = d.split(/[Zz]/).filter(s => s.trim().length > 0);

  let best: Bbox | null = null;
  let bestArea = -1;

  for (const sub of subpaths) {
    const pts = extractPoints(sub);
    if (pts.length < 2) continue;
    const b = bboxOf(pts);
    if (!b) continue;
    const area = (b.maxX - b.minX) * (b.maxY - b.minY);
    if (area > bestArea) {
      bestArea = area;
      best = b;
    }
  }

  return best;
}

export function computeCentroid(d: string): { x: number; y: number; w: number; h: number } {
  const b = mainBodyBbox(d);
  if (!b) return { x: 0, y: 0, w: 0, h: 0 };
  return {
    x: (b.minX + b.maxX) / 2,
    y: (b.minY + b.maxY) / 2,
    w: b.maxX - b.minX,
    h: b.maxY - b.minY,
  };
}

export function computeViewBox(paths: PathData[], paddingFactor = 0.1): string {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

  for (const p of paths) {
    const b = mainBodyBbox(p.d);
    if (!b) continue;
    if (b.minX < minX) minX = b.minX;
    if (b.maxX > maxX) maxX = b.maxX;
    if (b.minY < minY) minY = b.minY;
    if (b.maxY > maxY) maxY = b.maxY;
  }

  if (!isFinite(minX)) return '0 0 800 600';
  const w = maxX - minX;
  const h = maxY - minY;
  const px = w * paddingFactor;
  const py = h * paddingFactor;
  return `${minX - px} ${minY - py} ${w + 2 * px} ${h + 2 * py}`;
}

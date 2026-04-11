import type { PathData } from './parseSvg';

/**
 * Extract endpoint coordinates from an SVG path d attribute.
 * Handles arc commands correctly — skips the 5 non-coordinate arc params
 * (rx, ry, x-rotation, large-arc-flag, sweep-flag) and takes only the x,y endpoint.
 * Without this, arc flags (0 and 1) pollute the bounding box.
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
        // cubic bezier: cx1 cy1 cx2 cy2 x y — take endpoint only
        for (let i = 4; i + 1 < nums.length; i += 6)
          points.push({ x: nums[i], y: nums[i + 1] });
        break;
      case 'S':
        // smooth cubic: cx2 cy2 x y
        for (let i = 2; i + 1 < nums.length; i += 4)
          points.push({ x: nums[i], y: nums[i + 1] });
        break;
      case 'Q':
        // quadratic: cx cy x y
        for (let i = 2; i + 1 < nums.length; i += 4)
          points.push({ x: nums[i], y: nums[i + 1] });
        break;
      case 'A':
        // arc: rx ry x-rotation large-arc-flag sweep-flag x y (7 params)
        for (let i = 5; i + 1 < nums.length; i += 7)
          points.push({ x: nums[i], y: nums[i + 1] });
        break;
      // Relative commands (m, l, c, s, q, a) and H/V: skip — relative coords
      // without position tracking aren't reliable for bounding box, and H/V
      // only update one axis. Country paths start with absolute M so we still
      // capture most points via the absolute commands above.
    }
  }
  return points;
}

function bbox(points: { x: number; y: number }[]) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const { x, y } of points) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { minX, maxX, minY, maxY };
}

export function computeCentroid(d: string): { x: number; y: number } {
  const points = extractPoints(d);
  if (points.length === 0) return { x: 0, y: 0 };
  const { minX, maxX, minY, maxY } = bbox(points);
  if (!isFinite(minX)) return { x: 0, y: 0 };
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
}

export function computeViewBox(paths: PathData[], paddingFactor = 0.1): string {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of paths) {
    const { minX: x0, maxX: x1, minY: y0, maxY: y1 } = bbox(extractPoints(p.d));
    if (x0 < minX) minX = x0;
    if (x1 > maxX) maxX = x1;
    if (y0 < minY) minY = y0;
    if (y1 > maxY) maxY = y1;
  }
  if (!isFinite(minX)) return '0 0 800 600';
  const w = maxX - minX;
  const h = maxY - minY;
  const px = w * paddingFactor;
  const py = h * paddingFactor;
  return `${minX - px} ${minY - py} ${w + 2 * px} ${h + 2 * py}`;
}

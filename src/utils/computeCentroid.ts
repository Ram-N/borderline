import type { PathData } from './parseSvg';

export function computeCentroid(d: string): { x: number; y: number } {
  const nums = Array.from(d.matchAll(/-?\d+(?:\.\d+)?/g), m => parseFloat(m[0]));
  if (nums.length < 2) return { x: 0, y: 0 };
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = nums[i], y = nums[i + 1];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  if (!isFinite(minX)) return { x: 0, y: 0 };
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
}

export function computeViewBox(paths: PathData[], paddingFactor = 0.1): string {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of paths) {
    const nums = Array.from(p.d.matchAll(/-?\d+(?:\.\d+)?/g), m => parseFloat(m[0]));
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const x = nums[i], y = nums[i + 1];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (!isFinite(minX)) return '0 0 800 600';
  const w = maxX - minX;
  const h = maxY - minY;
  const px = w * paddingFactor;
  const py = h * paddingFactor;
  return `${minX - px} ${minY - py} ${w + 2 * px} ${h + 2 * py}`;
}

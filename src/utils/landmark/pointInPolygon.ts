/**
 * Ray-casting point-in-polygon test in geographic (lat/lon) space.
 * Polygon vertices are stored as [lat, lon] pairs.
 */

/**
 * Returns true if the point (lat, lon) lies inside the closed polygon.
 * The polygon is an array of [lat, lon] pairs; the closing vertex does not
 * need to repeat the first vertex.
 */
export function pointInPolygon(
  lat: number,
  lon: number,
  polygon: [number, number][],
): boolean {
  const n = polygon.length;
  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [yi, xi] = polygon[i]; // yi = lat, xi = lon
    const [yj, xj] = polygon[j];
    // Ray cast along the +lon direction from (lat, lon)
    const intersects =
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

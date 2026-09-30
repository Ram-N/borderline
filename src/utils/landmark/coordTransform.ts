/**
 * Affine coordinate transform between geographic (lat/lon) and SVG pixel space.
 * Accurate enough for city-scale maps; no external library required.
 */

export type GeoBounds = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};

export type SvgDimensions = {
  width: number;
  height: number;
};

/** Convert geographic coordinates to SVG pixel coordinates. */
export function geoToSvg(
  lat: number,
  lon: number,
  bounds: GeoBounds,
  svgDims: SvgDimensions,
): { svgX: number; svgY: number } {
  const lonFraction = (lon - bounds.minLon) / (bounds.maxLon - bounds.minLon);
  // Y-axis is inverted: higher latitude = smaller Y (further up the screen)
  const latFraction = (bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat);
  return {
    svgX: lonFraction * svgDims.width,
    svgY: latFraction * svgDims.height,
  };
}

/** Convert SVG pixel coordinates back to geographic coordinates. */
export function svgToGeo(
  svgX: number,
  svgY: number,
  bounds: GeoBounds,
  svgDims: SvgDimensions,
): { lat: number; lon: number } {
  const lonFraction = svgX / svgDims.width;
  const latFraction = svgY / svgDims.height;
  return {
    lon: bounds.minLon + lonFraction * (bounds.maxLon - bounds.minLon),
    lat: bounds.maxLat - latFraction * (bounds.maxLat - bounds.minLat),
  };
}

/** Parse a viewBox string ("0 0 800 700") into width and height. */
export function parseViewBox(viewBox: string): SvgDimensions {
  const parts = viewBox.trim().split(/\s+/).map(Number);
  return { width: parts[2], height: parts[3] };
}

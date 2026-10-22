/**
 * Coordinate transform between geographic (lat/lon) and SVG pixel space.
 * Uses a cosine-corrected equirectangular projection so shapes appear with
 * correct proportions at the map's centre latitude.
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

/**
 * Compute the effective drawing area within the SVG viewBox.
 * The map is scaled to fill as much of the SVG as possible while
 * preserving the geographic aspect ratio at the centre latitude.
 */
function projectionLayout(bounds: GeoBounds, svgDims: SvgDimensions) {
  const centerLat = (bounds.minLat + bounds.maxLat) / 2;
  const cosLat = Math.cos(centerLat * Math.PI / 180);
  const lonRange = bounds.maxLon - bounds.minLon;
  const latRange = bounds.maxLat - bounds.minLat;

  // Geographic aspect ratio: km-width / km-height at the centre latitude
  const geoAspect = (lonRange * cosLat) / latRange;
  const svgAspect = svgDims.width / svgDims.height;

  let usedWidth: number, usedHeight: number, offsetX: number, offsetY: number;
  if (geoAspect <= svgAspect) {
    // Map is taller proportionally — fit height, pad sides
    usedHeight = svgDims.height;
    usedWidth = geoAspect * svgDims.height;
    offsetX = (svgDims.width - usedWidth) / 2;
    offsetY = 0;
  } else {
    // Map is wider proportionally — fit width, pad top/bottom
    usedWidth = svgDims.width;
    usedHeight = svgDims.width / geoAspect;
    offsetX = 0;
    offsetY = (svgDims.height - usedHeight) / 2;
  }
  return { usedWidth, usedHeight, offsetX, offsetY, lonRange, latRange };
}

/** Convert geographic coordinates to SVG pixel coordinates. */
export function geoToSvg(
  lat: number,
  lon: number,
  bounds: GeoBounds,
  svgDims: SvgDimensions,
): { svgX: number; svgY: number } {
  const { usedWidth, usedHeight, offsetX, offsetY, lonRange, latRange } = projectionLayout(bounds, svgDims);
  return {
    // Y-axis is inverted: higher latitude = smaller Y (further up the screen)
    svgX: offsetX + ((lon - bounds.minLon) / lonRange) * usedWidth,
    svgY: offsetY + ((bounds.maxLat - lat) / latRange) * usedHeight,
  };
}

/** Convert SVG pixel coordinates back to geographic coordinates. */
export function svgToGeo(
  svgX: number,
  svgY: number,
  bounds: GeoBounds,
  svgDims: SvgDimensions,
): { lat: number; lon: number } {
  const { usedWidth, usedHeight, offsetX, offsetY, lonRange, latRange } = projectionLayout(bounds, svgDims);
  return {
    lon: bounds.minLon + ((svgX - offsetX) / usedWidth) * lonRange,
    lat: bounds.maxLat - ((svgY - offsetY) / usedHeight) * latRange,
  };
}

/** Parse a viewBox string ("0 0 800 700") into width and height. */
export function parseViewBox(viewBox: string): SvgDimensions {
  const parts = viewBox.trim().split(/\s+/).map(Number);
  return { width: parts[2], height: parts[3] };
}

/** Convert a distance in km to SVG pixels (exact vertically; the projection is cosine-corrected so horizontal matches at the centre latitude). */
export function kmToSvgPx(km: number, bounds: GeoBounds, svgDims: SvgDimensions): number {
  const { usedHeight, latRange } = projectionLayout(bounds, svgDims);
  return (km / 111.32) * (usedHeight / latRange);
}

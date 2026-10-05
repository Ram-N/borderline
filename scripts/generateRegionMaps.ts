/**
 * GeoJSON → SVG + JSON data pipeline for WhereIsRegion maps.
 *
 * Usage:
 *   npx tsx scripts/generateRegionMaps.ts --map india
 *   npx tsx scripts/generateRegionMaps.ts --map india --tolerance 3 --geo-tolerance 0.1
 *
 * For each region map the script writes:
 *   public/images/maps/{region}_boundaries.svg  — all internal borders shown
 *   public/images/maps/{region}_outline.svg     — outer boundary only (no internal borders)
 *   public/data/regions/{region}.json           — dataset consumed by the game
 */

import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';

const _require = createRequire(import.meta.url);
type SimplifyFn = (
  points: { x: number; y: number }[],
  tolerance?: number,
  highQuality?: boolean,
) => { x: number; y: number }[];
const simplify = _require('simplify-js') as SimplifyFn;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GeoBounds = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};

type SvgDimensions = {
  width: number;
  height: number;
};

type Point = { x: number; y: number };

type CityEntry = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  hint?: string;
};

type RegionSpec = {
  /** Path to the GeoJSON file (relative to project root). */
  geojsonPath: string;
  /** GeoJSON feature property that holds the region/state name. */
  featureNameProp: string;
  /** Optional filter — only features where this returns true are included. */
  featureFilter?: (properties: Record<string, unknown>) => boolean;
  /** Override abbreviated or non-standard names from the GeoJSON. */
  nameOverrides?: Record<string, string>;
  /** Geographic bounds — defines the equirectangular projection extent. */
  bounds: GeoBounds;
  /** SVG viewBox string, e.g. "0 0 1000 900". */
  viewBox: string;
  /** SVG path simplification tolerance in pixels. */
  tolerance: number;
  /** Geographic simplification tolerance in degrees (for polygon data in JSON). */
  geoTolerance: number;
  fills?: Record<string, string>;
  palette?: string[];
  /** Output paths (relative to project root). */
  outputBoundaries: string;
  outputOutline: string;
  outputData: string;
  /** Hardcoded cities for the region. */
  cities: CityEntry[];
};

// ---------------------------------------------------------------------------
// Default palette
// ---------------------------------------------------------------------------

const DEFAULT_PALETTE = [
  '#e8c8a8', '#e0b8b8', '#d4c9a8', '#e8dfa8',
  '#b8d4a8', '#c8d4e8', '#d4c8e8', '#e8d4c8',
];

// ---------------------------------------------------------------------------
// Load region specifications from manifest
// ---------------------------------------------------------------------------

type FeatureFilterSpec = {
  equalsProp?: string;
  equalsValue?: string;
  excludeByProp?: string;
  excludeValues?: string[];
} | null;

function buildFeatureFilter(
  filterSpec: FeatureFilterSpec,
): ((props: Record<string, unknown>) => boolean) | undefined {
  if (!filterSpec) return undefined;
  return (props) => {
    if (filterSpec.equalsProp && filterSpec.equalsValue) {
      if (props[filterSpec.equalsProp] !== filterSpec.equalsValue) return false;
    }
    if (filterSpec.excludeByProp && filterSpec.excludeValues) {
      if (filterSpec.excludeValues.includes(props[filterSpec.excludeByProp] as string)) return false;
    }
    return true;
  };
}

function loadRegionSpecs(): Record<string, RegionSpec> {
  const root = path.resolve(import.meta.dirname, '..');
  const manifestPath = path.resolve(root, 'scripts/geo-data/manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as {
    regions: Array<{
      id: string;
      geojson: string;
      featureNameProp: string;
      featureFilter: FeatureFilterSpec;
      nameOverrides: Record<string, string> | null;
      bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number };
      viewBox: string;
      tolerance: number;
      geoTolerance: number;
      fills: Record<string, string> | null;
      palette: string[] | null;
      cities: CityEntry[];
    }>;
  };

  const specs: Record<string, RegionSpec> = {};
  for (const entry of manifest.regions) {
    specs[entry.id] = {
      geojsonPath: entry.geojson,
      featureNameProp: entry.featureNameProp,
      featureFilter: buildFeatureFilter(entry.featureFilter),
      nameOverrides: entry.nameOverrides ?? undefined,
      bounds: entry.bounds,
      viewBox: entry.viewBox,
      tolerance: entry.tolerance,
      geoTolerance: entry.geoTolerance,
      fills: entry.fills ?? undefined,
      palette: entry.palette ?? DEFAULT_PALETTE,
      outputBoundaries: `public/images/maps/${entry.id}_boundaries.svg`,
      outputOutline: `public/images/maps/${entry.id}_outline.svg`,
      outputData: `public/data/regions/${entry.id}.json`,
      cities: entry.cities,
    };
  }
  return specs;
}

const REGION_SPECS: Record<string, RegionSpec> = loadRegionSpecs();

// ---------------------------------------------------------------------------
// Coordinate helpers
// ---------------------------------------------------------------------------

function parseViewBox(viewBox: string): SvgDimensions {
  const parts = viewBox.trim().split(/\s+/).map(Number);
  return { width: parts[2], height: parts[3] };
}

/** Equirectangular projection: (lon, lat) → SVG pixel (x, y). */
function project(lon: number, lat: number, bounds: GeoBounds, dims: SvgDimensions): Point {
  return {
    x: ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * dims.width,
    y: ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * dims.height,
  };
}

/** Reverse: SVG pixel (x, y) → (lon, lat). */
function unproject(x: number, y: number, bounds: GeoBounds, dims: SvgDimensions): { lon: number; lat: number } {
  return {
    lon: bounds.minLon + (x / dims.width) * (bounds.maxLon - bounds.minLon),
    lat: bounds.maxLat - (y / dims.height) * (bounds.maxLat - bounds.minLat),
  };
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

/** Return the ring with the largest bounding-box area. */
function largestRing(rings: number[][][]): number[][] {
  let best = rings[0];
  let bestArea = 0;
  for (const ring of rings) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [lon, lat] of ring) {
      if (lon < minX) minX = lon;
      if (lon > maxX) maxX = lon;
      if (lat < minY) minY = lat;
      if (lat > maxY) maxY = lat;
    }
    const area = (maxX - minX) * (maxY - minY);
    if (area > bestArea) { bestArea = area; best = ring; }
  }
  return best;
}

/** Get the main outer ring from a GeoJSON Polygon or MultiPolygon geometry. */
function mainOuterRing(geometry: { type: string; coordinates: unknown }): number[][] | null {
  if (geometry.type === 'Polygon') {
    return (geometry.coordinates as number[][][])[0];
  }
  if (geometry.type === 'MultiPolygon') {
    const outerRings = (geometry.coordinates as number[][][][]).map((poly) => poly[0]);
    return largestRing(outerRings);
  }
  return null;
}

/** Project a ring to SVG, simplify, return SVG path `d` string. */
function ringToPathD(
  ring: number[][],
  bounds: GeoBounds,
  dims: SvgDimensions,
  tolerance: number,
): string {
  const projected = ring.map(([lon, lat]) => project(lon, lat, bounds, dims));
  const simplified = simplify(projected, tolerance, false);
  if (simplified.length < 2) return '';
  return (
    simplified
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${Math.round(p.x)},${Math.round(p.y)}`)
      .join(' ') + ' Z'
  );
}

/**
 * Simplify a ring in geographic space and return as [lat, lon][] pairs.
 * Uses lon/lat as x/y for simplify-js.
 */
function simplifyRingGeo(ring: number[][], geoTolerance: number): [number, number][] {
  const pts = ring.map(([lon, lat]) => ({ x: lon, y: lat }));
  const simplified = simplify(pts, geoTolerance, false);
  return simplified.map((p) => [p.y, p.x] as [number, number]); // [lat, lon]
}

/** Bounding-box centroid of an SVG path `d` string. */
function svgPathCentroid(pathD: string): Point {
  const nums = [...pathD.matchAll(/([-\d.]+),([-\d.]+)/g)].map((m) => ({
    x: parseFloat(m[1]),
    y: parseFloat(m[2]),
  }));
  if (nums.length === 0) return { x: 0, y: 0 };
  const minX = Math.min(...nums.map((p) => p.x));
  const maxX = Math.max(...nums.map((p) => p.x));
  const minY = Math.min(...nums.map((p) => p.y));
  const maxY = Math.max(...nums.map((p) => p.y));
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
}

function toKebab(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ---------------------------------------------------------------------------
// SVG generation
// ---------------------------------------------------------------------------

function buildSvg(
  features: Array<{ id: string; fill: string; pathD: string }>,
  dims: SvgDimensions,
  showBorders: boolean,
): string {
  const W = dims.width;
  const H = dims.height;

  // Outline SVG: all features share one flat fill so no state edges are visible.
  const OUTLINE_FILL = '#d4c9a8';

  const paths = features
    .map(({ id, fill, pathD }) => {
      const f = showBorders ? fill : OUTLINE_FILL;
      const stroke = showBorders ? '#666' : OUTLINE_FILL;
      const strokeWidth = showBorders ? '1' : '0.5';
      return `  <path id="${id}" d="${pathD}" fill="${f}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
    })
    .join('\n');

  const compass =
    `  <g transform="translate(${W - 40},${H - 32})">\n` +
    `    <circle r="14" fill="white" stroke="#aaa" stroke-width="1"/>\n` +
    `    <text x="0" y="-3" font-family="sans-serif" font-size="9" fill="#555" text-anchor="middle">N</text>\n` +
    `    <line x1="0" y1="-8" x2="0" y2="8" stroke="#888" stroke-width="1"/>\n` +
    `    <line x1="-8" y1="0" x2="8" y2="0" stroke="#888" stroke-width="1"/>\n` +
    `  </g>`;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">`,
    `  <rect width="${W}" height="${H}" fill="#c8e6f5"/>`,
    paths,
    compass,
    `</svg>`,
  ].join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// Core build function
// ---------------------------------------------------------------------------

function buildRegionMap(mapKey: string, spec: RegionSpec, toleranceOverride?: number, geoToleranceOverride?: number): void {
  const tolerance = toleranceOverride ?? spec.tolerance;
  const geoTolerance = geoToleranceOverride ?? spec.geoTolerance;
  const root = path.resolve(import.meta.dirname, '..');

  const geojsonAbs = path.resolve(root, spec.geojsonPath);
  if (!fs.existsSync(geojsonAbs)) {
    console.error(`[${mapKey}] GeoJSON not found: ${spec.geojsonPath}`);
    process.exit(1);
  }

  const geojson = JSON.parse(fs.readFileSync(geojsonAbs, 'utf-8'));
  const bounds = spec.bounds;
  const dims = parseViewBox(spec.viewBox);

  const features: Array<{
    id: string;
    name: string;
    fill: string;
    pathD: string;
    centroidSvg: Point;
    polygon: [number, number][];
  }> = [];

  let paletteIndex = 0;
  const paletteCache: Record<string, string> = {};

  function pickFill(name: string): string {
    if (spec.fills?.[name]) return spec.fills[name];
    if (!spec.palette) return '#cccccc';
    if (!paletteCache[name]) {
      paletteCache[name] = spec.palette[paletteIndex % spec.palette.length];
      paletteIndex++;
    }
    return paletteCache[name];
  }

  const filteredFeatures = spec.featureFilter
    ? geojson.features.filter((f: { properties: Record<string, unknown> }) => spec.featureFilter!(f.properties))
    : geojson.features;

  for (const feature of filteredFeatures) {
    const rawName: string = feature.properties[spec.featureNameProp] ?? '';
    const name = spec.nameOverrides?.[rawName] ?? rawName;
    if (!name) continue;

    const ring = mainOuterRing(feature.geometry);
    if (!ring) { console.warn(`[${mapKey}] No ring for: ${name}`); continue; }

    const pathD = ringToPathD(ring, bounds, dims, tolerance);
    if (!pathD) { console.warn(`[${mapKey}] Empty path for: ${name}`); continue; }

    const centroidSvg = svgPathCentroid(pathD);
    const polygon = simplifyRingGeo(ring, geoTolerance);
    const fill = pickFill(name);

    features.push({ id: toKebab(name), name, fill, pathD, centroidSvg, polygon });
  }

  if (features.length === 0) {
    console.error(`[${mapKey}] No features. Check featureNameProp: "${spec.featureNameProp}"`);
    process.exit(1);
  }

  // Build SVG files
  const boundariesSvg = buildSvg(features, dims, true);
  const outlineSvg = buildSvg(features, dims, false);

  const outBoundaries = path.resolve(root, spec.outputBoundaries);
  const outOutline = path.resolve(root, spec.outputOutline);
  fs.mkdirSync(path.dirname(outBoundaries), { recursive: true });
  fs.writeFileSync(outBoundaries, boundariesSvg);
  fs.writeFileSync(outOutline, outlineSvg);

  // Build data JSON
  const regionEntries = features.map((f) => {
    const geo = unproject(f.centroidSvg.x, f.centroidSvg.y, bounds, dims);
    return {
      id: f.id,
      name: f.name,
      lat: parseFloat(geo.lat.toFixed(4)),
      lon: parseFloat(geo.lon.toFixed(4)),
      svgX: Math.round(f.centroidSvg.x),
      svgY: Math.round(f.centroidSvg.y),
      polygon: f.polygon,
    };
  });

  // Compute city SVG coordinates
  const cityEntries = spec.cities.map((city) => {
    const pt = project(city.lon, city.lat, bounds, dims);
    return {
      id: city.id,
      name: city.name,
      lat: city.lat,
      lon: city.lon,
      svgX: Math.round(pt.x),
      svgY: Math.round(pt.y),
      ...(city.hint ? { hint: city.hint } : {}),
    };
  });

  const dataJson = {
    id: mapKey,
    name: mapKey.charAt(0).toUpperCase() + mapKey.slice(1),
    bounds,
    viewBox: spec.viewBox,
    regions: regionEntries,
    cities: cityEntries,
  };

  const outData = path.resolve(root, spec.outputData);
  fs.mkdirSync(path.dirname(outData), { recursive: true });
  fs.writeFileSync(outData, JSON.stringify(dataJson, null, 2));

  console.log(`[${mapKey}] Written:`);
  console.log(`  ${spec.outputBoundaries}  (${features.length} regions, svg-tolerance=${tolerance})`);
  console.log(`  ${spec.outputOutline}`);
  console.log(`  ${spec.outputData}  (${regionEntries.length} regions, ${cityEntries.length} cities, geo-tolerance=${geoTolerance})`);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): {
  mapKey: string | null;
  tolerance: number | null;
  geoTolerance: number | null;
} {
  let mapKey: string | null = null;
  let tolerance: number | null = null;
  let geoTolerance: number | null = null;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--map' && argv[i + 1]) mapKey = argv[++i];
    else if (argv[i] === '--tolerance' && argv[i + 1]) tolerance = parseFloat(argv[++i]);
    else if (argv[i] === '--geo-tolerance' && argv[i + 1]) geoTolerance = parseFloat(argv[++i]);
  }

  return { mapKey, tolerance, geoTolerance };
}

const args = parseArgs(process.argv.slice(2));

const toProcess = args.mapKey
  ? { [args.mapKey]: REGION_SPECS[args.mapKey] }
  : REGION_SPECS;

for (const [key, spec] of Object.entries(toProcess)) {
  if (!spec) {
    console.error(`Unknown region map: ${key}. Available: ${Object.keys(REGION_SPECS).join(', ')}`);
    process.exit(1);
  }
  buildRegionMap(key, spec, args.tolerance ?? undefined, args.geoTolerance ?? undefined);
}

/**
 * GeoJSON → SVG build script for LandMark maps.
 *
 * Usage:
 *   npm run landmark:maps                          # rebuild all maps
 *   npm run landmark:maps -- --map nyc             # rebuild one map
 *   npm run landmark:maps -- --tolerance 1.5       # override tolerance
 *   npm run landmark:maps -- --map nyc --print-pins 40.785,-73.968 40.706,-73.997
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

type MapSpec = {
  /** Path to the dataset JSON (contains bounds + viewBox). */
  datasetPath: string;
  /** Path to the source GeoJSON file. */
  geojsonPath: string;
  /** GeoJSON feature property that holds the region name. */
  featureNameProp: string;
  /** Fill colours keyed by region name. Takes priority over palette. */
  fills: Record<string, string>;
  /**
   * Fallback colour palette — cycled through features not in `fills`.
   * If omitted, unlisted features fall back to '#cccccc'.
   */
  palette?: string[];
  /** Output path for the labeled SVG. */
  outputLabeled: string;
  /** Output path for the blank SVG. */
  outputBlank: string;
  /** Douglas-Peucker tolerance in SVG pixels. */
  tolerance: number;
  /**
   * When true, the labeled SVG omits the auto-generated per-feature text
   * labels. Use together with customLabels to supply a hand-curated layer.
   */
  suppressFeatureLabels?: boolean;
  /**
   * Limit auto-generated feature labels to the N largest features by
   * bounding-box area. Useful for maps with many small sub-regions (e.g.
   * 200+ wards) where labelling every feature is unreadable.
   * Ignored when suppressFeatureLabels is true.
   */
  maxLabels?: number;
  /**
   * SVG stroke-width for region borders. Defaults to 1.
   * Use 0.5 for dense maps where thin borders look cleaner.
   */
  strokeWidth?: number;
  /**
   * Hand-curated neighbourhood labels projected from lat/lon and rendered
   * as an overlay on the labeled SVG only.
   */
  customLabels?: Array<{ name: string; lat: number; lon: number }>;
};

type Point = { x: number; y: number };

// ---------------------------------------------------------------------------
// Default palette — 8 muted map colours, cycled for cities with many features
// ---------------------------------------------------------------------------

const DEFAULT_PALETTE = [
  '#e8c8a8', '#e0b8b8', '#d4c9a8', '#e8dfa8',
  '#b8d4a8', '#c8d4e8', '#d4c8e8', '#e8d4c8',
];

// ---------------------------------------------------------------------------
// Load map specifications from manifest
// ---------------------------------------------------------------------------

function loadMapSpecs(): Record<string, MapSpec> {
  const root = path.resolve(import.meta.dirname, '..');
  const manifestPath = path.resolve(root, 'scripts/geo-data/manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as {
    cities: Array<{
      id: string;
      geojson: string | null;
      featureNameProp: string;
      fills: Record<string, string> | null;
      palette: string[] | null;
      tolerance: number;
      strokeWidth: number | null;
      maxLabels: number | null;
      suppressFeatureLabels: boolean;
      customLabels: Array<{ name: string; lat: number; lon: number }> | null;
    }>;
  };

  const specs: Record<string, MapSpec> = {};
  for (const entry of manifest.cities) {
    if (!entry.geojson) continue; // skip entries with no GeoJSON (e.g. africa_cities)
    specs[entry.id] = {
      datasetPath: `public/data/landmarks/${entry.id}.json`,
      geojsonPath: entry.geojson,
      featureNameProp: entry.featureNameProp,
      fills: entry.fills ?? {},
      palette: entry.palette ?? DEFAULT_PALETTE,
      outputLabeled: `public/images/maps/${entry.id}_labeled.svg`,
      outputBlank: `public/images/maps/${entry.id}_blank.svg`,
      tolerance: entry.tolerance,
      ...(entry.strokeWidth !== null ? { strokeWidth: entry.strokeWidth } : {}),
      ...(entry.maxLabels !== null ? { maxLabels: entry.maxLabels } : {}),
      ...(entry.suppressFeatureLabels ? { suppressFeatureLabels: true } : {}),
      ...(entry.customLabels ? { customLabels: entry.customLabels } : {}),
    };
  }
  return specs;
}

const MAP_SPECS: Record<string, MapSpec> = loadMapSpecs();

// ---------------------------------------------------------------------------
// Coordinate helpers
// ---------------------------------------------------------------------------

/** Affine transform: geographic (lon, lat) → SVG pixel (x, y). */
function project(
  lon: number,
  lat: number,
  bounds: GeoBounds,
  dims: SvgDimensions,
): Point {
  return {
    x: ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * dims.width,
    y: ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * dims.height,
  };
}

/** Parse a viewBox string ("0 0 800 700") into width/height. */
function parseViewBox(viewBox: string): SvgDimensions {
  const parts = viewBox.trim().split(/\s+/).map(Number);
  return { width: parts[2], height: parts[3] };
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

/** Return the ring with the largest bounding-box area (skips tiny islands). */
function largestRing(rings: number[][][]): number[][] {
  let best: number[][] = rings[0];
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
    if (area > bestArea) {
      bestArea = area;
      best = ring;
    }
  }
  return best;
}

/** Project a ring, simplify, and return an SVG path `d` string. */
function ringToPath(
  ring: number[][],
  bounds: GeoBounds,
  dims: SvgDimensions,
  tolerance: number,
): string {
  const projected: Point[] = ring.map(([lon, lat]) =>
    project(lon, lat, bounds, dims),
  );
  const simplified = simplify(projected, tolerance, false);
  if (simplified.length < 2) return '';
  const coords = simplified
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${Math.round(p.x)},${Math.round(p.y)}`)
    .join(' ');
  return coords + ' Z';
}

/**
 * Convert a GeoJSON Polygon or MultiPolygon geometry to a single `d` string.
 * For each polygon takes only the outer ring (index 0); holes are skipped.
 * For MultiPolygon, keeps only the ring with the largest bounding-box area
 * among all polygons' outer rings (avoids tiny offshore islands dominating).
 */
function geometryToPathD(
  geometry: { type: string; coordinates: unknown },
  bounds: GeoBounds,
  dims: SvgDimensions,
  tolerance: number,
): string {
  if (geometry.type === 'Polygon') {
    const rings = geometry.coordinates as number[][][];
    return ringToPath(rings[0], bounds, dims, tolerance);
  }

  if (geometry.type === 'MultiPolygon') {
    const polygons = geometry.coordinates as number[][][][];
    // Collect all outer rings and pick the largest
    const outerRings = polygons.map((poly) => poly[0]);
    const main = largestRing(outerRings);
    return ringToPath(main, bounds, dims, tolerance);
  }

  return '';
}

/** Naive bounding-box centroid of a path's integer coordinate pairs. */
function featureCentroid(pathD: string): Point {
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

/** Bounding-box area of a path — used to rank features by size for label selection. */
function pathBboxArea(pathD: string): number {
  const nums = [...pathD.matchAll(/([-\d.]+),([-\d.]+)/g)].map((m) => ({
    x: parseFloat(m[1]),
    y: parseFloat(m[2]),
  }));
  if (nums.length === 0) return 0;
  const minX = Math.min(...nums.map((p) => p.x));
  const maxX = Math.max(...nums.map((p) => p.x));
  const minY = Math.min(...nums.map((p) => p.y));
  const maxY = Math.max(...nums.map((p) => p.y));
  return (maxX - minX) * (maxY - minY);
}

/** Convert a feature name to a kebab-case id (e.g. "Staten Island" → "staten-island"). */
function toKebab(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

// ---------------------------------------------------------------------------
// SVG generation
// ---------------------------------------------------------------------------

function buildSvg(
  features: Array<{ id: string; name: string; fill: string; pathD: string }>,
  dims: SvgDimensions,
  labeled: boolean,
  opts: {
    suppressFeatureLabels?: boolean;
    customLabelsSvg?: string;
    /** Only label the N largest features by bounding-box area. */
    maxLabels?: number;
    /** SVG stroke-width for region borders. Defaults to 1. */
    strokeWidth?: number;
  } = {},
): string {
  const W = dims.width;
  const H = dims.height;
  const sw = opts.strokeWidth ?? 1;

  const paths = features
    .map(
      ({ id, fill, pathD }) =>
        `  <path id="${id}" d="${pathD}" fill="${fill}" stroke="#777" stroke-width="${sw}"/>`,
    )
    .join('\n');

  // When maxLabels is set, rank features by area and keep only the largest N.
  const labelFeatures =
    labeled && !opts.suppressFeatureLabels && opts.maxLabels !== undefined
      ? [...features]
          .sort((a, b) => pathBboxArea(b.pathD) - pathBboxArea(a.pathD))
          .slice(0, opts.maxLabels)
      : features;

  const featureLabels = labeled && !opts.suppressFeatureLabels
    ? labelFeatures
        .map(({ name, pathD }) => {
          const c = featureCentroid(pathD);
          return (
            `  <text x="${Math.round(c.x)}" y="${Math.round(c.y)}" ` +
            `font-family="sans-serif" font-size="13" font-weight="bold" ` +
            `fill="#444" text-anchor="middle">${name}</text>`
          );
        })
        .join('\n')
    : '';

  const compass =
    `  <g transform="translate(${W - 40},${H - 32})">\n` +
    `    <circle r="14" fill="white" stroke="#aaa" stroke-width="1"/>\n` +
    `    <text x="0" y="-3" font-family="sans-serif" font-size="9" fill="#555" text-anchor="middle">N</text>\n` +
    `    <line x1="0" y1="-8" x2="0" y2="8" stroke="#888" stroke-width="1"/>\n` +
    `    <line x1="-8" y1="0" x2="8" y2="0" stroke="#888" stroke-width="1"/>\n` +
    `  </g>`;

  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">`,
    `  <rect width="${W}" height="${H}" fill="#c8e6f5"/>`,
    paths,
    ...(featureLabels ? [featureLabels] : []),
    ...(labeled && opts.customLabelsSvg ? [opts.customLabelsSvg] : []),
    compass,
    `</svg>`,
  ];

  return parts.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// Core build function
// ---------------------------------------------------------------------------

function buildMap(mapKey: string, spec: MapSpec, toleranceOverride?: number): void {
  const tolerance = toleranceOverride ?? spec.tolerance;

  // Resolve paths relative to the project root (script runs from repo root via tsx)
  const root = path.resolve(import.meta.dirname, '..');

  const geojsonAbs = path.resolve(root, spec.geojsonPath);
  const datasetAbs = path.resolve(root, spec.datasetPath);

  if (!fs.existsSync(geojsonAbs)) {
    console.error(`[${mapKey}] GeoJSON not found: ${spec.geojsonPath}`);
    console.error(
      `  Download it and save to that path, then re-run.\n` +
      `  NYC: https://data.cityofnewyork.us/api/geospatial/7t3b-ywvw?method=export&type=GeoJSON`,
    );
    process.exit(1);
  }

  const dataset = JSON.parse(fs.readFileSync(datasetAbs, 'utf-8'));
  const bounds: GeoBounds = dataset.bounds;
  const dims: SvgDimensions = parseViewBox(dataset.viewBox);

  const geojson = JSON.parse(fs.readFileSync(geojsonAbs, 'utf-8'));

  const features: Array<{ id: string; name: string; fill: string; pathD: string }> = [];
  let paletteIndex = 0;
  const paletteCache: Record<string, string> = {};

  function pickFill(name: string): string {
    if (spec.fills[name]) return spec.fills[name];
    if (!spec.palette) return '#cccccc';
    if (!paletteCache[name]) {
      paletteCache[name] = spec.palette[paletteIndex % spec.palette.length];
      paletteIndex++;
    }
    return paletteCache[name];
  }

  for (const feature of geojson.features) {
    const name: string = feature.properties[spec.featureNameProp] ?? '';
    if (!name) continue;

    const fill = pickFill(name);
    const pathD = geometryToPathD(feature.geometry, bounds, dims, tolerance);
    if (!pathD) {
      console.warn(`[${mapKey}] Empty path for feature: ${name}`);
      continue;
    }
    features.push({ id: toKebab(name), name, fill, pathD });
  }

  if (features.length === 0) {
    console.error(
      `[${mapKey}] No features produced. Check featureNameProp ("${spec.featureNameProp}") matches your GeoJSON properties.`,
    );
    process.exit(1);
  }

  // Build optional custom-label overlay (projected from lat/lon, labeled SVG only)
  let customLabelsSvg = '';
  if (spec.customLabels) {
    customLabelsSvg = spec.customLabels
      .map(({ name, lat, lon }) => {
        const pt = project(lon, lat, bounds, dims);
        const x = Math.round(pt.x);
        const y = Math.round(pt.y);
        return (
          `  <text x="${x}" y="${y}" font-family="sans-serif" font-size="13" font-weight="bold" ` +
          `fill="#333" text-anchor="middle" ` +
          `paint-order="stroke" stroke="#fff" stroke-width="3" stroke-linejoin="round">${name}</text>`
        );
      })
      .join('\n');
  }

  const labeledSvg = buildSvg(features, dims, true, {
    suppressFeatureLabels: spec.suppressFeatureLabels,
    customLabelsSvg,
    maxLabels: spec.maxLabels,
    strokeWidth: spec.strokeWidth,
  });
  const blankSvg = buildSvg(features, dims, false, { strokeWidth: spec.strokeWidth });

  const outLabeled = path.resolve(root, spec.outputLabeled);
  const outBlank = path.resolve(root, spec.outputBlank);

  fs.mkdirSync(path.dirname(outLabeled), { recursive: true });
  fs.writeFileSync(outLabeled, labeledSvg);
  fs.writeFileSync(outBlank, blankSvg);

  console.log(`[${mapKey}] Written:`);
  console.log(`  ${spec.outputLabeled}  (${features.length} features, tolerance=${tolerance})`);
  console.log(`  ${spec.outputBlank}`);
}

// ---------------------------------------------------------------------------
// --print-pins helper
// ---------------------------------------------------------------------------

function printPins(
  mapKey: string,
  datasetPath: string,
  pinArgs: string[],
): void {
  const root = path.resolve(import.meta.dirname, '..');
  const datasetAbs = path.resolve(root, datasetPath);
  const dataset = JSON.parse(fs.readFileSync(datasetAbs, 'utf-8'));
  const bounds: GeoBounds = dataset.bounds;
  const dims: SvgDimensions = parseViewBox(dataset.viewBox);

  console.log(`\nPin coordinates for map: ${mapKey}`);
  for (const pin of pinArgs) {
    const [latStr, lonStr] = pin.split(',');
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    if (isNaN(lat) || isNaN(lon)) {
      console.warn(`  Skipping invalid pin: ${pin}`);
      continue;
    }
    const pt = project(lon, lat, bounds, dims);
    console.log(`  lat=${lat}, lon=${lon}  →  svgX=${Math.round(pt.x)}  svgY=${Math.round(pt.y)}`);
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): {
  mapKey: string | null;
  tolerance: number | null;
  printPins: string[];
} {
  let mapKey: string | null = null;
  let tolerance: number | null = null;
  const pins: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--map' && argv[i + 1]) {
      mapKey = argv[++i];
    } else if (argv[i] === '--tolerance' && argv[i + 1]) {
      tolerance = parseFloat(argv[++i]);
    } else if (argv[i] === '--print-pins') {
      // Collect all following args that look like "lat,lon"
      while (argv[i + 1] && /^-?\d/.test(argv[i + 1])) {
        pins.push(argv[++i]);
      }
    }
  }

  return { mapKey, tolerance, printPins: pins };
}

const args = parseArgs(process.argv.slice(2));

if (args.printPins.length > 0) {
  const key = args.mapKey ?? Object.keys(MAP_SPECS)[0];
  const spec = MAP_SPECS[key];
  const datasetPath = spec?.datasetPath ?? `public/data/landmarks/${key}.json`;
  const root = path.resolve(import.meta.dirname, '..');
  if (!spec && !fs.existsSync(path.resolve(root, datasetPath))) {
    console.error(`Unknown map: ${key}`);
    process.exit(1);
  }
  printPins(key, datasetPath, args.printPins);
} else {
  const toProcess = args.mapKey
    ? { [args.mapKey]: MAP_SPECS[args.mapKey] }
    : MAP_SPECS;

  for (const [key, spec] of Object.entries(toProcess)) {
    if (!spec) {
      console.error(`Unknown map: ${key}`);
      process.exit(1);
    }
    buildMap(key, spec, args.tolerance ?? undefined);
  }
}

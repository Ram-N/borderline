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
// Map specifications — add new cities/countries here
// ---------------------------------------------------------------------------

const MAP_SPECS: Record<string, MapSpec> = {
  nyc: {
    datasetPath: 'public/data/landmarks/nyc.json',
    geojsonPath: 'scripts/geojson/nyc_boroughs.geojson',
    featureNameProp: 'name',
    fills: {
      Manhattan: '#e8c8a8',
      Bronx: '#e0b8b8',
      Brooklyn: '#d4c9a8',
      Queens: '#e8dfa8',
      'Staten Island': '#b8d4a8',
    },
    outputLabeled: 'public/images/maps/nyc_labeled.svg',
    outputBlank: 'public/images/maps/nyc_blank.svg',
    tolerance: 2,
  },
  london: {
    datasetPath: 'public/data/landmarks/london.json',
    geojsonPath: 'scripts/geojson/london_boroughs.geojson',
    featureNameProp: 'name',
    fills: {},
    palette: DEFAULT_PALETTE,
    outputLabeled: 'public/images/maps/london_labeled.svg',
    outputBlank: 'public/images/maps/london_blank.svg',
    tolerance: 2,
  },
  paris: {
    datasetPath: 'public/data/landmarks/paris.json',
    geojsonPath: 'scripts/geojson/paris_arrondissements.geojson',
    featureNameProp: 'l_aroff',
    fills: {},
    palette: DEFAULT_PALETTE,
    outputLabeled: 'public/images/maps/paris_labeled.svg',
    outputBlank: 'public/images/maps/paris_blank.svg',
    tolerance: 1,
  },
  rome: {
    datasetPath: 'public/data/landmarks/rome.json',
    geojsonPath: 'scripts/geojson/rome_municipi.geojson',
    featureNameProp: 'etichetta_2',
    fills: {},
    palette: DEFAULT_PALETTE,
    outputLabeled: 'public/images/maps/rome_labeled.svg',
    outputBlank: 'public/images/maps/rome_blank.svg',
    tolerance: 3,
  },
  berlin: {
    datasetPath: 'public/data/landmarks/berlin.json',
    geojsonPath: 'scripts/geojson/berlin_bezirke.geojson',
    featureNameProp: 'Gemeinde_name',
    fills: {},
    palette: DEFAULT_PALETTE,
    outputLabeled: 'public/images/maps/berlin_labeled.svg',
    outputBlank: 'public/images/maps/berlin_blank.svg',
    tolerance: 2,
  },
  bangalore: {
    datasetPath: 'public/data/landmarks/bangalore.json',
    geojsonPath: 'scripts/geojson/india_bangalore.geojson',
    featureNameProp: 'KGISWardName',
    fills: {},
    palette: DEFAULT_PALETTE,
    outputLabeled: 'public/images/maps/bangalore_labeled.svg',
    outputBlank: 'public/images/maps/bangalore_blank.svg',
    tolerance: 1,
  },
  chennai: {
    datasetPath: 'public/data/landmarks/chennai.json',
    geojsonPath: 'scripts/geojson/india_chennai.geojson',
    featureNameProp: 'Zone Name',
    fills: {},
    palette: DEFAULT_PALETTE,
    outputLabeled: 'public/images/maps/chennai_labeled.svg',
    outputBlank: 'public/images/maps/chennai_blank.svg',
    tolerance: 1,
  },
  delhi: {
    datasetPath: 'public/data/landmarks/delhi.json',
    geojsonPath: 'scripts/geojson/india_delhi.geojson',
    featureNameProp: 'Ward_Name',
    fills: {},
    palette: DEFAULT_PALETTE,
    outputLabeled: 'public/images/maps/delhi_labeled.svg',
    outputBlank: 'public/images/maps/delhi_blank.svg',
    tolerance: 1,
    suppressFeatureLabels: true,
    customLabels: [
      { name: 'Old Delhi',        lat: 28.6562, lon: 77.2302 },
      { name: 'Connaught Place',  lat: 28.6315, lon: 77.2167 },
      { name: 'Karol Bagh',       lat: 28.6519, lon: 77.1909 },
      { name: 'Lajpat Nagar',     lat: 28.5678, lon: 77.2431 },
      { name: 'Saket',            lat: 28.5244, lon: 77.2167 },
      { name: 'Mehrauli',         lat: 28.5197, lon: 77.1855 },
      { name: 'Hauz Khas',        lat: 28.5494, lon: 77.2001 },
      { name: 'Nehru Place',      lat: 28.5490, lon: 77.2503 },
      { name: 'Janakpuri',        lat: 28.6289, lon: 77.0833 },
      { name: 'Dwarka',           lat: 28.5823, lon: 77.0500 },
      { name: 'Rohini',           lat: 28.7495, lon: 77.0947 },
      { name: 'Pitampura',        lat: 28.6999, lon: 77.1334 },
      { name: 'Shahdara',         lat: 28.6725, lon: 77.2940 },
      { name: 'Vasant Kunj',      lat: 28.5234, lon: 77.1565 },
    ],
  },
  mumbai: {
    datasetPath: 'public/data/landmarks/mumbai.json',
    geojsonPath: 'scripts/geojson/india_mumbai.geojson',
    featureNameProp: 'name',
    fills: {},
    palette: DEFAULT_PALETTE,
    outputLabeled: 'public/images/maps/mumbai_labeled.svg',
    outputBlank: 'public/images/maps/mumbai_blank.svg',
    tolerance: 1,
  },
  kolkata: {
    datasetPath: 'public/data/landmarks/kolkata.json',
    geojsonPath: 'scripts/geojson/india_kolkata.geojson',
    featureNameProp: 'WARD',
    fills: {},
    palette: DEFAULT_PALETTE,
    outputLabeled: 'public/images/maps/kolkata_labeled.svg',
    outputBlank: 'public/images/maps/kolkata_blank.svg',
    tolerance: 1,
    suppressFeatureLabels: true,
    customLabels: [
      { name: 'Shyambazar',   lat: 22.5922, lon: 88.3688 },
      { name: 'Dum Dum',      lat: 22.6340, lon: 88.3956 },
      { name: 'Ultadanga',    lat: 22.5775, lon: 88.3906 },
      { name: 'New Market',   lat: 22.5626, lon: 88.3516 },
      { name: 'Park Street',  lat: 22.5508, lon: 88.3521 },
      { name: 'Alipore',      lat: 22.5398, lon: 88.3299 },
      { name: 'Ballygunge',   lat: 22.5263, lon: 88.3636 },
      { name: 'Kasba',        lat: 22.5133, lon: 88.3771 },
      { name: 'Jadavpur',     lat: 22.4967, lon: 88.3701 },
      { name: 'Tollygunge',   lat: 22.4934, lon: 88.3448 },
      { name: 'Behala',       lat: 22.4967, lon: 88.3097 },
      { name: 'Salt Lake',    lat: 22.5795, lon: 88.4169 },
      { name: 'Gariahat',     lat: 22.5197, lon: 88.3681 },
    ],
  },
};

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
  opts: { suppressFeatureLabels?: boolean; customLabelsSvg?: string } = {},
): string {
  const W = dims.width;
  const H = dims.height;

  const paths = features
    .map(
      ({ id, fill, pathD }) =>
        `  <path id="${id}" d="${pathD}" fill="${fill}" stroke="#777" stroke-width="1"/>`,
    )
    .join('\n');

  const featureLabels = labeled && !opts.suppressFeatureLabels
    ? features
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
  });
  const blankSvg = buildSvg(features, dims, false);

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
  spec: MapSpec,
  pinArgs: string[],
): void {
  const root = path.resolve(import.meta.dirname, '..');
  const datasetAbs = path.resolve(root, spec.datasetPath);
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
  if (!spec) {
    console.error(`Unknown map: ${key}`);
    process.exit(1);
  }
  printPins(key, spec, args.printPins);
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

#!/usr/bin/env tsx
/**
 * Generates high-resolution puzzle map SVG files from Natural Earth 10m data.
 * Replaces the legacy hand-crafted region_world_*Low.svg files.
 *
 * Usage: npx tsx scripts/generatePuzzleMaps.ts
 * Output: public/images/maps/region_world_{region}Low.svg
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import simplify from 'simplify-js';

// ── Types ────────────────────────────────────────────────────────────────────

type Point = { x: number; y: number };
type Ring = number[][];

interface GeoFeature {
  properties: Record<string, unknown>;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: Ring[] | Ring[][];
  };
}

interface GeoBounds { minLat: number; maxLat: number; minLon: number; maxLon: number; }
interface SvgDims   { width: number; height: number; }

// ── Cosine-corrected equirectangular projection ──────────────────────────────

function projectionLayout(bounds: GeoBounds, dims: SvgDims) {
  const centerLat = (bounds.minLat + bounds.maxLat) / 2;
  const cosLat    = Math.cos(centerLat * Math.PI / 180);
  const lonRange  = bounds.maxLon - bounds.minLon;
  const latRange  = bounds.maxLat - bounds.minLat;
  const geoAspect = (lonRange * cosLat) / latRange;
  const svgAspect = dims.width / dims.height;
  let usedWidth: number, usedHeight: number, offsetX: number, offsetY: number;
  if (geoAspect <= svgAspect) {
    usedHeight = dims.height;
    usedWidth  = geoAspect * dims.height;
    offsetX    = (dims.width - usedWidth) / 2;
    offsetY    = 0;
  } else {
    usedWidth  = dims.width;
    usedHeight = dims.width / geoAspect;
    offsetX    = 0;
    offsetY    = (dims.height - usedHeight) / 2;
  }
  return { usedWidth, usedHeight, offsetX, offsetY, lonRange, latRange };
}

function project(lon: number, lat: number, bounds: GeoBounds, dims: SvgDims): Point {
  const { usedWidth, usedHeight, offsetX, offsetY, lonRange, latRange } = projectionLayout(bounds, dims);
  return {
    x: offsetX + ((lon - bounds.minLon) / lonRange) * usedWidth,
    y: offsetY + ((bounds.maxLat - lat) / latRange) * usedHeight,
  };
}

// ── Path building ────────────────────────────────────────────────────────────

function ringToPathD(ring: Ring, bounds: GeoBounds, dims: SvgDims, tol: number): string {
  const pts = ring.map(([lon, lat]) => project(lon, lat, bounds, dims));
  const simplified = pts.length >= 3
    ? (simplify(pts, tol, true) as Point[])
    : pts;
  if (simplified.length < 2) return '';
  // Skip rings with no point inside the SVG viewport — they are invisible and
  // would corrupt downstream bounding-box calculations (e.g. Baja California
  // on a Central America map, or Clipperton Island on a Europe map).
  const margin = 5; // small tolerance for coastlines that just touch the edge
  const hasVisiblePoint = simplified.some(
    p => p.x >= -margin && p.x <= dims.width + margin &&
         p.y >= -margin && p.y <= dims.height + margin
  );
  if (!hasVisiblePoint) return '';
  return 'M ' + simplified.map(p => `${Math.round(p.x)},${Math.round(p.y)}`).join(' L ') + ' Z';
}

function featureToPathD(feat: GeoFeature, bounds: GeoBounds, dims: SvgDims, tol: number): string {
  const parts: string[] = [];
  if (feat.geometry.type === 'Polygon') {
    for (const ring of feat.geometry.coordinates as Ring[]) {
      const d = ringToPathD(ring, bounds, dims, tol);
      if (d) parts.push(d);
    }
  } else {
    for (const polygon of feat.geometry.coordinates as Ring[][]) {
      for (const ring of polygon) {
        const d = ringToPathD(ring, bounds, dims, tol);
        if (d) parts.push(d);
      }
    }
  }
  return parts.join(' ');
}

// ── Country lookup ───────────────────────────────────────────────────────────

function countCoords(f: GeoFeature): number {
  if (f.geometry.type === 'Polygon') {
    return (f.geometry.coordinates as Ring[]).reduce((s, r) => s + r.length, 0);
  }
  return (f.geometry.coordinates as Ring[][]).reduce(
    (s, poly) => s + poly.reduce((t, r) => t + r.length, 0), 0
  );
}

// When two features share the same ISO code (e.g. France and Clipperton Island
// both have ISO_A2_EH='FR'), keep the one with more coordinate points — the
// main country polygon is always larger than any dependent territory.
function setIfLarger(map: Map<string, GeoFeature>, code: string, f: GeoFeature) {
  const existing = map.get(code);
  if (!existing || countCoords(f) > countCoords(existing)) {
    map.set(code, f);
  }
}

function buildLookup(features: GeoFeature[]): Map<string, GeoFeature> {
  const map = new Map<string, GeoFeature>();
  for (const f of features) {
    const iso2   = f.properties['ISO_A2']    as string;
    const iso2eh = f.properties['ISO_A2_EH'] as string;
    const name   = ((f.properties['NAME'] as string) ?? '').toLowerCase();

    if (iso2 && iso2 !== '-99') {
      setIfLarger(map, iso2, f);
    } else if (iso2eh && iso2eh !== '-99') {
      setIfLarger(map, iso2eh, f);
    }
    // Special cases where ISO_A2 is missing in NE data
    if (name === 'kosovo') map.set('XK', f);
    if (name === 'taiwan') map.set('TW', f);
  }
  return map;
}

// ── Region definitions ───────────────────────────────────────────────────────

// ISO_A2 codes per region — extracted from the original region_world_*Low.svg files.
// Unknown/non-standard codes (GO, JU) are omitted; they will be logged as missing.
const REGION_CODES: Record<string, string[]> = {
  africa: [
    'AO','BF','BI','BJ','BW','CD','CF','CG','CI','CM','CV','DJ','DZ','EG','EH',
    'ER','ES','ET','GA','GH','GM','GN','GQ','GW','KE','KM','LR','LS','LY','MA',
    'MG','ML','MR','MU','MW','MZ','NA','NE','NG','PT','RE','RW','SC','SD','SH',
    'SL','SN','SO','SS','ST','SZ','TD','TG','TN','TZ','UG','YT','ZA','ZM','ZW',
  ],
  asia: [
    'AE','AF','BD','BH','BN','BT','CN','HK','ID','IL','IN','IO','IQ','IR','JO',
    'JP','KG','KH','KP','KR','KW','KZ','LA','LB','LK','MM','MN','MO','MV','MY',
    'NP','OM','PG','PH','PK','PS','QA','RU','SA','SG','SY','TH','TJ','TL','TM',
    'TW','UZ','VN','YE',
  ],
  caribbean: [
    'AG','AI','AW','BB','BL','BQ','BS','CU','CW','DM','DO','GD','GP','HT','JM',
    'KN','KY','LC','MF','MQ','MS','PR','SX','TC','TT','VC','VG','VI',
  ],
  centralAmerica: ['BZ','CR','GT','HN','MX','NI','PA','SV'],
  europe: [
    'AD','AL','AM','AT','AX','AZ','BA','BE','BG','BY','CH','CY','CZ','DE','DK',
    'EE','ES','FI','FO','FR','GB','GE','GG','GI','GR','HR','HU','IE','IM','IS',
    'IT','JE','LI','LT','LU','LV','MC','MD','ME','MK','MT','NL','NO','PL','PT',
    'RO','RS','RU','SE','SI','SJ','SK','SM','TR','UA','VA','XK',
  ],
  latinAmerica: [
    'AG','AI','AR','AW','BB','BL','BO','BQ','BR','BS','BZ','CL','CO','CR','CU',
    'CW','DM','DO','EC','FK','GD','GF','GP','GT','GY','HN','HT','JM','KN','KY',
    'LC','MF','MQ','MS','MX','NI','PA','PE','PR','PY','SR','SV','SX','TC','TT',
    'UY','VC','VE','VG','VI',
  ],
  middleEast: ['AE','BH','IL','IQ','IR','JO','KW','LB','OM','PS','QA','SA','SY','YE'],
  northAmerica: [
    'AG','AI','AW','BB','BL','BM','BQ','BS','BZ','CA','CR','CU','CW','DM','DO',
    'GD','GL','GP','GT','HN','HT','JM','KN','KY','LC','MF','MQ','MS','MX','NI',
    'PA','PM','PR','SV','SX','TC','TT','US','VC','VG','VI',
  ],
  oceania: [
    'AU','CC','CX','FJ','FM','GU','ID','KI','MH','MP','NC','NF','NR','NZ','PG',
    'PW','SB','TL','TV','VU',
  ],
  southAmerica: [
    'AR','BO','BR','CL','CO','EC','FK','GF','GY','PE','PY','SR','UY','VE',
  ],
};

// Explicit geographic bounds per region so that overseas territories of
// other continents (e.g. Spanish Canaries on the Africa map) are clipped
// correctly by SVG's natural viewport clipping.
const REGION_BOUNDS: Record<string, GeoBounds> = {
  africa:        { minLat: -36, maxLat: 38,  minLon: -18,  maxLon:  52 },
  asia:          { minLat: -11, maxLat: 55,  minLon:  26,  maxLon: 148 },
  caribbean:     { minLat:  10, maxLat: 28,  minLon: -85,  maxLon: -59 },
  centralAmerica:{ minLat:   6, maxLat: 22,  minLon: -93,  maxLon: -77 },
  europe:        { minLat:  33, maxLat: 73,  minLon: -28,  maxLon:  65 },
  latinAmerica:  { minLat: -56, maxLat: 33,  minLon:-120,  maxLon: -34 },
  middleEast:    { minLat:  12, maxLat: 43,  minLon:  25,  maxLon:  64 },
  northAmerica:  { minLat:   6, maxLat: 84,  minLon:-170,  maxLon: -52 },
  oceania:       { minLat: -48, maxLat:   2, minLon: 112,  maxLon: 180 },
  southAmerica:  { minLat: -57, maxLat:  13, minLon: -82,  maxLon: -34 },
};

// ── SVG assembly ─────────────────────────────────────────────────────────────

function buildSvg(
  paths: Array<{ id: string; title: string; d: string }>,
  dims: SvgDims,
): string {
  const pathElems = paths
    .map(p => `  <path d="${p.d}" class="land" id="${p.id}" title="${p.title}"/>`)
    .join('\n');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dims.width} ${dims.height}">\n` +
    `  <rect width="${dims.width}" height="${dims.height}" fill="#6ab4d8"/>\n` +
    pathElems + '\n' +
    `</svg>\n`
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

const GEOJSON_PATH = join('scripts', 'geo-data', 'world', 'ne_10m_countries.geojson');
const OUTPUT_DIR   = join('public', 'images', 'maps');
const SVG_DIMS: SvgDims = { width: 960, height: 600 };
const SVG_TOLERANCE = 0.5; // SVG pixel simplification — same as Europe in generateRegionMaps

const geoJson = JSON.parse(readFileSync(GEOJSON_PATH, 'utf-8'));
const lookup  = buildLookup(geoJson.features as GeoFeature[]);

for (const [region, codes] of Object.entries(REGION_CODES)) {
  const bounds = REGION_BOUNDS[region];
  if (!bounds) { console.error(`No bounds defined for ${region}`); continue; }

  const entries: Array<{ code: string; feature: GeoFeature }> = [];
  const missing: string[] = [];

  for (const code of codes) {
    const f = lookup.get(code);
    if (f) entries.push({ code, feature: f });
    else   missing.push(code);
  }

  if (missing.length > 0) console.warn(`[${region}] Missing ISO codes: ${missing.join(', ')}`);
  if (entries.length === 0) { console.error(`[${region}] No features, skipping`); continue; }

  const paths = entries
    .map(({ code, feature }) => ({
      id:    code,
      title: (feature.properties['NAME'] as string) ?? code,
      d:     featureToPathD(feature, bounds, SVG_DIMS, SVG_TOLERANCE),
    }))
    .filter(p => p.d.length > 0);

  const svg = buildSvg(paths, SVG_DIMS);
  const outPath = join(OUTPUT_DIR, `region_world_${region}Low.svg`);
  writeFileSync(outPath, svg);
  console.log(`[${region}] Written ${outPath}  (${paths.length} countries)`);
}

export type RegionMapConfig = {
  /** Human-readable label shown in the UI. */
  label: string;
  /** URL to the JSON dataset under /data/regions/. */
  dataUrl: string;
  /** SVG with all internal region borders — used for difficulty 1–3. */
  boundariesSvg: string;
  /** SVG with only the outer country/continent outline — used for difficulty 4–5. */
  outlineSvg: string;
};

export { REGION_MAP_CONFIG } from '../generated/geoRegistry';

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

export const REGION_MAP_CONFIG: Record<string, RegionMapConfig> = {
  india: {
    label: 'India',
    dataUrl: '/data/regions/india.json',
    boundariesSvg: '/images/maps/india_boundaries.svg',
    outlineSvg: '/images/maps/india_outline.svg',
  },
  // Additional regions can be added here as their maps are generated:
  // usa: { label: 'United States', ... },
  // europe: { label: 'Europe', ... },
};

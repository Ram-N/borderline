import type { ConfidenceLevel } from './game';

/** A state, province, or other named sub-national region. */
export type RegionTarget = {
  id: string;
  name: string;
  /** Geographic centroid of the region. */
  lat: number;
  lon: number;
  /** SVG pixel coordinates of the centroid in the map's viewBox. */
  svgX: number;
  svgY: number;
  /** Simplified boundary polygons as arrays of [lat, lon] pairs.
   *  Multi-part countries (e.g. Malaysia, Indonesia) have multiple entries. */
  polygons: [number, number][][];
  hint?: string;
};

/** A named city or town, scored purely by distance (no polygon). */
export type CityTarget = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  svgX: number;
  svgY: number;
  hint?: string;
};

/** Dataset loaded from /data/regions/{id}.json. */
export type RegionDataset = {
  id: string;
  name: string;
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
  viewBox: string;
  regions: RegionTarget[];
  cities: CityTarget[];
};

export type RegionMode = 'regions' | 'cities';

export type WhereIsRegionRound = {
  target: RegionTarget | CityTarget;
  mode: RegionMode;
  confidence?: ConfidenceLevel;
  placedPin?: { svgX: number; svgY: number };
  distanceKm?: number;
  insideRegion?: boolean;
  baseScore?: number;
  finalScore?: number;
};

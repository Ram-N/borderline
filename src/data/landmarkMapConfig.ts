export type LandmarkMapConfig = {
  label: string;
  dataUrl: string;          // path to JSON dataset under /data/landmarks/
  labeledSvg: string;       // SVG with borough/area labels
  blankSvg: string;         // SVG without labels (difficulty 4-5)
  defaultDifficulty: 1 | 2 | 3 | 4 | 5;
  diagonalKm?: number;      // if set, scoring thresholds scale as fractions of this diagonal
};

export { LANDMARK_MAP_CONFIG } from '../generated/geoRegistry';

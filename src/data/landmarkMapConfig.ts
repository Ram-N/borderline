export type LandmarkMapConfig = {
  label: string;
  dataUrl: string;          // path to JSON dataset under /data/landmarks/
  labeledSvg: string;       // SVG with borough/area labels
  blankSvg: string;         // SVG without labels (difficulty 4-5)
  defaultDifficulty: 1 | 2 | 3 | 4 | 5;
};

export const LANDMARK_MAP_CONFIG: Record<string, LandmarkMapConfig> = {
  nyc: {
    label: 'New York City',
    dataUrl: '/data/landmarks/nyc.json',
    labeledSvg: '/images/maps/nyc_labeled.svg',
    blankSvg: '/images/maps/nyc_blank.svg',
    defaultDifficulty: 1,
  },
};

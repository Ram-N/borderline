export type Landmark = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  svgX: number;
  svgY: number;
  hint?: string;
};

export type LandmarkDataset = {
  id: string;
  name: string;
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
  viewBox: string; // e.g. "0 0 800 700"
  landmarks: Landmark[];
};

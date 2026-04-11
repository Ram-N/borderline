
export type NeighborMC = {
  label: string;
  prompt: string;
  options: string[];
  answer: string;
};

export type Question = {
  id: string;
  region: string;
  countryOfInterest: string;
  svgMap: string;
  targetId: string;
  labelStyle: 'numbers' | 'letters';
  neighbors: NeighborMC[];
  meta?: {
    difficulty?: 'easy' | 'medium' | 'hard';
  };
};

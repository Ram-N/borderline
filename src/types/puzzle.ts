export type HiddenCountryPuzzle = {
  type: 'hidden_country';
  center: string;
  visibleNeighbors: string[];
  choices: string[];
  correctAnswer: string;
  svgMap: string;
  region: string;
};

export type MissingNeighborPuzzle = {
  type: 'missing_neighbor';
  center: string;
  visibleNeighbors: string[];
  hiddenNeighbors: string[];
  choices: string[];
  correctAnswer: string;
  svgMap: string;
  region: string;
};

export type Puzzle = HiddenCountryPuzzle | MissingNeighborPuzzle;

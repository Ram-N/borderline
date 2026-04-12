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
  labeledNeighbors: string[];    // subset of visibleNeighbors that show name labels
  hiddenNeighbors: string[];
  contextCountries: string[];    // non-neighbors shown on map with labels for reference/distractors
  choices: string[];
  correctAnswer: string;
  svgMap: string;
  region: string;
};

export type Puzzle = HiddenCountryPuzzle | MissingNeighborPuzzle;

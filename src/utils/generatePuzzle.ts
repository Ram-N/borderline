import type { Puzzle, HiddenCountryPuzzle, MissingNeighborPuzzle } from '../types/puzzle';

export type AdjacencyData = Record<string, { name: string; neighbors: string[] }>;

// Fraction of visible neighbors that get name labels, by difficulty.
// For missing_neighbor (L3-L5) this is applied adaptively in generatePuzzle.
export const LABEL_DENSITY_BY_DIFFICULTY = [1.0, 0.75, 0.2, 0.0, 0.0] as const;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function inRegionNeighbors(code: string, adjacency: AdjacencyData, regionSet: Set<string>): string[] {
  return (adjacency[code]?.neighbors ?? []).filter(n => regionSet.has(n));
}

export function generatePuzzle(
  _type: 'hidden_country' | 'missing_neighbor',
  adjacency: AdjacencyData,
  regionCountryCodes: string[],
  svgMap: string,
  region: string,
  difficulty: 1 | 2 | 3 | 4 | 5 = 1,
  validTargets?: Set<string>
): Puzzle | null {
  const type: 'hidden_country' | 'missing_neighbor' =
    difficulty <= 2 ? 'hidden_country' : 'missing_neighbor';

  const regionSet = new Set(regionCountryCodes);
  const minNeighbors = type === 'hidden_country' ? 3 : 2;

  const eligible = regionCountryCodes.filter(
    code => inRegionNeighbors(code, adjacency, regionSet).length >= minNeighbors
  );

  if (eligible.length === 0) return null;

  const center = eligible[Math.floor(Math.random() * eligible.length)];
  const allNeighbors = inRegionNeighbors(center, adjacency, regionSet);
  const nonNeighbors = regionCountryCodes.filter(c => c !== center && !allNeighbors.includes(c));

  if (type === 'hidden_country') {
    if (nonNeighbors.length < 3) return null;
    const distractors = shuffle(nonNeighbors).slice(0, 3);
    const puzzle: HiddenCountryPuzzle = {
      type: 'hidden_country',
      center,
      visibleNeighbors: allNeighbors,
      choices: shuffle([center, ...distractors]),
      correctAnswer: center,
      svgMap,
      region,
    };
    return puzzle;
  }

  // missing_neighbor (L3/L4/L5)
  const hiddenCandidates = validTargets
    ? allNeighbors.filter(n => validTargets.has(n))
    : allNeighbors;
  if (hiddenCandidates.length === 0) return null;

  const hidden = hiddenCandidates[Math.floor(Math.random() * hiddenCandidates.length)];
  const visible = allNeighbors.filter(n => n !== hidden);

  // L5: text input — no choices, no distractors needed
  if (difficulty === 5) {
    const puzzle: MissingNeighborPuzzle = {
      type: 'missing_neighbor',
      center,
      visibleNeighbors: visible,
      labeledNeighbors: [],
      hiddenNeighbors: [hidden],
      contextCountries: [],
      choices: [],
      correctAnswer: hidden,
      svgMap,
      region,
    };
    return puzzle;
  }

  // Compute labeled neighbors adaptively:
  // Apply density, but cap so there are always enough unlabeled neighbors for distractors.
  const density = LABEL_DENSITY_BY_DIFFICULTY[difficulty - 1];
  const DISTRACTORS_NEEDED = 3;
  const rawLabelCount = Math.round(visible.length * density);
  const maxLabelCount = Math.max(0, visible.length - DISTRACTORS_NEEDED);
  const labelCount = Math.min(rawLabelCount, maxLabelCount);

  const sortedVisible = [...visible].sort();
  const labeledNeighbors = sortedVisible.slice(0, labelCount);
  const labeledSet = new Set(labeledNeighbors);
  const unlabeledVisible = visible.filter(n => !labeledSet.has(n));

  // Build distractors: prefer unlabeled visible neighbors (plausible, not shown as labels).
  // If not enough, fill from nonNeighbors shown on map as context countries.
  let distractors: string[];
  let contextCountries: string[] = [];

  if (unlabeledVisible.length >= DISTRACTORS_NEEDED) {
    distractors = shuffle(unlabeledVisible).slice(0, DISTRACTORS_NEEDED);
  } else {
    const shortfall = DISTRACTORS_NEEDED - unlabeledVisible.length;
    contextCountries = shuffle(nonNeighbors).slice(0, shortfall);
    distractors = shuffle([...unlabeledVisible, ...contextCountries]);
  }

  const puzzle: MissingNeighborPuzzle = {
    type: 'missing_neighbor',
    center,
    visibleNeighbors: visible,
    labeledNeighbors,
    hiddenNeighbors: [hidden],
    contextCountries,
    choices: shuffle([hidden, ...distractors]),
    correctAnswer: hidden,
    svgMap,
    region,
  };
  return puzzle;
}

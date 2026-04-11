import type { Puzzle, HiddenCountryPuzzle, MissingNeighborPuzzle } from '../types/puzzle';

export type AdjacencyData = Record<string, { name: string; neighbors: string[] }>;

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
  type: 'hidden_country' | 'missing_neighbor',
  adjacency: AdjacencyData,
  regionCountryCodes: string[],
  svgMap: string,
  region: string
): Puzzle | null {
  const regionSet = new Set(regionCountryCodes);
  const minNeighbors = type === 'hidden_country' ? 3 : 2;

  const eligible = regionCountryCodes.filter(
    code => inRegionNeighbors(code, adjacency, regionSet).length >= minNeighbors
  );

  if (eligible.length === 0) return null;

  const center = eligible[Math.floor(Math.random() * eligible.length)];
  const allNeighbors = inRegionNeighbors(center, adjacency, regionSet);

  const nonNeighbors = regionCountryCodes.filter(c => c !== center && !allNeighbors.includes(c));
  if (nonNeighbors.length < 3) return null;
  const distractors = shuffle(nonNeighbors).slice(0, 3);

  if (type === 'hidden_country') {
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
  } else {
    const hiddenIdx = Math.floor(Math.random() * allNeighbors.length);
    const hidden = allNeighbors[hiddenIdx];
    const visible = allNeighbors.filter((_, i) => i !== hiddenIdx);
    const puzzle: MissingNeighborPuzzle = {
      type: 'missing_neighbor',
      center,
      visibleNeighbors: visible,
      hiddenNeighbors: [hidden],
      choices: shuffle([hidden, ...distractors]),
      correctAnswer: hidden,
      svgMap,
      region,
    };
    return puzzle;
  }
}

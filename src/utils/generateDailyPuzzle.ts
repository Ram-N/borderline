/**
 * Deterministic puzzle generation for the Daily Puzzle mode.
 * Mirror of generatePuzzle.ts but accepts an rng function instead of Math.random().
 */

import type { Puzzle, HiddenCountryPuzzle, MissingNeighborPuzzle } from '../types/puzzle';
import { seededShuffle } from './seededRandom';
import { LABEL_DENSITY_BY_DIFFICULTY, type AdjacencyData } from './generatePuzzle';

function inRegionNeighbors(code: string, adjacency: AdjacencyData, regionSet: Set<string>): string[] {
  return (adjacency[code]?.neighbors ?? []).filter(n => regionSet.has(n));
}

export function generateDailyPuzzle(
  adjacency: AdjacencyData,
  regionCountryCodes: string[],
  svgMap: string,
  region: string,
  difficulty: 1 | 2 | 3 | 4 | 5,
  rng: () => number,
  validTargets?: Set<string>,
): Puzzle | null {
  const type: 'hidden_country' | 'missing_neighbor' =
    difficulty <= 2 ? 'hidden_country' : 'missing_neighbor';

  const regionSet = new Set(regionCountryCodes);
  const minNeighbors = type === 'hidden_country' ? 3 : 2;

  const eligible = regionCountryCodes.filter(
    code => inRegionNeighbors(code, adjacency, regionSet).length >= minNeighbors
  );

  if (eligible.length === 0) return null;

  const center = eligible[Math.floor(rng() * eligible.length)];
  const allNeighbors = inRegionNeighbors(center, adjacency, regionSet);
  const nonNeighbors = regionCountryCodes.filter(c => c !== center && !allNeighbors.includes(c));

  if (type === 'hidden_country') {
    if (nonNeighbors.length < 3) return null;
    const distractors = seededShuffle(nonNeighbors, rng).slice(0, 3);
    const puzzle: HiddenCountryPuzzle = {
      type: 'hidden_country',
      center,
      visibleNeighbors: allNeighbors,
      choices: seededShuffle([center, ...distractors], rng),
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

  const hidden = hiddenCandidates[Math.floor(rng() * hiddenCandidates.length)];
  const visible = allNeighbors.filter(n => n !== hidden);

  // L5: text input — no choices needed
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

  const density = LABEL_DENSITY_BY_DIFFICULTY[difficulty - 1];
  const DISTRACTORS_NEEDED = 3;
  const rawLabelCount = Math.round(visible.length * density);
  const maxLabelCount = Math.max(0, visible.length - DISTRACTORS_NEEDED);
  const labelCount = Math.min(rawLabelCount, maxLabelCount);

  const sortedVisible = [...visible].sort();
  const labeledNeighbors = sortedVisible.slice(0, labelCount);
  const labeledSet = new Set(labeledNeighbors);
  const unlabeledVisible = visible.filter(n => !labeledSet.has(n));

  let distractors: string[];
  let contextCountries: string[] = [];

  if (unlabeledVisible.length >= DISTRACTORS_NEEDED) {
    distractors = seededShuffle(unlabeledVisible, rng).slice(0, DISTRACTORS_NEEDED);
  } else {
    const shortfall = DISTRACTORS_NEEDED - unlabeledVisible.length;
    contextCountries = seededShuffle(nonNeighbors, rng).slice(0, shortfall);
    distractors = seededShuffle([...unlabeledVisible, ...contextCountries], rng);
  }

  const puzzle: MissingNeighborPuzzle = {
    type: 'missing_neighbor',
    center,
    visibleNeighbors: visible,
    labeledNeighbors,
    hiddenNeighbors: [hidden],
    contextCountries,
    choices: seededShuffle([hidden, ...distractors], rng),
    correctAnswer: hidden,
    svgMap,
    region,
  };
  return puzzle;
}

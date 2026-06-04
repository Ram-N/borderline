/**
 * Wraps generateFixedCenterPuzzle with metadata enrichment.
 * Produces CannedPuzzle objects ready for serialization.
 */

import { hashSeed, mulberry32 } from '../../src/utils/seededRandom';
import { generateFixedCenterPuzzle } from '../../src/utils/generateFixedCenterPuzzle';
import { LABEL_DENSITY_BY_DIFFICULTY, type AdjacencyData } from '../../src/utils/generatePuzzle';
import type { Puzzle } from '../../src/types/puzzle';
import type { CannedPuzzle, PuzzleMetadata } from '../../src/types/puzzleDb';
import { regionToContinent } from './regionMapper';

function inRegionNeighbors(code: string, adjacency: AdjacencyData, regionSet: Set<string>): string[] {
  return (adjacency[code]?.neighbors ?? []).filter(n => regionSet.has(n));
}

export type GenerateOptions = {
  countryCode: string;
  adjacency: AdjacencyData;
  regionCountryCodes: string[];
  svgMap: string;        // URL path like /images/maps/...
  region: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  variant: string;
  validTargets?: Set<string>;
};

export function generateCannedPuzzle(opts: GenerateOptions): CannedPuzzle | null {
  const { countryCode, adjacency, regionCountryCodes, svgMap, region, difficulty, variant, validTargets } = opts;

  const seedStr = `${countryCode}_${difficulty}_${variant}`;
  const rng = mulberry32(hashSeed(seedStr));

  const puzzle = generateFixedCenterPuzzle(
    countryCode,
    adjacency,
    regionCountryCodes,
    svgMap,
    region,
    difficulty,
    rng,
    validTargets,
  );

  if (!puzzle) return null;

  // Validate: correct answer must be in choices (for MC) or be the hidden neighbor
  if (puzzle.choices.length > 0 && !puzzle.choices.includes(puzzle.correctAnswer)) {
    return null;
  }

  // Check no duplicate choices
  if (puzzle.choices.length > 0 && new Set(puzzle.choices).size !== puzzle.choices.length) {
    return null;
  }

  const regionSet = new Set(regionCountryCodes);
  const neighborCount = inRegionNeighbors(countryCode, adjacency, regionSet).length;
  const countryName = adjacency[countryCode]?.name ?? countryCode;

  const answerMode: 'multiple_choice' | 'free_text' = difficulty === 5 ? 'free_text' : 'multiple_choice';
  const density = LABEL_DENSITY_BY_DIFFICULTY[difficulty - 1];

  const meta: PuzzleMetadata = {
    id: `${countryCode}_${difficulty}_${variant}`,
    countryCode,
    countryName,
    difficulty,
    variant,
    region,
    continent: regionToContinent(region),
    neighborCount,
    answerMode,
    neighborLabels: density,
    choiceCount: puzzle.choices.length,
    distractorStrategy: 'random',
    renderStatus: 'untested',
    approved: false,
    createdAt: new Date().toISOString(),
  };

  return { meta, puzzle };
}

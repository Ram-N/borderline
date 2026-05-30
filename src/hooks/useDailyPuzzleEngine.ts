import { useState } from 'react';
import { hashSeed, mulberry32 } from '../utils/seededRandom';
import { generateDailyPuzzle } from '../utils/generateDailyPuzzle';
import type { AdjacencyData } from '../utils/generatePuzzle';
import type { Puzzle } from '../types/puzzle';
import type { RegionSlot } from './usePuzzleEngine';

const DIFFICULTY_LABELS = ['Tourist', 'Traveler', 'Explorer', 'Cartographer', 'Diplomat'] as const;

type Config = {
  seed: string;
  regionPool: RegionSlot[];
  adjacency: AdjacencyData;
};

export { DIFFICULTY_LABELS };

export default function useDailyPuzzleEngine(config: Config) {
  const [puzzles] = useState<Puzzle[]>(() => {
    const rng = mulberry32(hashSeed(config.seed));
    const result: Puzzle[] = [];
    const poolSize = config.regionPool.length;

    for (let level = 1; level <= 5; level++) {
      const difficulty = level as 1 | 2 | 3 | 4 | 5;
      let puzzle: Puzzle | null = null;

      // Try every region in the pool before giving up
      const startIdx = Math.floor(rng() * poolSize);
      for (let attempt = 0; attempt < poolSize && !puzzle; attempt++) {
        const slot = config.regionPool[(startIdx + attempt) % poolSize];
        puzzle = generateDailyPuzzle(
          slot.adjacency,
          slot.regionCodes,
          slot.svgMap,
          slot.region,
          difficulty,
          rng,
          slot.validTargets,
        );
      }

      if (puzzle) result.push(puzzle);
    }

    return result;
  });

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'question' | 'reveal'>('question');
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);

  const done = index >= puzzles.length;
  const currentDifficulty = done ? 5 : (index + 1) as 1 | 2 | 3 | 4 | 5;

  function select(iso: string) {
    if (phase === 'reveal') return;
    const puzzle = puzzles[index];
    const correct = iso === puzzle.correctAnswer;
    setSelected(iso);
    setPhase('reveal');
    setIsCorrect(correct);
    setResults(r => [...r, correct]);
    if (correct) setScore(s => s + (index + 1)); // weighted: level N earns N points
  }

  function next() {
    setIndex(i => i + 1);
    setPhase('question');
    setSelected(null);
    setIsCorrect(null);
  }

  return {
    puzzles,
    index,
    total: puzzles.length,
    phase,
    selected,
    isCorrect,
    score,
    done,
    results,
    currentDifficulty,
    select,
    next,
  };
}

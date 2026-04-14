import { useState } from 'react';
import { generatePuzzle, type AdjacencyData } from '../utils/generatePuzzle';
import type { Puzzle } from '../types/puzzle';

type Config = {
  adjacency: AdjacencyData;
  regionCodes: string[];
  svgMap: string;
  region: string;
  n: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  validTargets?: Set<string>;
};

export default function usePuzzleEngine(config: Config) {
  const [puzzles] = useState<Puzzle[]>(() => {
    const type: 'hidden_country' | 'missing_neighbor' =
      config.difficulty <= 2 ? 'hidden_country' : 'missing_neighbor';
    const result: Puzzle[] = [];
    for (let i = 0; i < config.n; i++) {
      const puzzle = generatePuzzle(type, config.adjacency, config.regionCodes, config.svgMap, config.region, config.difficulty, config.validTargets);
      if (puzzle) result.push(puzzle);
    }
    return result;
  });

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'question' | 'reveal'>('question');
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);

  const done = index >= puzzles.length;

  function select(iso: string) {
    if (phase === 'reveal') return;
    const puzzle = puzzles[index];
    const correct = iso === puzzle.correctAnswer;
    setSelected(iso);
    setPhase('reveal');
    setIsCorrect(correct);
    if (correct) setScore(s => s + 1);
  }

  function next() {
    setIndex(i => i + 1);
    setPhase('question');
    setSelected(null);
    setIsCorrect(null);
  }

  return { puzzles, index, total: puzzles.length, phase, selected, isCorrect, score, done, select, next };
}

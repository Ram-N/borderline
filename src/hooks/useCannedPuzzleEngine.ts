import { useState, useEffect } from 'react';
import type { Puzzle } from '../types/puzzle';
import type { PuzzleIndex, CannedPuzzle } from '../types/puzzleDb';

type Config = {
  region: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  n: number;
};

type CannedPuzzleState = {
  puzzles: Puzzle[];
  loading: boolean;
  available: boolean;
};

export function useCannedPuzzles(config: Config): CannedPuzzleState {
  const [state, setState] = useState<CannedPuzzleState>({
    puzzles: [],
    loading: true,
    available: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/data/puzzles/index.json');
        if (!res.ok) throw new Error('no index');
        const index: PuzzleIndex = await res.json();

        // Filter by region (or any) + difficulty + approved
        let candidates = index.puzzles.filter(
          p => p.approved && p.difficulty === config.difficulty
        );
        if (config.region !== 'any') {
          candidates = candidates.filter(p => p.region === config.region);
        }

        if (candidates.length === 0) throw new Error('no candidates');

        // Shuffle and pick n
        const shuffled = [...candidates].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, config.n);

        // Fetch each puzzle
        const puzzles: Puzzle[] = [];
        for (const entry of selected) {
          const puzzleRes = await fetch(`/data/puzzles/${entry.region}/${entry.id}.json`);
          if (!puzzleRes.ok) continue;
          const data: CannedPuzzle = await puzzleRes.json();
          puzzles.push(data.puzzle);
        }

        if (cancelled) return;
        setState({
          puzzles,
          loading: false,
          available: puzzles.length > 0,
        });
      } catch {
        if (cancelled) return;
        setState({ puzzles: [], loading: false, available: false });
      }
    }

    load();
    return () => { cancelled = true; };
  }, [config.region, config.difficulty, config.n]);

  return state;
}

import { useState, useCallback } from 'react';
import type { LandmarkDataset, Landmark } from '../../types/landmark/landmark';
import type { Difficulty } from '../../types/landmark/game';

const N_FOR_DIFFICULTY: Record<number, number> = { 1: 3, 2: 4, 3: 5, 4: 6, 5: 7 };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type State = {
  pins: Landmark[];                    // landmarks shown on map, in stable display order
  chips: Landmark[];                   // same landmarks, shuffled for the chip row
  assignments: Record<string, string>; // pinId → chipId
  selectedPin: string | null;
  selectedChip: string | null;
  phase: 'matching' | 'reveal';
  pointsPerMatch: number;              // = round(100 / N) so total always ≈ 100
};

export type MatchTheMapEngine = {
  pins: Landmark[];
  chips: Landmark[];
  assignments: Record<string, string>;
  selectedPin: string | null;
  selectedChip: string | null;
  phase: 'matching' | 'reveal';
  allAssigned: boolean;
  totalScore: number;
  pointsPerMatch: number;
  clickPin: (id: string) => void;
  clickChip: (id: string) => void;
  deselect: () => void;
  confirm: () => void;
};

export default function useMatchTheMapEngine(
  dataset: LandmarkDataset,
  difficulty: Difficulty,
): MatchTheMapEngine {
  const [state, setState] = useState<State>(() => {
    const n = N_FOR_DIFFICULTY[difficulty] ?? 5;
    const pool = shuffle([...dataset.landmarks]).slice(0, Math.min(n, dataset.landmarks.length));
    // Shuffle again independently so chip order differs from pin display order
    const chips = shuffle([...pool]);
    return {
      pins: pool,
      chips,
      assignments: {},
      selectedPin: null,
      selectedChip: null,
      phase: 'matching',
      pointsPerMatch: Math.round(100 / pool.length),
    };
  });

  const clickPin = useCallback((pinId: string) => {
    setState((prev) => {
      if (prev.phase !== 'matching') return prev;

      if (prev.selectedChip !== null) {
        // Assign this pin ← currently selected chip
        const chipId = prev.selectedChip;
        const next: Record<string, string> = { ...prev.assignments };
        // Remove the chip from any other pin it was assigned to
        for (const pid of Object.keys(next)) {
          if (next[pid] === chipId) delete next[pid];
        }
        next[pinId] = chipId;
        return { ...prev, assignments: next, selectedPin: null, selectedChip: null };
      }

      // Toggle pin selection
      const newSelected = prev.selectedPin === pinId ? null : pinId;
      return { ...prev, selectedPin: newSelected, selectedChip: null };
    });
  }, []);

  const clickChip = useCallback((chipId: string) => {
    setState((prev) => {
      if (prev.phase !== 'matching') return prev;

      if (prev.selectedPin !== null) {
        // Assign selected pin ← this chip
        const pinId = prev.selectedPin;
        const next: Record<string, string> = { ...prev.assignments };
        // Remove the chip from any other pin it was assigned to
        for (const pid of Object.keys(next)) {
          if (next[pid] === chipId) delete next[pid];
        }
        next[pinId] = chipId;
        return { ...prev, assignments: next, selectedPin: null, selectedChip: null };
      }

      // Toggle chip selection
      const newSelected = prev.selectedChip === chipId ? null : chipId;
      return { ...prev, selectedChip: newSelected, selectedPin: null };
    });
  }, []);

  const deselect = useCallback(() => {
    setState((prev) => ({ ...prev, selectedPin: null, selectedChip: null }));
  }, []);

  const confirm = useCallback(() => {
    setState((prev) => ({ ...prev, phase: 'reveal' }));
  }, []);

  const allAssigned = Object.keys(state.assignments).length === state.pins.length;

  const totalScore =
    state.phase === 'reveal'
      ? state.pins.reduce((sum, pin) => {
          return sum + (state.assignments[pin.id] === pin.id ? state.pointsPerMatch : 0);
        }, 0)
      : 0;

  return {
    ...state,
    allAssigned,
    totalScore,
    clickPin,
    clickChip,
    deselect,
    confirm,
  };
}

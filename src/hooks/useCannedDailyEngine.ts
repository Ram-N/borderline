import { useState, useEffect } from 'react';
import type { Puzzle } from '../types/puzzle';
import type { DailyCalendar, CannedPuzzle } from '../types/puzzleDb';

type CannedDailyState = {
  puzzles: Puzzle[];
  loading: boolean;
  available: boolean;
};

export function useCannedDailyPuzzles(date: string): CannedDailyState {
  const [state, setState] = useState<CannedDailyState>({
    puzzles: [],
    loading: true,
    available: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const year = date.slice(0, 4);
        const res = await fetch(`/data/puzzles/calendar/${year}.json`);
        if (!res.ok) throw new Error('no calendar');
        const calendar: DailyCalendar = await res.json();

        const entry = calendar.entries.find(e => e.date === date);
        if (!entry) throw new Error('no entry for date');

        // Fetch each puzzle by ID
        // IDs contain the region info (need index to get region)
        const indexRes = await fetch('/data/puzzles/index.json');
        if (!indexRes.ok) throw new Error('no index');
        const index = await indexRes.json();
        const idToRegion = new Map<string, string>();
        for (const p of index.puzzles) {
          idToRegion.set(p.id, p.region);
        }

        const puzzles: Puzzle[] = [];
        for (const puzzleId of entry.puzzleIds) {
          if (!puzzleId) continue;
          const region = idToRegion.get(puzzleId);
          if (!region) continue;
          const puzzleRes = await fetch(`/data/puzzles/${region}/${puzzleId}.json`);
          if (!puzzleRes.ok) continue;
          const data: CannedPuzzle = await puzzleRes.json();
          puzzles.push(data.puzzle);
        }

        if (cancelled) return;
        setState({
          puzzles,
          loading: false,
          available: puzzles.length === 5,
        });
      } catch {
        if (cancelled) return;
        setState({ puzzles: [], loading: false, available: false });
      }
    }

    load();
    return () => { cancelled = true; };
  }, [date]);

  return state;
}

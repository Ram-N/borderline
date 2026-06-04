/**
 * Builds a balanced yearly DailyCalendar from the puzzle index.
 * Each day gets 5 puzzle IDs (one per difficulty level).
 * Distributes countries and continents as evenly as possible.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { hashSeed, mulberry32, seededShuffle } from '../../src/utils/seededRandom';
import type { PuzzleIndex, DailyCalendar, DailyCalendarEntry } from '../../src/types/puzzleDb';

function daysInYear(year: number): number {
  return ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365;
}

function dateString(year: number, dayOfYear: number): string {
  const d = new Date(year, 0, dayOfYear + 1);
  return d.toISOString().split('T')[0];
}

export function buildCalendar(puzzlesDir: string, year: number): DailyCalendar {
  const indexPath = join(puzzlesDir, 'index.json');
  const index: PuzzleIndex = JSON.parse(readFileSync(indexPath, 'utf-8'));

  // Group approved puzzles by difficulty
  const byDifficulty: Record<number, string[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  for (const p of index.puzzles) {
    if (p.approved) {
      byDifficulty[p.difficulty].push(p.id);
    }
  }

  const totalDays = daysInYear(year);
  const rng = mulberry32(hashSeed(`calendar_${year}`));
  const entries: DailyCalendarEntry[] = [];

  // Shuffle each difficulty pool, then cycle through
  const shuffled: Record<number, string[]> = {};
  const cursors: Record<number, number> = {};
  for (let d = 1; d <= 5; d++) {
    shuffled[d] = seededShuffle(byDifficulty[d], rng);
    cursors[d] = 0;
  }

  for (let day = 0; day < totalDays; day++) {
    const date = dateString(year, day);
    const puzzleIds: string[] = [];

    for (let d = 1; d <= 5; d++) {
      const pool = shuffled[d];
      if (pool.length === 0) {
        puzzleIds.push('');
        continue;
      }
      // Wrap around when we've used all puzzles
      if (cursors[d] >= pool.length) {
        shuffled[d] = seededShuffle(pool, rng);
        cursors[d] = 0;
      }
      puzzleIds.push(shuffled[d][cursors[d]]);
      cursors[d]++;
    }

    entries.push({
      date,
      puzzleIds: puzzleIds as [string, string, string, string, string],
    });
  }

  return { year, entries };
}

export function writeCalendar(puzzlesDir: string, year: number): DailyCalendar {
  const calendar = buildCalendar(puzzlesDir, year);
  const calendarDir = join(puzzlesDir, 'calendar');
  writeFileSync(join(calendarDir, `${year}.json`), JSON.stringify(calendar, null, 2));
  return calendar;
}

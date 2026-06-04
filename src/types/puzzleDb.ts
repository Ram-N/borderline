import type { Puzzle } from './puzzle';

export type PuzzleId = string; // e.g. "PT_3_A"

export type PuzzleMetadata = {
  id: PuzzleId;
  countryCode: string;           // ISO alpha-2
  countryName: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  variant: string;               // "A", "B", etc.
  region: string;                 // key from REGION_CONFIG
  continent: string;              // normalized label for distribution
  neighborCount: number;
  answerMode: 'multiple_choice' | 'free_text';
  neighborLabels: number;         // fraction 0-1
  choiceCount: number;            // 0 for free_text, 4 for MC
  distractorStrategy: 'random' | 'geographic_proximity' | 'same_region';
  renderStatus: 'untested' | 'pass' | 'fail';
  approved: boolean;
  createdAt: string;
};

export type CannedPuzzle = {
  meta: PuzzleMetadata;
  puzzle: Puzzle;
};

export type PuzzleIndexEntry = {
  id: PuzzleId;
  countryCode: string;
  countryName: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  region: string;
  continent: string;
  approved: boolean;
  renderStatus: 'untested' | 'pass' | 'fail';
};

export type PuzzleIndex = {
  generatedAt: string;
  totalCount: number;
  puzzles: PuzzleIndexEntry[];
};

export type DailyCalendarEntry = {
  date: string;
  puzzleIds: [string, string, string, string, string];
};

export type DailyCalendar = {
  year: number;
  entries: DailyCalendarEntry[];
};

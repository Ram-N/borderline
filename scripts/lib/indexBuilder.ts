/**
 * Builds a PuzzleIndex from all generated CannedPuzzle files on disk.
 */

import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { PuzzleIndex, PuzzleIndexEntry, CannedPuzzle } from '../../src/types/puzzleDb';

export function buildIndex(puzzlesDir: string): PuzzleIndex {
  const entries: PuzzleIndexEntry[] = [];

  const regionDirs = readdirSync(puzzlesDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'calendar' && d.name !== 'audit');

  for (const dir of regionDirs) {
    const regionPath = join(puzzlesDir, dir.name);
    const files = readdirSync(regionPath).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const filePath = join(regionPath, file);
      const data: CannedPuzzle = JSON.parse(readFileSync(filePath, 'utf-8'));
      entries.push({
        id: data.meta.id,
        countryCode: data.meta.countryCode,
        countryName: data.meta.countryName,
        difficulty: data.meta.difficulty,
        region: data.meta.region,
        continent: data.meta.continent,
        approved: data.meta.approved,
        renderStatus: data.meta.renderStatus,
      });
    }
  }

  entries.sort((a, b) => a.id.localeCompare(b.id));

  const index: PuzzleIndex = {
    generatedAt: new Date().toISOString(),
    totalCount: entries.length,
    puzzles: entries,
  };

  return index;
}

export function writeIndex(puzzlesDir: string): PuzzleIndex {
  const index = buildIndex(puzzlesDir);
  writeFileSync(join(puzzlesDir, 'index.json'), JSON.stringify(index, null, 2));
  return index;
}

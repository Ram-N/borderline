#!/usr/bin/env tsx
/**
 * CLI for generating, auditing, and managing the canned puzzle database.
 *
 * Usage:
 *   npx tsx scripts/generatePuzzles.ts generate [--region europe]
 *   npx tsx scripts/generatePuzzles.ts audit
 *   npx tsx scripts/generatePuzzles.ts calendar --year 2026
 *   npx tsx scripts/generatePuzzles.ts stats
 *   npx tsx scripts/generatePuzzles.ts approve --all
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { parseSvgFile } from './lib/nodeSvgParser';
import { generateCannedPuzzle } from './lib/puzzleGenerator';
import { writeIndex } from './lib/indexBuilder';
import { writeNeighborAudit } from './lib/auditTools';
import { writeCalendar } from './lib/calendarBuilder';
import { computeCentroid } from '../src/utils/computeCentroid';
import { REGION_CONFIG } from '../src/data/regionConfig';
import type { AdjacencyData } from '../src/utils/generatePuzzle';
import type { CannedPuzzle, PuzzleIndex } from '../src/types/puzzleDb';

const ROOT = resolve(import.meta.dirname, '..');
const PUBLIC = join(ROOT, 'public');
const PUZZLES_DIR = join(PUBLIC, 'data', 'puzzles');

function ensureDirs() {
  const dirs = [
    PUZZLES_DIR,
    join(PUZZLES_DIR, 'calendar'),
    join(PUZZLES_DIR, 'audit'),
  ];
  // Create region folders
  for (const key of Object.keys(REGION_CONFIG)) {
    dirs.push(join(PUZZLES_DIR, key));
  }
  for (const d of dirs) {
    mkdirSync(d, { recursive: true });
  }
}

function loadAdjacency(adjUrl: string): AdjacencyData {
  const filePath = join(PUBLIC, adjUrl);
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

// ---- GENERATE ----

function generate(regionFilter?: string) {
  ensureDirs();

  const regions = regionFilter
    ? { [regionFilter]: REGION_CONFIG[regionFilter] }
    : REGION_CONFIG;

  if (regionFilter && !REGION_CONFIG[regionFilter]) {
    console.error(`Unknown region: ${regionFilter}`);
    console.error(`Valid regions: ${Object.keys(REGION_CONFIG).join(', ')}`);
    process.exit(1);
  }

  let totalGenerated = 0;
  let totalSkipped = 0;

  for (const [regionKey, config] of Object.entries(regions)) {
    const svgPath = join(PUBLIC, config.svgMap);
    if (!existsSync(svgPath)) {
      console.warn(`  SKIP ${regionKey}: SVG not found at ${svgPath}`);
      continue;
    }

    const svgData = parseSvgFile(svgPath);
    const adjacency = loadAdjacency(config.adjacencyUrl);
    const regionCodes = svgData.paths.map(p => p.id);

    // Compute valid targets (large enough paths)
    const validTargets = new Set(
      svgData.paths
        .filter(p => {
          const c = computeCentroid(p.d);
          return c.w * c.h >= 100;
        })
        .map(p => p.id)
    );

    const regionDir = join(PUZZLES_DIR, regionKey);

    console.log(`\n[${regionKey}] ${regionCodes.length} countries`);

    for (const code of regionCodes) {
      for (const difficulty of [1, 2, 3, 4, 5] as const) {
        // Always generate variant A
        const variants = ['A'];

        // Generate variant B for countries with 4+ neighbors at difficulty 3+
        const regionSet = new Set(regionCodes);
        const neighborCount = (adjacency[code]?.neighbors ?? []).filter(n => regionSet.has(n)).length;
        if (neighborCount >= 4 && difficulty >= 3) {
          variants.push('B');
        }

        for (const variant of variants) {
          const puzzleId = `${regionKey}_${code}_${difficulty}_${variant}`;
          const outPath = join(regionDir, `${puzzleId}.json`);

          // Skip if already exists
          if (existsSync(outPath)) {
            totalSkipped++;
            continue;
          }

          const result = generateCannedPuzzle({
            countryCode: code,
            adjacency,
            regionCountryCodes: regionCodes,
            svgMap: config.svgMap,
            region: regionKey,
            difficulty,
            variant,
            validTargets,
          });

          if (result) {
            writeFileSync(outPath, JSON.stringify(result, null, 2));
            totalGenerated++;
          }
        }
      }
    }
  }

  console.log(`\nGenerated: ${totalGenerated} puzzles`);
  console.log(`Skipped (already exist): ${totalSkipped}`);

  // Rebuild index
  const index = writeIndex(PUZZLES_DIR);
  console.log(`Index updated: ${index.totalCount} total puzzles`);
}

// ---- AUDIT ----

function audit() {
  ensureDirs();
  const result = writeNeighborAudit(PUBLIC, PUZZLES_DIR);
  console.log(`Neighbor audit complete: ${result.issues.length} issues found`);
  if (result.issues.length > 0) {
    for (const issue of result.issues.slice(0, 20)) {
      console.log(`  [${issue.region}] ${issue.countryCode}: ${issue.issue}`);
    }
    if (result.issues.length > 20) {
      console.log(`  ... and ${result.issues.length - 20} more`);
    }
  }
}

// ---- CALENDAR ----

function calendar(year: number) {
  ensureDirs();
  const cal = writeCalendar(PUZZLES_DIR, year);
  console.log(`Calendar generated for ${year}: ${cal.entries.length} days`);

  // Count how many days have all 5 puzzles filled
  const complete = cal.entries.filter(e => e.puzzleIds.every(id => id !== '')).length;
  console.log(`Complete days (5/5 puzzles): ${complete}/${cal.entries.length}`);
}

// ---- STATS ----

function stats() {
  const indexPath = join(PUZZLES_DIR, 'index.json');
  if (!existsSync(indexPath)) {
    console.error('No index.json found. Run generate first.');
    process.exit(1);
  }

  const index: PuzzleIndex = JSON.parse(readFileSync(indexPath, 'utf-8'));
  console.log(`Total puzzles: ${index.totalCount}`);
  console.log(`Generated at: ${index.generatedAt}`);

  // By difficulty
  const byDiff: Record<number, number> = {};
  const byRegion: Record<string, number> = {};
  const byContinent: Record<string, number> = {};
  let approved = 0;

  for (const p of index.puzzles) {
    byDiff[p.difficulty] = (byDiff[p.difficulty] ?? 0) + 1;
    byRegion[p.region] = (byRegion[p.region] ?? 0) + 1;
    byContinent[p.continent] = (byContinent[p.continent] ?? 0) + 1;
    if (p.approved) approved++;
  }

  console.log(`\nBy difficulty:`);
  for (const d of [1, 2, 3, 4, 5]) {
    console.log(`  L${d}: ${byDiff[d] ?? 0}`);
  }

  console.log(`\nBy region:`);
  for (const [r, n] of Object.entries(byRegion).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${r}: ${n}`);
  }

  console.log(`\nBy continent:`);
  for (const [c, n] of Object.entries(byContinent).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${c}: ${n}`);
  }

  console.log(`\nApproved: ${approved}/${index.totalCount}`);
}

// ---- APPROVE ----

function approve(all: boolean) {
  if (!all) {
    console.error('Usage: approve --all');
    process.exit(1);
  }

  const regionDirs = readdirSync(PUZZLES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'calendar' && d.name !== 'audit');

  let count = 0;
  for (const dir of regionDirs) {
    const regionPath = join(PUZZLES_DIR, dir.name);
    const files = readdirSync(regionPath).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const filePath = join(regionPath, file);
      const data: CannedPuzzle = JSON.parse(readFileSync(filePath, 'utf-8'));
      if (!data.meta.approved) {
        data.meta.approved = true;
        writeFileSync(filePath, JSON.stringify(data, null, 2));
        count++;
      }
    }
  }

  console.log(`Approved ${count} puzzles`);

  // Rebuild index
  const index = writeIndex(PUZZLES_DIR);
  console.log(`Index updated: ${index.totalCount} total (${index.puzzles.filter(p => p.approved).length} approved)`);
}

// ---- CLI DISPATCH ----

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'generate': {
    const regionIdx = args.indexOf('--region');
    const regionFilter = regionIdx >= 0 ? args[regionIdx + 1] : undefined;
    generate(regionFilter);
    break;
  }
  case 'audit':
    audit();
    break;
  case 'calendar': {
    const yearIdx = args.indexOf('--year');
    const year = yearIdx >= 0 ? parseInt(args[yearIdx + 1], 10) : new Date().getFullYear();
    calendar(year);
    break;
  }
  case 'stats':
    stats();
    break;
  case 'approve': {
    const allFlag = args.includes('--all');
    approve(allFlag);
    break;
  }
  default:
    console.log(`Usage: generatePuzzles.ts <command> [options]

Commands:
  generate [--region <key>]   Generate puzzles (all regions or specific)
  audit                       Run neighbor/SVG cross-validation
  calendar --year <YYYY>      Build daily calendar for a year
  stats                       Show puzzle database statistics
  approve --all               Approve all puzzles
`);
    process.exit(1);
}

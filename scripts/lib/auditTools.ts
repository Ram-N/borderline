/**
 * Neighbor validation and audit logic.
 * Cross-references adjacency data against SVG path presence.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { parseSvgFile } from './nodeSvgParser';
import type { AdjacencyData } from '../../src/utils/generatePuzzle';
import { REGION_CONFIG } from '../../src/data/regionConfig';

export type NeighborAuditEntry = {
  region: string;
  countryCode: string;
  countryName: string;
  issue: string;
};

export type NeighborAudit = {
  generatedAt: string;
  issues: NeighborAuditEntry[];
};

export function runNeighborAudit(publicDir: string): NeighborAudit {
  const issues: NeighborAuditEntry[] = [];

  for (const [regionKey, config] of Object.entries(REGION_CONFIG)) {
    const svgPath = join(publicDir, config.svgMap);
    const adjPath = join(publicDir, config.adjacencyUrl);

    let svgData;
    try {
      svgData = parseSvgFile(svgPath);
    } catch {
      issues.push({
        region: regionKey,
        countryCode: '',
        countryName: '',
        issue: `SVG file not found: ${svgPath}`,
      });
      continue;
    }

    let adjacency: AdjacencyData;
    try {
      adjacency = JSON.parse(readFileSync(adjPath, 'utf-8'));
    } catch {
      issues.push({
        region: regionKey,
        countryCode: '',
        countryName: '',
        issue: `Adjacency file not found: ${adjPath}`,
      });
      continue;
    }

    const svgCodes = new Set(svgData.paths.map(p => p.id));

    // Check each country in SVG has adjacency data
    for (const code of svgCodes) {
      if (!adjacency[code]) {
        issues.push({
          region: regionKey,
          countryCode: code,
          countryName: code,
          issue: `In SVG but missing from adjacency data`,
        });
        continue;
      }

      // Check neighbors are also in SVG (within region)
      const neighbors = adjacency[code].neighbors;
      const inRegionNeighbors = neighbors.filter(n => svgCodes.has(n));
      if (inRegionNeighbors.length === 0) {
        issues.push({
          region: regionKey,
          countryCode: code,
          countryName: adjacency[code]?.name ?? code,
          issue: `No in-region neighbors found (${neighbors.length} total neighbors, none in SVG)`,
        });
      }
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    issues,
  };
}

export function writeNeighborAudit(publicDir: string, puzzlesDir: string): NeighborAudit {
  const audit = runNeighborAudit(publicDir);
  const auditDir = join(puzzlesDir, 'audit');
  writeFileSync(join(auditDir, 'neighbor-audit.json'), JSON.stringify(audit, null, 2));
  return audit;
}

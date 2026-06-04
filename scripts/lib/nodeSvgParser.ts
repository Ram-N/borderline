/**
 * Node-compatible SVG path extraction using fast-xml-parser.
 * Replaces browser DOMParser used in src/utils/parseSvg.ts.
 */

import { readFileSync } from 'fs';
import { XMLParser } from 'fast-xml-parser';

export type PathData = {
  id: string;
  title: string;
  d: string;
};

export type ParsedSvg = {
  paths: PathData[];
  viewBox: string;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => name === 'path',
});

export function parseSvgFile(filePath: string): ParsedSvg {
  const xml = readFileSync(filePath, 'utf-8');
  const doc = parser.parse(xml);

  const svg = doc.svg;
  const viewBox = svg?.['@_viewBox'] ?? '0 0 800 600';

  // Paths live under svg > g > path (the <g id="polygons"> wrapper)
  const g = svg?.g;
  const rawPaths: any[] = g?.path ?? [];

  const paths: PathData[] = rawPaths
    .filter((p: any) => p['@_id'])
    .map((p: any) => ({
      id: p['@_id'] as string,
      title: (p['@_title'] ?? '') as string,
      d: (p['@_d'] ?? '') as string,
    }));

  return { paths, viewBox };
}

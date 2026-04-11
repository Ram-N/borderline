export type PathData = {
  id: string;
  title: string;
  d: string;
};

export type ParsedSvg = {
  paths: PathData[];
  viewBox: string;
};

export async function parseSvg(url: string): Promise<ParsedSvg> {
  const response = await fetch(url);
  const text = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'image/svg+xml');
  const svgEl = doc.querySelector('svg');
  const viewBox = svgEl?.getAttribute('viewBox') ?? '0 0 800 600';
  const pathEls = doc.querySelectorAll('path[id]');
  const paths: PathData[] = Array.from(pathEls).map(el => ({
    id: el.getAttribute('id') ?? '',
    title: el.getAttribute('title') ?? '',
    d: el.getAttribute('d') ?? '',
  }));
  return { paths, viewBox };
}

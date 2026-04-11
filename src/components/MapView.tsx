import { useEffect, useState } from 'react';
import { parseSvg, type PathData } from '../utils/parseSvg';
import MapNode from './MapNode';

type MapStatus = 'hidden' | 'correct' | 'wrong';

export default function MapView({
  svgMap,
  targetId,
  status,
}: {
  svgMap: string;
  targetId: string;
  status: MapStatus;
}) {
  const [paths, setPaths] = useState<PathData[]>([]);
  const [viewBox, setViewBox] = useState('0 0 800 600');

  useEffect(() => {
    parseSvg(svgMap).then(({ paths, viewBox }) => {
      setPaths(paths);
      setViewBox(viewBox);
    });
  }, [svgMap]);

  return (
    <svg
      viewBox={viewBox}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {paths.map(path => (
        <MapNode
          key={path.id}
          id={path.id}
          d={path.d}
          status={path.id === targetId ? status : 'default'}
        />
      ))}
    </svg>
  );
}

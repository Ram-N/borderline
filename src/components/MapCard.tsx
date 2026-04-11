import MapView from './MapView';

type MapStatus = 'hidden' | 'correct' | 'wrong';

export default function MapCard({
  svgMap,
  targetId,
  status,
  labelStyle,
  country,
}: {
  svgMap: string;
  targetId: string;
  status: MapStatus;
  labelStyle: 'numbers' | 'letters';
  country: string;
}) {
  return (
    <div className='map-card'>
      <div className='map-head'>
        <h3>{country}</h3>
        <span className='label-style'>Labels: {labelStyle === 'numbers' ? '1–n' : 'A–D'}</span>
      </div>
      <MapView svgMap={svgMap} targetId={targetId} status={status} />
    </div>
  );
}

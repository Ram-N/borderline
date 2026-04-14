import { REGION_CONFIG } from '../data/regionConfig';

interface Props {
  value: string;
  onChange: (key: string) => void;
}

export default function RegionGrid({ value, onChange }: Props) {
  const worldRegions = Object.entries(REGION_CONFIG).filter(([, c]) => c.group === 'world');
  const stateRegions = Object.entries(REGION_CONFIG).filter(([, c]) => c.group === 'states');

  return (
    <div>
      <div className='region-section-label'>World Regions</div>
      <div className='region-grid'>
        <button
          className={`region-tile${value === 'any' ? ' active' : ''}`}
          onClick={() => onChange('any')}
        >
          Any
        </button>
        {worldRegions.map(([key, c]) => (
          <button
            key={key}
            className={`region-tile${value === key ? ' active' : ''}`}
            onClick={() => onChange(key)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className='region-section-label'>States / Provinces</div>
      <div className='region-grid'>
        {stateRegions.map(([key, c]) => (
          <button
            key={key}
            className={`region-tile${value === key ? ' active' : ''}`}
            onClick={() => onChange(key)}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

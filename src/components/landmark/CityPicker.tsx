import { LANDMARK_MAP_CONFIG } from '../../data/landmarkMapConfig';
import { CITY_GROUPS } from '../../generated/geoRegistry';

interface Props {
  value: string;
  onChange: (key: string) => void;
}

export default function CityPicker({ value, onChange }: Props) {
  return (
    <div className="lm-city-picker">
      {CITY_GROUPS.map((group) => (
        <div key={group.label}>
          <div className="lm-section-label">{group.label}</div>
          <div className="lm-city-grid">
            {group.keys.map((key) => (
              <button
                key={key}
                className={`lm-city-tile${value === key ? ' active' : ''}`}
                onClick={() => onChange(key)}
              >
                {LANDMARK_MAP_CONFIG[key].label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

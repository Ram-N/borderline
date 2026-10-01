import { LANDMARK_MAP_CONFIG } from '../../data/landmarkMapConfig';

const CITY_GROUPS: { label: string; keys: string[] }[] = [
  {
    label: 'World Cities',
    keys: ['nyc', 'london', 'paris', 'rome', 'berlin'],
  },
  {
    label: 'Indian Cities',
    keys: ['bangalore', 'chennai', 'delhi', 'mumbai', 'kolkata'],
  },
];

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

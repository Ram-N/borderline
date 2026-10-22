import type { ConfidenceLevel } from '../../types/landmark/game';
import { CONFIDENCE_TIERS } from '../../utils/landmark/distanceScore';

type Props = {
  value: ConfidenceLevel | null;
  onChange: (level: ConfidenceLevel) => void;
  disabled?: boolean;
};

const OPTIONS: { level: ConfidenceLevel; note: string }[] = [
  { level: 'low',    note: 'Big circle — up to 25 pts if the answer is inside it' },
  { level: 'medium', note: 'Medium circle — up to 60 pts if the answer is inside it' },
  { level: 'high',   note: 'Small circle — up to 100 pts, but 0 if you miss it' },
];

export default function ConfidencePicker({ value, onChange, disabled }: Props) {
  return (
    <div className="confidence-picker">
      <p className="confidence-label">How confident are you?</p>
      <div className="confidence-buttons">
        {OPTIONS.map(({ level, note }) => (
          <button
            key={level}
            className={`confidence-btn confidence-${level}${value === level ? ' selected' : ''}`}
            onClick={() => onChange(level)}
            disabled={disabled}
            title={note}
          >
            <span className="confidence-btn-label">{CONFIDENCE_TIERS[level].label}</span>
            <span className="confidence-btn-mult">up to {CONFIDENCE_TIERS[level].maxPoints}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

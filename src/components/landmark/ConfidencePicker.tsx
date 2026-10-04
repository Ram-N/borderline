import type { ConfidenceLevel } from '../../types/landmark/game';

type Props = {
  value: ConfidenceLevel | null;
  onChange: (level: ConfidenceLevel) => void;
  disabled?: boolean;
};

const OPTIONS: { level: ConfidenceLevel; label: string; multiplier: string; note: string }[] = [
  { level: 'low',    label: 'Low',    multiplier: '≥15',  note: '0.5× score, but guaranteed 15 pts minimum' },
  { level: 'medium', label: 'Medium', multiplier: '1.0×', note: 'standard — no risk, no bonus' },
  { level: 'high',   label: 'High',   multiplier: '1.4×', note: '0 pts if score < 25 (overconfidence penalty)' },
];

export default function ConfidencePicker({ value, onChange, disabled }: Props) {
  return (
    <div className="confidence-picker">
      <p className="confidence-label">How confident are you?</p>
      <div className="confidence-buttons">
        {OPTIONS.map(({ level, label, multiplier, note }) => (
          <button
            key={level}
            className={`confidence-btn confidence-${level}${value === level ? ' selected' : ''}`}
            onClick={() => onChange(level)}
            disabled={disabled}
            title={note}
          >
            <span className="confidence-btn-label">{label}</span>
            <span className="confidence-btn-mult">{multiplier}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

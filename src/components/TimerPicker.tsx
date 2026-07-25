const OPTIONS = [
  { value: 'blitz', label: 'Blitz', description: '10 seconds' },
  { value: 'regular', label: 'Regular', description: '20 seconds' },
  { value: 'untimed', label: 'Untimed', description: 'No timer' },
];

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function TimerPicker({ value, onChange }: Props) {
  return (
    <div className='timer-picker'>
      <label>Timer:</label>
      <div className='timer-buttons'>
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            className={`timer-btn${value === opt.value ? ' active' : ''}`}
            onClick={() => onChange(opt.value)}
            title={opt.description}
          >
            <span className='timer-btn-label'>{opt.label}</span>
            <span className='timer-btn-desc'>{opt.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

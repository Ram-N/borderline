const LEVELS = [
  { value: 1, name: 'Tourist', description: 'Very Easy — all labels visible' },
  { value: 2, name: 'Traveler', description: 'Easy — some labels hidden' },
  { value: 3, name: 'Explorer', description: 'Medium — half labels, zoomed in' },
  { value: 4, name: 'Cartographer', description: 'Hard — no labels, tight zoom' },
  { value: 5, name: 'Diplomat', description: 'Expert — no labels, type your answer' },
];

type Props = {
  value: number;
  onChange: (v: number) => void;
};

export default function DifficultyPicker({ value, onChange }: Props) {
  return (
    <div className='difficulty-picker'>
      <label>Difficulty:</label>
      <div className='difficulty-buttons'>
        {LEVELS.map(level => (
          <button
            key={level.value}
            className={`difficulty-btn${value === level.value ? ' active' : ''}`}
            onClick={() => onChange(level.value)}
            title={level.description}
          >
            <span className='level-num'>{level.value}</span>
            <span className='level-name'>{level.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

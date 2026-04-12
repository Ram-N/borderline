import { useState } from 'react';

const PRESETS = [3, 5, 8, 10];

interface Props {
  value: number;
  onChange: (n: number) => void;
}

export default function CountPicker({ value, onChange }: Props) {
  const [custom, setCustom] = useState('');
  const isPreset = PRESETS.includes(value) && custom === '';

  function selectPreset(n: number) {
    setCustom('');
    onChange(n);
  }

  function handleCustomChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setCustom(raw);
    const n = parseInt(raw, 10);
    if (!isNaN(n) && n >= 1) onChange(n);
  }

  return (
    <div className='count-picker'>
      <label>Number of puzzles</label>
      <div className='count-buttons'>
        {PRESETS.map(n => (
          <button
            key={n}
            className={`count-btn${isPreset && value === n ? ' active' : ''}`}
            onClick={() => selectPreset(n)}
          >
            {n}
          </button>
        ))}
        <input
          type='number'
          className={`count-custom${!isPreset ? ' active' : ''}`}
          value={custom}
          min={1}
          placeholder='…'
          onChange={handleCustomChange}
        />
      </div>
    </div>
  );
}

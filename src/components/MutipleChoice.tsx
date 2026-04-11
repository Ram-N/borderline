
type NeighborMC = { label: string; prompt: string; options: string[]; answer: string };

export default function MultipleChoice({ neighbors, selections, onSelect, disabled }: {
  neighbors: NeighborMC[];
  selections: Record<string, string>;
  onSelect: (label: string, option: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className='mc-wrap'>
      {neighbors.map(nb => (
        <fieldset key={nb.label} className='mc-item' disabled={disabled}>
          <legend>{nb.label}. {nb.prompt}</legend>
          {nb.options.map(opt => (
            <label key={opt} className='mc-option'>
              <input
                type='radio'
                name={`nb-${nb.label}`}
                value={opt}
                checked={selections[nb.label] === opt}
                onChange={() => onSelect(nb.label, opt)}
              />
              <span>{opt}</span>
            </label>
          ))}
        </fieldset>
      ))}
    </div>
  );
}

type Props = {
  choices: string[];
  countryNames: Record<string, string>;
  selected: string | null;
  correct: string;
  phase: 'question' | 'reveal';
  onSelect: (iso: string) => void;
};

export default function PuzzleChoices({ choices, countryNames, selected, correct, phase, onSelect }: Props) {
  return (
    <div className='puzzle-choices'>
      {choices.map(iso => {
        let className = 'puzzle-choice';
        if (phase === 'reveal') {
          if (iso === correct) className += ' correct';
          else if (iso === selected) className += ' wrong';
        } else if (iso === selected) {
          className += ' selected';
        }
        return (
          <button
            key={iso}
            className={className}
            onClick={() => onSelect(iso)}
            disabled={phase === 'reveal'}
          >
            {countryNames[iso] ?? iso}
          </button>
        );
      })}
    </div>
  );
}

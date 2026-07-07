import { useState } from 'react';
import Fuse from 'fuse.js';

type Props = {
  correctAnswer: string;
  countryNames: Record<string, string>;
  phase: 'question' | 'reveal';
  selected: string | null;
  onSubmit: (iso: string) => void;
};

export default function TextAnswer({ correctAnswer, countryNames, phase, selected, onSubmit }: Props) {
  const [text, setText] = useState('');
  const [matchedName, setMatchedName] = useState<string | null>(null);

  function handleSubmit() {
    if (phase === 'reveal' || !text.trim()) return;
    const entries = Object.entries(countryNames).map(([code, name]) => ({ code, name }));
    const fuse = new Fuse(entries, { keys: ['name'], threshold: 0.4 });
    const results = fuse.search(text.trim());
    if (results.length > 0) {
      setMatchedName(results[0].item.name);
      onSubmit(results[0].item.code);
    } else {
      setMatchedName(null);
      onSubmit('__no_match__');
    }
  }

  const correctName = countryNames[correctAnswer] ?? correctAnswer;

  if (phase === 'reveal') {
    const wasCorrect = selected === correctAnswer;
    const guessLabel = matchedName
      ? matchedName
      : text.trim() || '(no answer)';
    return (
      <div className='text-answer-result'>
        <div className={`text-answer-reveal ${wasCorrect ? 'correct' : 'wrong'}`}>
          {wasCorrect
            ? `✓ Correct! ${correctName}`
            : `✗ Wrong — you guessed "${guessLabel}"`}
        </div>
        {!wasCorrect && (
          <div className='text-answer-correct-label'>
            The answer was <strong>{correctName}</strong>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className='text-answer'>
      <input
        type='text'
        className='text-answer-input'
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        placeholder='Type country name…'
        autoFocus
      />
      <button className='text-answer-submit' onClick={handleSubmit} disabled={!text.trim()}>
        Submit
      </button>
    </div>
  );
}

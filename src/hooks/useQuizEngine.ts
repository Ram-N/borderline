
import { useEffect, useMemo, useState } from 'react';
import type { Question } from '../types/question';

type MapStatus = 'hidden' | 'correct' | 'wrong';

export default function useQuizEngine({ setPath, maxQuestions = 5 }: { setPath: string; maxQuestions?: number }) {
  const [all, setAll] = useState<Question[] | null>(null);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [checked, setChecked] = useState(false);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<MapStatus>('hidden');

  useEffect(() => {
    if (!setPath) return;
    fetch(setPath)
      .then(r => r.json())
      .then((q) => setAll(q.questions))
      .catch(() => setAll([]));
  }, [setPath]);

  const total = useMemo(() => Math.min(all?.length ?? 0, maxQuestions), [all, maxQuestions]);
  const question = useMemo(() => (all && all[index] ? all[index] : null), [all, index]);
  const done = useMemo(() => total > 0 && index >= total, [index, total]);

  function select(label: string, option: string) {
    setSelections(prev => ({ ...prev, [label]: option }));
  }

  function check() {
    if (!question) return;
    let correct = 0;
    question.neighbors.forEach(nb => {
      if (selections[nb.label] === nb.answer) correct += 1;
    });
    setScore(s => s + correct);
    setChecked(true);
    setStatus(correct === question.neighbors.length ? 'correct' : 'wrong');
  }

  function next() {
    setIndex(i => i + 1);
    setChecked(false);
    setSelections({});
    setStatus('hidden');
  }

  return { question, index, total, select, selections, check, checked, score, next, done, status } as const;
}

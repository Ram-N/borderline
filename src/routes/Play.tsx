
import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useQuizEngine from '../hooks/useQuizEngine';
import MapCard from '../components/MapCard';
import MultipleChoice from '../components/MultipleChoice';
import ScorePanel from '../components/ScorePanel';

export default function Play() {
  const navigate = useNavigate();
  const qs = new URLSearchParams(useLocation().search);
  const setPath = qs.get('set') ?? '';
  const n = Number(qs.get('n') ?? '5');

  const { question, index, total, select, selections, check, checked, score, next, done, status } = useQuizEngine({
    setPath,
    maxQuestions: n,
  });

  const allAnswered = useMemo(() => {
    if (!question) return false;
    return question.neighbors.every(nb => selections[nb.label]);
  }, [question, selections]);

  if (done) {
    navigate('/results', { state: { score, total } });
  }

  if (!question) return <div className='loading'>Loading…</div>;

  return (
    <div className='play'>
      <ScorePanel index={index} total={total} score={score} />
      <MapCard
        svgMap={question.svgMap}
        targetId={question.targetId}
        status={status}
        labelStyle={question.labelStyle}
        country={question.countryOfInterest}
      />
      <MultipleChoice neighbors={question.neighbors} selections={selections} onSelect={select} disabled={checked} />
      <div className='controls'>
        {!checked && <button onClick={check} disabled={!allAnswered}>Check</button>}
        {checked && <button onClick={next}>Next</button>}
      </div>
    </div>
  );
}

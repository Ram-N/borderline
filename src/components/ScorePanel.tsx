
export default function ScorePanel({ index, total, score }: { index: number; total: number; score: number }) {
  return (
    <div className='score-panel'>
      <span>Question {index + 1} / {total}</span>
      <span>Score: {score}</span>
    </div>
  );
}

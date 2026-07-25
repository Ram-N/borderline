type Props = {
  secondsLeft: number;
  totalSeconds: number;
  isUntimed: boolean;
};

export default function TimerBar({ secondsLeft, totalSeconds, isUntimed }: Props) {
  if (isUntimed) return null;

  const pct = (secondsLeft / totalSeconds) * 100;
  const warning = secondsLeft <= 5;

  return (
    <div className='timer-bar-track'>
      <div
        className={`timer-bar-fill${warning ? ' timer-warning' : ''}`}
        style={{ width: `${pct}%`, marginLeft: `${100 - pct}%` }}
      />
    </div>
  );
}

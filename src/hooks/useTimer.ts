import { useState, useEffect, useRef, useCallback } from 'react';

export type TimerPreset = 'blitz' | 'regular' | 'untimed';

const PRESET_SECONDS: Record<TimerPreset, number> = {
  blitz: 10,
  regular: 30,
  untimed: 0,
};

export default function useTimer(preset: TimerPreset, onExpire: () => void) {
  const totalSeconds = PRESET_SECONDS[preset];
  const isUntimed = preset === 'untimed';
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [running, setRunning] = useState(!isUntimed);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!running || isUntimed) return;
    const id = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(id);
          setRunning(false);
          onExpireRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, isUntimed]);

  const pause = useCallback(() => setRunning(false), []);
  const reset = useCallback(() => {
    setSecondsLeft(totalSeconds);
    setRunning(!isUntimed);
  }, [totalSeconds, isUntimed]);

  return { secondsLeft, totalSeconds, isUntimed, reset, pause };
}

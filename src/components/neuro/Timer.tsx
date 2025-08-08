import { useEffect, useRef, useState } from 'react';

interface TimerProps {
  durationMs: number;
  onDone?: () => void;
  onTick?: (remainingMs: number) => void;
  autoStart?: boolean;
  className?: string;
}

export const Timer = ({ durationMs, onDone, onTick, autoStart = true, className }: TimerProps) => {
  const [remainingMs, setRemainingMs] = useState<number>(durationMs);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!autoStart) return;
    startRef.current = Date.now();
    setRemainingMs(durationMs);
    const i = setInterval(() => {
      const elapsed = Date.now() - (startRef.current ?? Date.now());
      const remain = Math.max(0, durationMs - elapsed);
      setRemainingMs(remain);
      onTick?.(remain);
      if (remain <= 0) {
        clearInterval(i);
        onDone?.();
      }
    }, 250);
    return () => clearInterval(i);
  }, [durationMs, autoStart, onDone, onTick]);

  const mm = String(Math.floor(remainingMs / 60000)).padStart(2, '0');
  const ss = String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, '0');

  return (
    <div className={className}>
      <span className="font-mono">{mm}:{ss}</span>
    </div>
  );
};

export default Timer;



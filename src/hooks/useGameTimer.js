import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export function useGameTimer() {
  const [elapsedMs, setElapsedMs] = useState(0);
  const runningRef = useRef(false);
  const startTsRef = useRef(performance.now());
  const rafRef = useRef(0);

  const tick = useCallback((now) => {
    if (!runningRef.current) return;
    setElapsedMs(now - startTsRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    const now = performance.now();
    startTsRef.current = now - elapsedMs;           // resume from where we left off
    rafRef.current = requestAnimationFrame(tick);
  }, [elapsedMs, tick]);

  const pause = useCallback(() => {
    if (!runningRef.current) return;
    runningRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  }, []);

  const reset = useCallback(() => {
    runningRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    setElapsedMs(0);
    startTsRef.current = performance.now();         // reset base
  }, []);

  const formattedTime = useMemo(() => {
    const total = Math.floor(elapsedMs / 1000);
    const h = String(Math.floor(total / 3600)).padStart(2, '0');
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }, [elapsedMs]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  return { elapsedMs, formattedTime, start, pause, reset };
}
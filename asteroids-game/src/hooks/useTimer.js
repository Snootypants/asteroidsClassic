import { useRef, useCallback } from 'react';

export const useTimer = (gameStartedRef, gameOverRef, isPausedRef, deathSequenceActiveRef, setUiState) => {
  const gameStartTimeRef = useRef(0);
  const elapsedTimeRef = useRef(0);
  const pausedTimeRef = useRef(0);
  const timerIntervalRef = useRef(null);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = useCallback(() => {
    gameStartTimeRef.current = Date.now();
    elapsedTimeRef.current = 0;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    timerIntervalRef.current = setInterval(() => {
      if (!isPausedRef.current && !deathSequenceActiveRef.current && gameStartedRef.current && !gameOverRef.current) {
        const elapsed = Math.floor((Date.now() - gameStartTimeRef.current - pausedTimeRef.current) / 1000);
        elapsedTimeRef.current = elapsed;
        setUiState(prev => ({ ...prev, timeString: formatTime(elapsed) }));
      }
    }, 1000);
  }, [isPausedRef, deathSequenceActiveRef, gameStartedRef, gameOverRef, setUiState]);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  return { formatTime, startTimer, stopTimer, elapsedTimeRef, pausedTimeRef };
};

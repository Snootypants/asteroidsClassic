import { useEffect, useRef } from 'react';

export function useGameLoop({
  update,
  render,
  setUiState,
  currencyRef,
  livesRef,
  gameOverRef,
  xpRef,
  levelRef,
  hyperCountdownRef,
  onFrame,
}) {
  const requestRef = useRef();
  const lastTimestampRef = useRef(null);

  useEffect(() => {
    const loop = (timestamp) => {
      if (lastTimestampRef.current == null) {
        lastTimestampRef.current = timestamp;
      }
      const delta = timestamp - lastTimestampRef.current;
      lastTimestampRef.current = timestamp;

      update();
      render();

      // Throttle UI updates - only update when values actually change
      setUiState((prev) => ({
        ...prev,
        currency: currencyRef.current,
        lives: livesRef.current,
        gameOver: gameOverRef.current,
        xp: xpRef.current,
        level: levelRef.current,
        hyperCountdownMs: hyperCountdownRef?.current ?? 0,
      }));

      if (typeof onFrame === 'function') {
        onFrame(delta);
      }

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      lastTimestampRef.current = null;
    };
  }, [update, render, setUiState, currencyRef, livesRef, gameOverRef, xpRef, levelRef, hyperCountdownRef, onFrame]);
}

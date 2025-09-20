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
}) {
  const requestRef = useRef();

  useEffect(() => {
    const loop = () => {
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

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [update, render, setUiState, currencyRef, livesRef, gameOverRef, xpRef, levelRef, hyperCountdownRef]);
}

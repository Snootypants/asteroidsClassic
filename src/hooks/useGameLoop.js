import { useEffect, useRef } from 'react';

export function useGameLoop({
  update,
  render,
  setUiState,
  scoreRef,
  livesRef,
  gameOverRef,
  xpRef,
  levelRef,
}) {
  const requestRef = useRef();

  useEffect(() => {
    const loop = () => {
      update();
      render();

      // Throttle UI updates - only update when values actually change
      setUiState((prev) => ({
        ...prev,
        score: scoreRef.current,
        lives: livesRef.current,
        gameOver: gameOverRef.current,
        xp: xpRef.current,
        level: levelRef.current,
      }));

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [update, render, setUiState, scoreRef, livesRef, gameOverRef, xpRef, levelRef]);
}
import { useEffect, useRef, useCallback } from 'react';

export const useGameLoop = (update, render) => {
  const requestRef = useRef();

  const loop = useCallback(() => {
    update();
    render();
    requestRef.current = requestAnimationFrame(loop);
  }, [update, render]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [loop]);
};

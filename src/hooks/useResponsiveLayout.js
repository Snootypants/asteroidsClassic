import { useEffect } from 'react';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../utils/constants.js';

export function useResponsiveLayout(canvasRef, minimapCanvasRef, setLayout) {
  useEffect(() => {
    const updateGameLayout = () => {
      const MARGIN_LEFT = 100;
      const MARGIN_RIGHT = 100;
      const MARGIN_TOP = 100;
      const MARGIN_BOTTOM = 200;

      const ASPECT_RATIO = 1349 / 817;
      const MINIMAP_WIDTH_RATIO = 0.3276501112;

      const availableWidth = window.innerWidth - MARGIN_LEFT - MARGIN_RIGHT;
      const availableHeight = window.innerHeight - MARGIN_TOP - MARGIN_BOTTOM;

      let playWidth, playHeight;
      if (availableWidth / availableHeight > ASPECT_RATIO) {
        playHeight = availableHeight;
        playWidth = Math.round(playHeight * ASPECT_RATIO);
      } else {
        playWidth = availableWidth;
        playHeight = Math.round(playWidth / ASPECT_RATIO);
      }

      const playX = MARGIN_LEFT + Math.round((availableWidth - playWidth) / 2);
      const playY = MARGIN_TOP + Math.round((availableHeight - playHeight) / 2);

      const worldAspect = WORLD_HEIGHT / WORLD_WIDTH;
      let minimapWidth = Math.round(playWidth * MINIMAP_WIDTH_RATIO);
      let minimapHeight = Math.round(minimapWidth * worldAspect);
      const MAX_MINIMAP_HEIGHT_RATIO = 0.2;
      const maxMinimapHeight = Math.round(playHeight * MAX_MINIMAP_HEIGHT_RATIO);
      if (minimapHeight > maxMinimapHeight) {
        minimapHeight = maxMinimapHeight;
        minimapWidth = Math.round(minimapHeight / worldAspect);
      }

      const playArea = document.querySelector('.play-area');
      if (playArea) {
        playArea.style.left = `${playX}px`;
        playArea.style.top = `${playY}px`;
        playArea.style.width = `${playWidth}px`;
        playArea.style.height = `${playHeight}px`;
      }

      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = playWidth - 4;
        canvas.height = playHeight - 4;
      }

      const minimapCanvas = minimapCanvasRef.current;
      if (minimapCanvas) {
        minimapCanvas.width = minimapWidth;
        minimapCanvas.height = minimapHeight;
        minimapCanvas.style.width = `${minimapWidth}px`;
        minimapCanvas.style.height = `${minimapHeight}px`;
        console.log('Minimap dimensions set:', minimapWidth, minimapHeight);
      }

      const minimapBottom = -Math.round(minimapHeight * 0.75);
      setLayout(prev => ({ ...prev, minimapBottom }));

      const updatedCanvasWidth = playWidth - 4;
      const updatedCanvasHeight = playHeight - 4;
      window.currentCanvasWidth = updatedCanvasWidth;
      window.currentCanvasHeight = updatedCanvasHeight;

      console.log('Layout calc:', {
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        availableWidth,
        availableHeight,
        playWidth,
        playHeight,
        playX,
        playY,
        minimapWidth,
        minimapHeight
      });
    };

    const timeoutId = setTimeout(updateGameLayout, 10);
    updateGameLayout();

    window.addEventListener('resize', updateGameLayout);
    window.addEventListener('orientationchange', updateGameLayout);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateGameLayout);
      window.removeEventListener('orientationchange', updateGameLayout);
    };
  }, [canvasRef, minimapCanvasRef, setLayout]);
}

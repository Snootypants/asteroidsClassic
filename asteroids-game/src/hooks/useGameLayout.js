import { useEffect } from 'react';
import { WORLD_CONFIG } from '../utils/constants';

const { WORLD_WIDTH, WORLD_HEIGHT } = WORLD_CONFIG;

export const useGameLayout = (playAreaRef, canvasRef, minimapCanvasRef, xpBarCanvasRef, setLayout, setMetaLayout, canvasWidthRef, canvasHeightRef) => {
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

      const playArea = playAreaRef.current;
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
      }

      const minimapBottom = -Math.round(minimapHeight * 0.75);
      setLayout(prev => ({ ...prev, minimapBottom }));

      const leftHudX = Math.round((playWidth - minimapWidth) / 2 - 50);
      const rightHudX = Math.round((playWidth + minimapWidth) / 2 + 50);
      setMetaLayout({ playWidth, minimapWidth, leftHudX, rightHudX });

      const xpbar = xpBarCanvasRef.current;
      if (xpbar) {
        const xpW = Math.max(100, playWidth - 60);
        const xpH = 15;
        xpbar.width = xpW;
        xpbar.height = xpH;
        xpbar.style.width = `${xpW}px`;
        xpbar.style.height = `${xpH}px`;
        const leftPx = Math.round((playWidth - xpW) / 2);
        xpbar.style.left = `${leftPx}px`;
      }

      canvasWidthRef.current = playWidth - 4;
      canvasHeightRef.current = playHeight - 4;
    };

    updateGameLayout();

    window.addEventListener('resize', updateGameLayout);
    window.addEventListener('orientationchange', updateGameLayout);

    return () => {
      window.removeEventListener('resize', updateGameLayout);
      window.removeEventListener('orientationchange', updateGameLayout);
    };
  }, [playAreaRef, canvasRef, minimapCanvasRef, xpBarCanvasRef, setLayout, setMetaLayout, canvasWidthRef, canvasHeightRef]);
};

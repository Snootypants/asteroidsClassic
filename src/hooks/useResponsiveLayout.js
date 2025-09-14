import { useEffect, useState } from 'react';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../utils/constants.js';

export function useResponsiveLayout({
  canvasRef,
  minimapCanvasRef,
  xpBarCanvasRef,
  playAreaRef,
  canvasWidthRef,
  canvasHeightRef,
}) {
  const [layout, setLayout] = useState({ minimapBottom: -90 });
  const [metaLayout, setMetaLayout] = useState({
    playWidth: 1200,
    minimapWidth: 160,
    leftHudX: 0,
    rightHudX: 1200 - 80
  });

  // Dynamic layout system with fixed margins and locked aspect ratio
  useEffect(() => {
    const updateGameLayout = () => {
      // Fixed margins
      const MARGIN_LEFT = 100;
      const MARGIN_RIGHT = 100;
      const MARGIN_TOP = 100;
      const MARGIN_BOTTOM = 200;

      // Target aspect ratio 1349:817
      const ASPECT_RATIO = 1349 / 817; // ≈1.6514041591

      // Minimap sizing: width is a proportion of the play area,
      // height derived from the WORLD aspect ratio so the shape matches the world.
      const MINIMAP_WIDTH_RATIO = 0.3276501112; // keep visual width similar to before

      // Calculate available box
      const availableWidth = window.innerWidth - MARGIN_LEFT - MARGIN_RIGHT;
      const availableHeight = window.innerHeight - MARGIN_TOP - MARGIN_BOTTOM;

      // Calculate play area size maintaining aspect ratio
      let playWidth, playHeight;
      if (availableWidth / availableHeight > ASPECT_RATIO) {
        // Height-constrained
        playHeight = availableHeight;
        playWidth = Math.round(playHeight * ASPECT_RATIO);
      } else {
        // Width-constrained
        playWidth = availableWidth;
        playHeight = Math.round(playWidth / ASPECT_RATIO);
      }

      // Center play area within available box
      const playX = MARGIN_LEFT + Math.round((availableWidth - playWidth) / 2);
      const playY = MARGIN_TOP + Math.round((availableHeight - playHeight) / 2);

      // Calculate minimap dimensions using world aspect ratio
      const worldAspect = WORLD_HEIGHT / WORLD_WIDTH; // H/W
      let minimapWidth = Math.round(playWidth * MINIMAP_WIDTH_RATIO);
      let minimapHeight = Math.round(minimapWidth * worldAspect);
      // Guard: if height would exceed a reasonable portion of play area, cap by height and recompute width
      const MAX_MINIMAP_HEIGHT_RATIO = 0.2; // at most 20% of play height
      const maxMinimapHeight = Math.round(playHeight * MAX_MINIMAP_HEIGHT_RATIO);
      if (minimapHeight > maxMinimapHeight) {
        minimapHeight = maxMinimapHeight;
        minimapWidth = Math.round(minimapHeight / worldAspect);
      }

      // Apply styles to play area via ref
      const playArea = playAreaRef.current;
      if (playArea) {
        playArea.style.left = `${playX}px`;
        playArea.style.top = `${playY}px`;
        playArea.style.width = `${playWidth}px`;
        playArea.style.height = `${playHeight}px`;
      }

      // Update canvas dimensions
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = playWidth - 4; // Account for 2px border on each side
        canvas.height = playHeight - 4;
      }

      // Update minimap dimensions and ensure it's positioned within play area
      const minimapCanvas = minimapCanvasRef.current;
      if (minimapCanvas) {
        minimapCanvas.width = minimapWidth;
        minimapCanvas.height = minimapHeight;
        minimapCanvas.style.width = `${minimapWidth}px`;
        minimapCanvas.style.height = `${minimapHeight}px`;
        if (import.meta.env.DEV) {
          console.log('Minimap dimensions set:', minimapWidth, minimapHeight);
        }
      }

      // Update XP bar dimensions
      const xpBarCanvas = xpBarCanvasRef.current;
      if (xpBarCanvas) {
        xpBarCanvas.width = playWidth - 50; // Slightly narrower than play area
        xpBarCanvas.height = 20;
        xpBarCanvas.style.width = `${playWidth - 50}px`;
        xpBarCanvas.style.height = '20px';
        if (import.meta.env.DEV) {
          console.log('XP bar dimensions set:', playWidth - 50, 20);
        }
      }

      // Store dimensions for other components
      canvasWidthRef.current = playWidth - 4;
      canvasHeightRef.current = playHeight - 4;

      // Update layout state for minimap positioning
      setLayout({ minimapBottom: -90 });

      // Update meta layout for HUD positioning
      const leftHudX = Math.round(playWidth * 0.25); // 25% from left edge
      const rightHudX = Math.round(playWidth * 0.75); // 75% from left edge

      setMetaLayout({
        playWidth,
        minimapWidth,
        leftHudX,
        rightHudX,
        playHeight,
        playX,
        playY,
        minimapHeight
      });
    };

    // Perform initial layout calculation and set up listeners
    updateGameLayout();

    window.addEventListener('resize', updateGameLayout);
    window.addEventListener('orientationchange', updateGameLayout);

    return () => {
      window.removeEventListener('resize', updateGameLayout);
      window.removeEventListener('orientationchange', updateGameLayout);
    };
  }, [canvasRef, minimapCanvasRef, xpBarCanvasRef, playAreaRef, canvasWidthRef, canvasHeightRef]);

  return { layout, metaLayout };
}
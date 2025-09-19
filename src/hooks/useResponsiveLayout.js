import { useEffect, useState } from 'react';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../utils/constants.js';

export function useResponsiveLayout({
  canvasRef,
  playAreaRef,
  canvasWidthRef,
  canvasHeightRef,
}) {
  const [layout, setLayout] = useState({ minimapBottom: -90 });
  const [metaLayout, setMetaLayout] = useState({
    playWidth: 1200,
    minimapWidth: 160,
    leftHudX: 0,
    rightHudX: 1200 - 80,
    playX: 14,
    playY: 14
  });

  // Dynamic layout system with HUD-aligned margins
  useEffect(() => {
    const updateGameLayout = () => {
      // Read CSS variables from DOM - MUST be first
      const root = document.documentElement;
      const rootStyles = getComputedStyle(root);
      const layoutGutter = parseInt(rootStyles.getPropertyValue('--layout-gutter')) || 14;
      const layoutTopGap = parseInt(rootStyles.getPropertyValue('--layout-top-gap')) || layoutGutter;
      const hudHeight = parseInt(rootStyles.getPropertyValue('--hud-actual-height')) || 130;

      const frameBorder = 4; // Account for 2px border on each side of the playfield frame

      const horizontalMargin = layoutGutter;
      const topMargin = layoutTopGap;
      const bottomMargin = hudHeight + layoutGutter; // Space for XP bar + HUD stack

      let playWidth = window.innerWidth - (horizontalMargin * 2) - frameBorder;
      let playHeight = window.innerHeight - topMargin - bottomMargin - frameBorder;

      playWidth = Math.max(0, playWidth);
      playHeight = Math.max(0, playHeight);

      const playX = horizontalMargin;
      const playY = topMargin;

      root.style.setProperty('--hud-padding-h', `${horizontalMargin}px`);
      root.style.setProperty('--hud-padding-top', `${topMargin}px`);

      // Minimap sizing - KEEP EXISTING LOGIC
      const MINIMAP_WIDTH_RATIO = 0.3276501112;
      const worldAspect = WORLD_HEIGHT / WORLD_WIDTH;
      let minimapWidth = Math.round(playWidth * MINIMAP_WIDTH_RATIO);
      let minimapHeight = Math.round(minimapWidth * worldAspect);

      const MAX_MINIMAP_HEIGHT_RATIO = 0.2;
      const maxMinimapHeight = Math.round(playHeight * MAX_MINIMAP_HEIGHT_RATIO);
      if (minimapHeight > maxMinimapHeight) {
        minimapHeight = maxMinimapHeight;
        minimapWidth = Math.round(minimapHeight / worldAspect);
      }

      // Note: Position and size are now handled via metaLayout in App.jsx
      // No direct DOM manipulation needed here

      // Canvas sizing - KEEP 4px border adjustment
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = Math.max(0, playWidth - frameBorder);
        canvas.height = Math.max(0, playHeight - frameBorder);
      }

      // Update refs - REQUIRED for game logic
      canvasWidthRef.current = Math.max(0, playWidth - frameBorder);
      canvasHeightRef.current = Math.max(0, playHeight - frameBorder);

      // Keep existing layout state
      setLayout({ minimapBottom: -90 });

      // Keep existing meta layout calculation
      const leftHudX = Math.round(playWidth * 0.25);
      const rightHudX = Math.round(playWidth * 0.75);

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
  }, [canvasRef, playAreaRef, canvasWidthRef, canvasHeightRef]);

  return { layout, metaLayout };
}

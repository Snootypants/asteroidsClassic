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
      const rootStyles = getComputedStyle(document.documentElement);
      const hudPaddingH = parseInt(rootStyles.getPropertyValue('--hud-padding-h')) || 14;
      const hudHeight = parseInt(rootStyles.getPropertyValue('--hud-actual-height')) || 110;

      // Calculate margins to match HUD exactly
      const MARGIN_HORIZONTAL = hudPaddingH;  // 14px - matches HUD sides
      const MARGIN_TOP = hudPaddingH;         // 14px - same spacing on top
      const MARGIN_BOTTOM = hudHeight + hudPaddingH;  // 110 + 14 = 124px total

      // Keep existing aspect ratio - DO NOT CHANGE
      const ASPECT_RATIO = 1349 / 817;

      // Simple fixed margins - 14px on left, top, right
      const MARGIN = 14;
      let playWidth = window.innerWidth - (2 * MARGIN);  // 14px left + 14px right
      let playHeight = window.innerHeight - MARGIN - MARGIN_BOTTOM;  // 14px top + HUD space bottom

      // Fixed positioning
      let playX = MARGIN;  // 14px from left
      let playY = MARGIN;  // 14px from top

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
        canvas.width = playWidth - 4;
        canvas.height = playHeight - 4;
      }

      // Update refs - REQUIRED for game logic
      canvasWidthRef.current = playWidth - 4;
      canvasHeightRef.current = playHeight - 4;

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
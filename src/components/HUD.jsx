import { useRef, useEffect, useCallback } from 'react';

export default function Hud({
  uiState,
  metaLayout,
  world,
  formattedTime,
  minimapCanvasRef
}) {
  const xpBarCanvasRef = useRef(null);
  const { xpNeededForNextLevel, stageRef } = world;

  // XP Bar Rendering Logic
  const renderXpBar = useCallback(() => {
    const canvas = xpBarCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Dark background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, w, h);

    // XP progress calculation
    const currentXp = uiState.xp || 0;
    const totalXpNeeded = xpNeededForNextLevel(uiState.level);
    const progress = Math.min(currentXp / totalXpNeeded, 1);

    // Background bar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, 0, w, h);

    // Progress fill with gradient
    if (progress > 0) {
      const gradient = ctx.createLinearGradient(0, 0, w * progress, 0);
      gradient.addColorStop(0, '#4CAF50');
      gradient.addColorStop(0.5, '#8BC34A');
      gradient.addColorStop(1, '#CDDC39');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w * progress, h);
    }

    // White bottom border
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, h - 1);
    ctx.lineTo(w, h - 1);
    ctx.stroke();

    // XP text overlay (centered)
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    const xpText = `${currentXp} / ${totalXpNeeded} XP`;
    ctx.fillText(xpText, w / 2, h / 2);
  }, [uiState.level, uiState.xp, xpNeededForNextLevel]);


  // Canvas Setup and Rendering
  useEffect(() => {
    // Setup XP bar canvas dimensions
    const xpBarCanvas = xpBarCanvasRef.current;
    if (xpBarCanvas && metaLayout.playWidth) {
      xpBarCanvas.width = metaLayout.playWidth + 4; // Match full HUD width
      xpBarCanvas.height = 20;
      xpBarCanvas.style.width = `100%`;
      xpBarCanvas.style.height = '20px';
    }

    // Setup minimap canvas dimensions
    const minimapCanvas = minimapCanvasRef?.current;
    if (minimapCanvas && metaLayout.minimapWidth && metaLayout.minimapHeight) {
      minimapCanvas.width = metaLayout.minimapWidth;
      minimapCanvas.height = metaLayout.minimapHeight;
      minimapCanvas.style.width = `${metaLayout.minimapWidth}px`;
      minimapCanvas.style.height = `${metaLayout.minimapHeight}px`;
    }
  }, [metaLayout.playWidth, metaLayout.minimapWidth, metaLayout.minimapHeight, minimapCanvasRef]);

  // Render canvases when data changes
  useEffect(() => {
    renderXpBar();
  }, [renderXpBar]);


  if (!metaLayout.playWidth) return null;

  return (
    <div
      className="hud-container"
      style={{
        width: `${metaLayout.playWidth + 4}px`,
        left: `${metaLayout.playX}px`,
        top: `${metaLayout.playY + metaLayout.playHeight + 5}px`
      }}
    >
      <canvas ref={xpBarCanvasRef} className="hud-xpbar" />
      <div className="hud-content">
        <div className="hud-left">
          <div className="hud-stat">XP: {uiState.xp}/{xpNeededForNextLevel(uiState.level)}</div>
          <div className="hud-stat">Level: {uiState.level}</div>
          <div className="hud-stat">Lives: {uiState.lives}</div>
        </div>

        <canvas
          ref={minimapCanvasRef}
          className="hud-minimap"
        />

        <div className="hud-right">
          <div className="hud-stat">
            {uiState.mode === 'waves' ? `Wave: ${stageRef?.current || 1}` : `Time: ${formattedTime}`}
          </div>
        </div>
      </div>
    </div>
  );
}
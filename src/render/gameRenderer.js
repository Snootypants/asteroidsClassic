// Pure functions - no React imports

export function renderMinimap({ minimapCanvasRef, shipRef, asteroidsRef, cameraRef, Minimap }) {
  const canvas = minimapCanvasRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return; // jsdom/test environment safeguard
  Minimap.draw(ctx, shipRef.current, asteroidsRef.current, cameraRef.current);
}

export function renderXpBar({ xpBarCanvasRef, uiState, xpNeededForNextLevel }) {
  const canvas = xpBarCanvasRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return; // jsdom/test environment safeguard

  const w = canvas.width;
  const h = canvas.height;

  // Clear the canvas
  ctx.clearRect(0, 0, w, h);

  // Draw background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, w, h);

  // Calculate XP progress
  const currentXp = uiState.xp || 0;
  const totalXpNeeded = xpNeededForNextLevel(uiState.level);
  const progress = Math.min(currentXp / totalXpNeeded, 1);

  // Draw XP bar background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.fillRect(2, 2, w - 4, h - 4);

  // Draw XP bar fill
  if (progress > 0) {
    ctx.fillStyle = '#4CAF50'; // Green color
    ctx.fillRect(2, 2, (w - 4) * progress, h - 4);
  }

  // Draw border
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 1;
  ctx.strokeRect(1, 1, w - 2, h - 2);

  // Draw XP text (centered)
  ctx.fillStyle = 'white';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const xpText = `${currentXp}/${totalXpNeeded} XP`;
  ctx.fillText(xpText, w / 2, h / 2);
}

export function renderScene({
  canvasRef,
  canvasWidthRef,
  canvasHeightRef,
  cameraRef,
  starsRef,
  shipRef,
  asteroidsRef,
  bulletsRef,
  mousePositionRef,
  gameStartedRef,
  levelUpEffectRef,
  stageClearEffectRef,
  hyperSpaceJumpEffectRef,
  CROSSHAIR_SIZE,
  renderMinimapFn,
  renderXpBarFn,
}) {
  const canvas = canvasRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return; // jsdom/test environment safeguard
  const canvasWidth = canvasWidthRef.current || 1200;
  const canvasHeight = canvasHeightRef.current || 900;
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  const nowMs = performance.now();

  const camera = cameraRef.current;

  // Draw parallax stars (background) - with hyperspace effect support
  if (hyperSpaceJumpEffectRef.current.active &&
      (hyperSpaceJumpEffectRef.current.phase === 'brighten' ||
       hyperSpaceJumpEffectRef.current.phase === 'streaking')) {
    hyperSpaceJumpEffectRef.current.drawStars(ctx, starsRef.current, camera, canvasWidth, canvasHeight);
  } else {
    starsRef.current.forEach((star) => {
      // Calculate parallax position
      const parallaxX = star.x - camera.x * star.parallax;
      const parallaxY = star.y - camera.y * star.parallax;

      const screenPos = camera.worldToScreen(parallaxX, parallaxY, canvasWidth, canvasHeight);

      // Only draw if visible (with margin for star wrapping)
      if (screenPos.x >= -50 && screenPos.x <= canvasWidth + 50 &&
          screenPos.y >= -50 && screenPos.y <= canvasHeight + 50) {
        ctx.save();
        // Boost perceived brightness ~20% while clamping to 1.0
        ctx.globalAlpha = Math.min(1, star.brightness * 1.2);
        ctx.fillStyle = 'white';
        ctx.fillRect(screenPos.x, screenPos.y, star.size / camera.zoom, star.size / camera.zoom);
        ctx.restore();
      }
    });
  }

  // Draw ship (with hyperspace fade support)
  if (shipRef.current && camera.isVisible(shipRef.current.x, shipRef.current.y, 50, canvasWidth, canvasHeight)) {
    const screenPos = camera.worldToScreen(shipRef.current.x, shipRef.current.y, canvasWidth, canvasHeight);
    ctx.save();

    // Apply hyperspace opacity if active
    if (hyperSpaceJumpEffectRef.current.active) {
      ctx.globalAlpha = hyperSpaceJumpEffectRef.current.getShipOpacity();
    }

    ctx.translate(screenPos.x, screenPos.y);
    ctx.scale(1/camera.zoom, 1/camera.zoom);
    ctx.translate(-shipRef.current.x, -shipRef.current.y);
    shipRef.current.draw(ctx, nowMs);
    ctx.restore();
  }

  // Draw asteroids (with culling and hyperspace fade)
  asteroidsRef.current.forEach((asteroid) => {
    if (asteroid && camera.isVisible(asteroid.x, asteroid.y, asteroid.size, canvasWidth, canvasHeight)) {
      const screenPos = camera.worldToScreen(asteroid.x, asteroid.y, canvasWidth, canvasHeight);
      ctx.save();

      // Apply hyperspace opacity if active
      if (hyperSpaceJumpEffectRef.current.active) {
        ctx.globalAlpha = hyperSpaceJumpEffectRef.current.getAsteroidsOpacity();
      }
      ctx.translate(screenPos.x, screenPos.y);
      ctx.scale(1/camera.zoom, 1/camera.zoom);
      // Draw asteroid using its draw method
      ctx.translate(-asteroid.x, -asteroid.y);
      asteroid.draw(ctx);
      ctx.restore();
    }
  });

  // Draw bullets (with culling)
  bulletsRef.current.forEach((bullet) => {
    if (bullet && camera.isVisible(bullet.x, bullet.y, bullet.size, canvasWidth, canvasHeight)) {
      const screenPos = camera.worldToScreen(bullet.x, bullet.y, canvasWidth, canvasHeight);
      ctx.save();
      ctx.translate(screenPos.x, screenPos.y);
      ctx.scale(1/camera.zoom, 1/camera.zoom);
      ctx.translate(-bullet.x, -bullet.y);
      bullet.draw(ctx);
      ctx.restore();
    }
  });

  // Draw crosshair at mouse position
  if (gameStartedRef.current) {
    const mousePos = mousePositionRef.current;
    const screenPos = camera.worldToScreen(mousePos.x, mousePos.y, canvasWidth, canvasHeight);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Horizontal line
    ctx.moveTo(screenPos.x - CROSSHAIR_SIZE, screenPos.y);
    ctx.lineTo(screenPos.x + CROSSHAIR_SIZE, screenPos.y);
    // Vertical line
    ctx.moveTo(screenPos.x, screenPos.y - CROSSHAIR_SIZE);
    ctx.lineTo(screenPos.x, screenPos.y + CROSSHAIR_SIZE);
    ctx.stroke();
  }

  // Render minimap separately
  renderMinimapFn();
  // Render XP bar
  renderXpBarFn();

  // Draw level-up effects (overlay)
  levelUpEffectRef.current.draw(ctx, camera, canvasWidth, canvasHeight);
  stageClearEffectRef.current.draw(ctx, camera, canvasWidth, canvasHeight);
  hyperSpaceJumpEffectRef.current.draw(ctx, camera, canvasWidth, canvasHeight);
}
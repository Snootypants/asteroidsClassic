import { useCallback } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT, CROSSHAIR_SIZE } from '../utils/constants.js';
import { Minimap } from '../components/Minimap.js';

export function useRendering({ canvasRef, minimapCanvasRef, starsRef, shipRef, cameraRef, asteroidsRef, bulletsRef, mousePositionRef, gameStartedRef }) {
  const renderMinimap = useCallback(() => {
    const minimapCanvas = minimapCanvasRef.current;
    if (!minimapCanvas) return;
    const ctx = minimapCanvas.getContext('2d');
    Minimap.draw(ctx, shipRef.current, asteroidsRef.current, cameraRef.current);
  }, [minimapCanvasRef, shipRef, asteroidsRef, cameraRef]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const canvasWidth = window.currentCanvasWidth || CANVAS_WIDTH;
    const canvasHeight = window.currentCanvasHeight || CANVAS_HEIGHT;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const camera = cameraRef.current;

    starsRef.current.forEach((star) => {
      const parallaxX = star.x - camera.x * star.parallax;
      const parallaxY = star.y - camera.y * star.parallax;
      const screenPos = camera.worldToScreen(parallaxX, parallaxY, canvasWidth, canvasHeight);
      if (screenPos.x >= -50 && screenPos.x <= canvasWidth + 50 &&
          screenPos.y >= -50 && screenPos.y <= canvasHeight + 50) {
        ctx.save();
        ctx.globalAlpha = star.brightness;
        ctx.fillStyle = 'white';
        ctx.fillRect(screenPos.x, screenPos.y, star.size / camera.zoom, star.size / camera.zoom);
        ctx.restore();
      }
    });

    if (shipRef.current && camera.isVisible(shipRef.current.x, shipRef.current.y, 50, canvasWidth, canvasHeight)) {
      const screenPos = camera.worldToScreen(shipRef.current.x, shipRef.current.y, canvasWidth, canvasHeight);
      ctx.save();
      ctx.translate(screenPos.x, screenPos.y);
      ctx.scale(1 / camera.zoom, 1 / camera.zoom);
      ctx.rotate(shipRef.current.angle);
      const size = shipRef.current.size;
      ctx.beginPath();
      ctx.moveTo(size, 0);
      ctx.lineTo(-size / 2, -size / 2);
      ctx.lineTo(-size / 2, size / 2);
      ctx.closePath();
      ctx.strokeStyle = 'white';
      ctx.stroke();
      ctx.restore();
    }

    asteroidsRef.current.forEach((asteroid) => {
      if (asteroid && camera.isVisible(asteroid.x, asteroid.y, asteroid.size, canvasWidth, canvasHeight)) {
        const screenPos = camera.worldToScreen(asteroid.x, asteroid.y, canvasWidth, canvasHeight);
        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);
        ctx.scale(1 / camera.zoom, 1 / camera.zoom);
        ctx.translate(-asteroid.x, -asteroid.y);
        asteroid.draw(ctx);
        ctx.restore();
      }
    });

    bulletsRef.current.forEach((bullet) => {
      if (bullet && camera.isVisible(bullet.x, bullet.y, bullet.size, canvasWidth, canvasHeight)) {
        const screenPos = camera.worldToScreen(bullet.x, bullet.y, canvasWidth, canvasHeight);
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, bullet.size / camera.zoom, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
      }
    });

    if (gameStartedRef.current) {
      const mousePos = mousePositionRef.current;
      const screenPos = camera.worldToScreen(mousePos.x, mousePos.y, canvasWidth, canvasHeight);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(screenPos.x - CROSSHAIR_SIZE, screenPos.y);
      ctx.lineTo(screenPos.x + CROSSHAIR_SIZE, screenPos.y);
      ctx.moveTo(screenPos.x, screenPos.y - CROSSHAIR_SIZE);
      ctx.lineTo(screenPos.x, screenPos.y + CROSSHAIR_SIZE);
      ctx.stroke();
    }

    renderMinimap();
  }, [canvasRef, cameraRef, starsRef, shipRef, asteroidsRef, bulletsRef, mousePositionRef, gameStartedRef, renderMinimap]);

  return { render };
}

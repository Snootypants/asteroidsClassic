import { WORLD_WIDTH, WORLD_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, MINIMAP_BG_COLOR, MINIMAP_ASTEROID_COLOR, SHIP_COLOR, MINIMAP_VIEWPORT_COLOR } from '../utils/constants.js';

export class Minimap {
  static draw(ctx, ship, asteroids, camera) {
    // Use the actual canvas dimensions so resizing stays correct
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Clear and draw background (border is handled by CSS on the canvas)
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.fillStyle = MINIMAP_BG_COLOR;
    ctx.fillRect(0, 0, w, h);

    // Scale factors
    const scaleX = w / WORLD_WIDTH;
    const scaleY = h / WORLD_HEIGHT;
    
    // Draw asteroids as small gray dots
    ctx.fillStyle = MINIMAP_ASTEROID_COLOR;
    asteroids.forEach(asteroid => {
      if (asteroid) {
        const x = asteroid.x * scaleX;
        const y = asteroid.y * scaleY;
        ctx.fillRect(x - 1, y - 1, 2, 2);
      }
    });
    
    // Draw ship as white dot
    if (ship) {
      const shipX = ship.x * scaleX;
      const shipY = ship.y * scaleY;
      ctx.fillStyle = SHIP_COLOR;
      ctx.fillRect(shipX - 1.5, shipY - 1.5, 3, 3);
      
      // Draw ship direction indicator
      ctx.strokeStyle = SHIP_COLOR;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(shipX, shipY);
      const dirX = shipX + Math.cos(ship.angle) * 8;
      const dirY = shipY + Math.sin(ship.angle) * 8;
      ctx.lineTo(dirX, dirY);
      ctx.stroke();
    }
    
    // Draw viewport rectangle
    const effectiveViewportWidth = camera.zoom * VIEWPORT_WIDTH;
    const effectiveViewportHeight = camera.zoom * VIEWPORT_HEIGHT;
    
    const viewX = (camera.x - effectiveViewportWidth / 2) * scaleX;
    const viewY = (camera.y - effectiveViewportHeight / 2) * scaleY;
    const viewW = effectiveViewportWidth * scaleX;
    const viewH = effectiveViewportHeight * scaleY;
    
    ctx.strokeStyle = MINIMAP_VIEWPORT_COLOR;
    ctx.lineWidth = 1;
    ctx.strokeRect(viewX, viewY, viewW, viewH);
    
    ctx.restore();
  }
}

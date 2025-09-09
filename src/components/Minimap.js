import { WORLD_WIDTH, WORLD_HEIGHT, MINIMAP_WIDTH, MINIMAP_HEIGHT } from '../utils/constants.js';

export class Minimap {
  static draw(ctx, ship, asteroids, camera) {
    // Minimap position (bottom right corner with margin)
    const mapX = ctx.canvas.width - MINIMAP_WIDTH - 20;
    const mapY = ctx.canvas.height - MINIMAP_HEIGHT - 20;
    
    // Draw minimap background
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.fillRect(mapX, mapY, MINIMAP_WIDTH, MINIMAP_HEIGHT);
    ctx.strokeRect(mapX, mapY, MINIMAP_WIDTH, MINIMAP_HEIGHT);
    
    // Scale factors
    const scaleX = MINIMAP_WIDTH / WORLD_WIDTH;
    const scaleY = MINIMAP_HEIGHT / WORLD_HEIGHT;
    
    // Draw asteroids as small gray dots
    ctx.fillStyle = 'gray';
    asteroids.forEach(asteroid => {
      if (asteroid) {
        const x = mapX + asteroid.x * scaleX;
        const y = mapY + asteroid.y * scaleY;
        ctx.fillRect(x - 1, y - 1, 2, 2);
      }
    });
    
    // Draw ship as white dot
    if (ship) {
      const shipX = mapX + ship.x * scaleX;
      const shipY = mapY + ship.y * scaleY;
      ctx.fillStyle = 'white';
      ctx.fillRect(shipX - 1.5, shipY - 1.5, 3, 3);
      
      // Draw ship direction indicator
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(shipX, shipY);
      const dirX = shipX + Math.cos(ship.angle) * 8;
      const dirY = shipY + Math.sin(ship.angle) * 8;
      ctx.lineTo(dirX, dirY);
      ctx.stroke();
    }
    
    // Draw viewport rectangle
    const effectiveViewportWidth = camera.zoom * ctx.canvas.width;
    const effectiveViewportHeight = camera.zoom * ctx.canvas.height;
    
    const viewX = mapX + (camera.x - effectiveViewportWidth / 2) * scaleX;
    const viewY = mapY + (camera.y - effectiveViewportHeight / 2) * scaleY;
    const viewW = effectiveViewportWidth * scaleX;
    const viewH = effectiveViewportHeight * scaleY;
    
    ctx.strokeStyle = 'yellow';
    ctx.lineWidth = 1;
    ctx.strokeRect(viewX, viewY, viewW, viewH);
    
    ctx.restore();
  }
}
import { WORLD_WIDTH, WORLD_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, MIN_ZOOM, MAX_ZOOM_OUT, ZOOM_INTERPOLATION } from './constants.js';

export class Camera {
  constructor(x = WORLD_WIDTH / 2, y = WORLD_HEIGHT / 2) {
    this.x = x;
    this.y = y;
    this.zoom = 1;
    this.targetZoom = 1;
  }

  // Convert world coordinates to screen coordinates
  worldToScreen(worldX, worldY) {
    const effectiveViewportWidth = VIEWPORT_WIDTH * this.zoom;
    const effectiveViewportHeight = VIEWPORT_HEIGHT * this.zoom;
    
    return {
      x: (worldX - this.x) * (VIEWPORT_WIDTH / effectiveViewportWidth) + VIEWPORT_WIDTH / 2,
      y: (worldY - this.y) * (VIEWPORT_HEIGHT / effectiveViewportHeight) + VIEWPORT_HEIGHT / 2
    };
  }

  // Convert screen coordinates to world coordinates
  screenToWorld(screenX, screenY) {
    const effectiveViewportWidth = VIEWPORT_WIDTH * this.zoom;
    const effectiveViewportHeight = VIEWPORT_HEIGHT * this.zoom;
    
    return {
      x: this.x + (screenX - VIEWPORT_WIDTH / 2) * (effectiveViewportWidth / VIEWPORT_WIDTH),
      y: this.y + (screenY - VIEWPORT_HEIGHT / 2) * (effectiveViewportHeight / VIEWPORT_HEIGHT)
    };
  }

  // Update camera to follow ship with constraints
  followShip(shipX, shipY) {
    const effectiveViewportWidth = VIEWPORT_WIDTH * this.zoom;
    const effectiveViewportHeight = VIEWPORT_HEIGHT * this.zoom;
    
    const halfViewWidth = effectiveViewportWidth / 2;
    const halfViewHeight = effectiveViewportHeight / 2;
    
    // Calculate desired camera position (centered on ship)
    let targetX = shipX;
    let targetY = shipY;
    
    // Constrain camera to world boundaries
    if (targetX - halfViewWidth < 0) {
      targetX = halfViewWidth;
    } else if (targetX + halfViewWidth > WORLD_WIDTH) {
      targetX = WORLD_WIDTH - halfViewWidth;
    }
    
    if (targetY - halfViewHeight < 0) {
      targetY = halfViewHeight;
    } else if (targetY + halfViewHeight > WORLD_HEIGHT) {
      targetY = WORLD_HEIGHT - halfViewHeight;
    }
    
    this.x = targetX;
    this.y = targetY;
  }

  // Check if a world position is visible in the viewport
  isVisible(worldX, worldY, margin = 50) {
    const effectiveViewportWidth = VIEWPORT_WIDTH * this.zoom;
    const effectiveViewportHeight = VIEWPORT_HEIGHT * this.zoom;
    
    const halfViewWidth = effectiveViewportWidth / 2;
    const halfViewHeight = effectiveViewportHeight / 2;
    
    return (
      worldX >= this.x - halfViewWidth - margin &&
      worldX <= this.x + halfViewWidth + margin &&
      worldY >= this.y - halfViewHeight - margin &&
      worldY <= this.y + halfViewHeight + margin
    );
  }

  // Update zoom with smooth interpolation
  updateZoom(deltaTime = 1) {
    if (Math.abs(this.targetZoom - this.zoom) > 0.01) {
      this.zoom += (this.targetZoom - this.zoom) * ZOOM_INTERPOLATION * deltaTime;
    } else {
      this.zoom = this.targetZoom;
    }
  }

  // Set target zoom level
  setZoom(zoom) {
    this.targetZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM_OUT, zoom));
  }
}


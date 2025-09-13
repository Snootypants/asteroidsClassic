import { WORLD_WIDTH, WORLD_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, MIN_ZOOM, MAX_ZOOM_OUT, ZOOM_INTERPOLATION } from './constants.js';

export class Camera {
  constructor(x = WORLD_WIDTH / 2, y = WORLD_HEIGHT / 2) {
    this.x = x;
    this.y = y;
    this.zoom = 1;
    this.targetZoom = 1;
  }

  // Convert world coordinates to screen coordinates
  worldToScreen(worldX, worldY, viewportWidth = VIEWPORT_WIDTH, viewportHeight = VIEWPORT_HEIGHT) {
    const effectiveViewportWidth = viewportWidth * this.zoom;
    const effectiveViewportHeight = viewportHeight * this.zoom;
    
    return {
      x: (worldX - this.x) * (viewportWidth / effectiveViewportWidth) + viewportWidth / 2,
      y: (worldY - this.y) * (viewportHeight / effectiveViewportHeight) + viewportHeight / 2
    };
  }

  // Convert screen coordinates to world coordinates
  screenToWorld(screenX, screenY, viewportWidth = VIEWPORT_WIDTH, viewportHeight = VIEWPORT_HEIGHT) {
    const effectiveViewportWidth = viewportWidth * this.zoom;
    const effectiveViewportHeight = viewportHeight * this.zoom;
    
    return {
      x: this.x + (screenX - viewportWidth / 2) * (effectiveViewportWidth / viewportWidth),
      y: this.y + (screenY - viewportHeight / 2) * (effectiveViewportHeight / viewportHeight)
    };
  }

  // Update camera to follow ship with constraints
  followShip(shipX, shipY, viewportWidth = VIEWPORT_WIDTH, viewportHeight = VIEWPORT_HEIGHT) {
    const effectiveViewportWidth = viewportWidth * this.zoom;
    const effectiveViewportHeight = viewportHeight * this.zoom;
    
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
  isVisible(worldX, worldY, margin = 50, viewportWidth = VIEWPORT_WIDTH, viewportHeight = VIEWPORT_HEIGHT) {
    const effectiveViewportWidth = viewportWidth * this.zoom;
    const effectiveViewportHeight = viewportHeight * this.zoom;
    
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


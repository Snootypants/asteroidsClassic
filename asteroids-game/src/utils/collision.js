import { WORLD_WIDTH, WORLD_HEIGHT } from './constants.js';

// Utility functions for collision detection
export function checkCollision(obj1, obj2) {
  const dx = obj1.x - obj2.x;
  const dy = obj1.y - obj2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < obj1.size + obj2.size;
}

// World wrapping for big map
export function wrapPosition(obj, width = WORLD_WIDTH, height = WORLD_HEIGHT) {
  if (obj.x < 0) obj.x = width;
  if (obj.x > width) obj.x = 0;
  if (obj.y < 0) obj.y = height;
  if (obj.y > height) obj.y = 0;
  return obj;
}



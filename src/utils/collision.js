// Utility functions for collision detection
export function checkCollision(obj1, obj2) {
  const dx = obj1.x - obj2.x;
  const dy = obj1.y - obj2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < obj1.size + obj2.size;
}

export function wrapPosition(obj, canvasWidth, canvasHeight) {
  if (obj.x < 0) obj.x = canvasWidth;
  if (obj.x > canvasWidth) obj.x = 0;
  if (obj.y < 0) obj.y = canvasHeight;
  if (obj.y > canvasHeight) obj.y = 0;
  return obj;
}

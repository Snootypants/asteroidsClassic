// Utility functions for collision detection
export function checkCollision(obj1, obj2) {
  const dx = obj1.x - obj2.x;
  const dy = obj1.y - obj2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < obj1.size + obj2.size;
}

export function wrapPosition(obj, canvasWidth, canvasHeight) {
  const newObj = { ...obj };
  if (newObj.x < 0) newObj.x = canvasWidth;
  if (newObj.x > canvasWidth) newObj.x = 0;
  if (newObj.y < 0) newObj.y = canvasHeight;
  if (newObj.y > canvasHeight) newObj.y = 0;
  return newObj;
}

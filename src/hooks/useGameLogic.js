import { useCallback } from 'react';
import { Bullet } from '../components/Bullet.js';
import { Ship } from '../components/Ship.js';
import { checkCollision, wrapPosition } from '../utils/collision.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, BULLET_FIRE_RATE, MAX_BULLETS,
         SHIP_DECELERATION, SHIP_FRICTION, XP_PER_ASTEROID, SCORE_PER_ASTEROID,
         WORLD_WIDTH, WORLD_HEIGHT } from '../utils/constants.js';

export function useGameLogic({
  gameOverRef,
  gameStartedRef,
  isPausedRef,
  cameraRef,
  canvasWidthRef,
  canvasHeightRef,
  keysRef,
  shipRef,
  mouseScreenRef,
  mousePositionRef,
  asteroidsRef,
  bulletsRef,
  setBulletCount,
  isMouseDownRef,
  lastShotTimeRef,
  scoreRef,
  livesRef,
  addXp,
  levelUpEffectRef,
  stageClearEffectRef,
  hyperSpaceJumpEffectRef,
  starsRef,
  updateAsteroidCounts,
}) {
  const update = useCallback(() => {
    if (gameOverRef.current || !gameStartedRef.current || isPausedRef.current) return;

    // Update camera zoom
    const camera = cameraRef.current;
    camera.updateZoom();

    // Update ship - aims at crosshair, moves with W/S
    const keys = keysRef.current;
    const ship = shipRef.current;

    // Reproject last known screen mouse into world space even if mouse is idle.
    // This prevents the crosshair from becoming stale when the camera moves.
    const canvasWidth = canvasWidthRef.current || CANVAS_WIDTH;
    const canvasHeight = canvasHeightRef.current || CANVAS_HEIGHT;
    const reproj = camera.screenToWorld(
      mouseScreenRef.current.x,
      mouseScreenRef.current.y,
      canvasWidth,
      canvasHeight
    );
    mousePositionRef.current.x = reproj.x;
    mousePositionRef.current.y = reproj.y;
    const mousePos = mousePositionRef.current;

    // Calculate angle to mouse crosshair
    const dx = mousePos.x - ship.x;
    const dy = mousePos.y - ship.y;
    ship.angle = Math.atan2(dy, dx);

    // W/S movement controls
    if (keys.KeyW) {
      ship.vx += Math.cos(ship.angle) * ship.speed;
      ship.vy += Math.sin(ship.angle) * ship.speed;
    }

    // Apply velocity and friction
    ship.x += ship.vx;
    ship.y += ship.vy;

    // S key brakes (slows down to zero, no reverse)
    if (keys.KeyS) {
      ship.vx *= SHIP_DECELERATION;
      ship.vy *= SHIP_DECELERATION;
    } else {
      ship.vx *= SHIP_FRICTION;
      ship.vy *= SHIP_FRICTION;
    }
    wrapPosition(ship); // World wrapping

    // Update camera to follow ship
    camera.followShip(ship.x, ship.y, canvasWidth, canvasHeight);

    // Update asteroids
    asteroidsRef.current.forEach((asteroid) => {
      asteroid.update();
      wrapPosition(asteroid); // World wrapping
    });

    // Update bullets
    bulletsRef.current.forEach((bullet) => {
      bullet.update();
      wrapPosition(bullet); // World wrapping
    });
    bulletsRef.current = bulletsRef.current.filter((bullet) => !bullet.isExpired());
    setBulletCount(bulletsRef.current.length);

    // Unified, smooth firing cadence for Space or LMB hold
    const currentTime = Date.now();
    const isFiring = keys.Space || isMouseDownRef.current;
    if (
      isFiring &&
      currentTime - lastShotTimeRef.current >= BULLET_FIRE_RATE &&
      bulletsRef.current.length < MAX_BULLETS
    ) {
      bulletsRef.current.push(new Bullet(ship.x, ship.y, ship.angle));
      lastShotTimeRef.current = currentTime;
      setBulletCount(bulletsRef.current.length);
    }

    // Collisions
    let asteroidsToRemove = [];
    let bulletsToRemove = [];
    let newAsteroids = [];

    bulletsRef.current.forEach((bullet, bi) => {
      asteroidsRef.current.forEach((asteroid, ai) => {
        if (checkCollision(bullet, asteroid)) {
          if (!bulletsToRemove.includes(bi)) bulletsToRemove.push(bi);
          if (!asteroidsToRemove.includes(ai)) asteroidsToRemove.push(ai);
          newAsteroids.push(...asteroid.split());
          scoreRef.current += SCORE_PER_ASTEROID;
          addXp(XP_PER_ASTEROID);
        }
      });
    });

    // Remove collided items (iterate backwards to avoid index issues)
    bulletsToRemove.sort((a, b) => b - a).forEach(index => {
      bulletsRef.current.splice(index, 1);
    });
    asteroidsToRemove.sort((a, b) => b - a).forEach(index => {
      asteroidsRef.current.splice(index, 1);
    });

    // Add new asteroids from splits
    asteroidsRef.current.push(...newAsteroids);

    // Ship collision
    let shipCollisionIndex = -1;
    asteroidsRef.current.forEach((asteroid, ai) => {
      if (checkCollision(shipRef.current, asteroid)) {
        livesRef.current -= 1;
        if (livesRef.current <= 0) gameOverRef.current = true;
        shipRef.current = new Ship(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
        shipCollisionIndex = ai;
      }
    });

    // Remove the asteroid that hit the ship
    if (shipCollisionIndex >= 0) {
      asteroidsRef.current.splice(shipCollisionIndex, 1);
    }

    // Level-up effect update
    levelUpEffectRef.current.update();
    stageClearEffectRef.current.update();
    hyperSpaceJumpEffectRef.current.update();
    hyperSpaceJumpEffectRef.current.updateStars(starsRef.current);

    // Update asteroid counts and check for stage clear
    updateAsteroidCounts();
  }, [
    gameOverRef,
    gameStartedRef,
    isPausedRef,
    cameraRef,
    canvasWidthRef,
    canvasHeightRef,
    keysRef,
    shipRef,
    mouseScreenRef,
    mousePositionRef,
    asteroidsRef,
    bulletsRef,
    setBulletCount,
    isMouseDownRef,
    lastShotTimeRef,
    scoreRef,
    livesRef,
    addXp,
    levelUpEffectRef,
    stageClearEffectRef,
    hyperSpaceJumpEffectRef,
    starsRef,
    updateAsteroidCounts,
  ]);

  return { update };
}
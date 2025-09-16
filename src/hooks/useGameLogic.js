import { useCallback, useRef } from 'react';
import { Bullet } from '../components/Bullet.js';
import { Ship } from '../components/Ship.js';
import { checkCollision, wrapPosition } from '../utils/collision.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, BULLET_FIRE_RATE, MAX_BULLETS,
         SHIP_DECELERATION, SHIP_FRICTION, XP_PER_ASTEROID, SCORE_PER_ASTEROID,
         WORLD_WIDTH, WORLD_HEIGHT, DEATH_PAUSE_MS } from '../utils/constants.js';

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
  deathExplosionRef,
  starsRef,
  updateAsteroidCounts,
}, options = {}) {
  const { onLifeLost } = options;
  const deathPauseUntilRef = useRef(0);

  const update = useCallback(() => {
    if (gameOverRef.current || !gameStartedRef.current || isPausedRef.current) return;

    // Capture time once per tick
    const nowMs = performance.now();

    // Short-circuit during death pause
    if (nowMs < deathPauseUntilRef.current) {
      return; // skip physics, input, and collisions this tick
    }

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

    // Calculate angle to mouse crosshair (unless hyperspace jump is active)
    if (!hyperSpaceJumpEffectRef.current.active || hyperSpaceJumpEffectRef.current.phase === 'waiting') {
      const dx = mousePos.x - ship.x;
      const dy = mousePos.y - ship.y;
      ship.angle = Math.atan2(dy, dx);
    }

    // W/S movement controls (disabled during hyperspace jump except waiting phase)
    if (keys.KeyW && (!hyperSpaceJumpEffectRef.current.active || hyperSpaceJumpEffectRef.current.phase === 'waiting')) {
      ship.vx += Math.cos(ship.angle) * ship.speed;
      ship.vy += Math.sin(ship.angle) * ship.speed;
    }

    // Apply velocity and friction
    ship.x += ship.vx;
    ship.y += ship.vy;

    // S key brakes (slows down to zero, no reverse) - disabled during hyperspace jump except waiting phase
    if (!hyperSpaceJumpEffectRef.current.active || hyperSpaceJumpEffectRef.current.phase === 'waiting') {
      if (keys.KeyS) {
        ship.vx *= SHIP_DECELERATION;
        ship.vy *= SHIP_DECELERATION;
      } else {
        ship.vx *= SHIP_FRICTION;
        ship.vy *= SHIP_FRICTION;
      }
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

    // Ship collision handling with invulnerability and death pause
    let shipCollisionIndex = -1;

    if (!shipRef.current.isInvulnerable(nowMs)) {
      for (let ai = 0; ai < asteroidsRef.current.length; ai += 1) {
        const asteroid = asteroidsRef.current[ai];
        if (checkCollision(shipRef.current, asteroid)) {
          // Trigger death explosion effect
          deathExplosionRef.current.trigger(
            shipRef.current.x,
            shipRef.current.y,
            () => {
              // Respawn callback
              shipRef.current.resetKinematics(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
              shipRef.current.setInvulnerableFrom(performance.now());
            },
            shipRef
          );

          // life loss
          livesRef.current -= 1;
          deathPauseUntilRef.current = nowMs + DEATH_PAUSE_MS;
          if (typeof onLifeLost === 'function') {
            onLifeLost(DEATH_PAUSE_MS);
          }
          if (livesRef.current <= 0) {
            gameOverRef.current = true;
          }

          shipCollisionIndex = ai;
          break; // stop after first hit
        }
      }
    }

    // remove the asteroid that hit the ship
    if (shipCollisionIndex >= 0) {
      asteroidsRef.current.splice(shipCollisionIndex, 1);
    }

    // Effects update
    levelUpEffectRef.current.update();
    stageClearEffectRef.current.update();
    hyperSpaceJumpEffectRef.current.update();
    hyperSpaceJumpEffectRef.current.updateStars(starsRef.current);
    deathExplosionRef.current.update();

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
    deathExplosionRef,
    starsRef,
    updateAsteroidCounts,
    onLifeLost,
  ]);

  return { update };
}
import { useCallback, useRef } from 'react';
import { Bullet } from '../components/Bullet.js';
import { Ship } from '../components/Ship.js';
import { Asteroid } from '../components/Asteroid.js';
import { checkCollision, wrapPosition } from '../utils/collision.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, BULLET_FIRE_RATE, MAX_BULLETS,
         SHIP_DECELERATION, SHIP_FRICTION,
         WORLD_WIDTH, WORLD_HEIGHT, DEATH_PAUSE_MS,
         ASTEROID_SPEED, ASTEROID_SIZE_LARGE,
         SURVIVAL_SPEED_LIMIT_MULTIPLIER, SURVIVAL_SPEED_CURVE_TAU } from '../utils/constants.js';

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
  livesRef,
  spawnPickups,
  updatePickups,
  levelUpEffectRef,
  stageClearEffectRef,
  hyperSpaceJumpEffectRef,
  deathExplosionRef,
  starsRef,
  updateAsteroidCounts,
  modeRef,
  survivalStateRef,
}, options = {}) {
  const { onLifeLost } = options;
  const deathPauseUntilRef = useRef(0);

  const spawnSurvivalAsteroid = useCallback((speedMultiplier = 1) => {
    const margin = 200;
    const edge = Math.floor(Math.random() * 4);
    let x;
    let y;
    switch (edge) {
      case 0:
        x = Math.random() * WORLD_WIDTH;
        y = -margin;
        break;
      case 1:
        x = Math.random() * WORLD_WIDTH;
        y = WORLD_HEIGHT + margin;
        break;
      case 2:
        x = -margin;
        y = Math.random() * WORLD_HEIGHT;
        break;
      default:
        x = WORLD_WIDTH + margin;
        y = Math.random() * WORLD_HEIGHT;
        break;
    }

    const asteroid = new Asteroid(x, y, ASTEROID_SIZE_LARGE);
    const target = shipRef.current ? { x: shipRef.current.x, y: shipRef.current.y } : { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 };
    const dx = target.x - x;
    const dy = target.y - y;
    const distance = Math.hypot(dx, dy) || 1;
    const speed = ASTEROID_SPEED * speedMultiplier;
    asteroid.vx = (dx / distance) * speed;
    asteroid.vy = (dy / distance) * speed;
    asteroidsRef.current.push(asteroid);
    updateAsteroidCounts();
  }, [asteroidsRef, shipRef, updateAsteroidCounts]);

  const update = useCallback(() => {
    // Allow death explosion to continue updating even during game over
    if (gameOverRef.current) {
      deathExplosionRef.current.update();
      return;
    }
    if (!gameStartedRef.current || isPausedRef.current) return;

    // Capture time once per tick
    const nowMs = performance.now();

    // During death pause, only update death explosion effect
    if (nowMs < deathPauseUntilRef.current) {
      // Keep updating death explosion during pause
      deathExplosionRef.current.update();
      return; // skip physics, input, and collisions this tick
    }

    if (modeRef?.current === 'survival') {
      const state = survivalStateRef.current;
      const interval = state?.spawnIntervalMs ?? 2000;
      if (!state.lastSpawnMs) {
        state.lastSpawnMs = nowMs;
      }
      if (nowMs - state.lastSpawnMs >= interval) {
        state.lastSpawnMs = nowMs;
        state.spawnCount = (state.spawnCount ?? 0) + 1;
        const progress = 1 - Math.exp(-(state.spawnCount) / SURVIVAL_SPEED_CURVE_TAU);
        const multiplier = 1 + (SURVIVAL_SPEED_LIMIT_MULTIPLIER - 1) * progress;
        spawnSurvivalAsteroid(multiplier);
        state.speedMultiplier = multiplier;
      }
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
          spawnPickups(asteroid.x, asteroid.y);
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
          const isGameOver = livesRef.current <= 1; // Check if this death causes game over
          deathExplosionRef.current.trigger(
            shipRef.current.x,
            shipRef.current.y,
            () => {
              // Respawn callback
              shipRef.current.resetKinematics(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
              shipRef.current.setInvulnerableFrom(performance.now());
            },
            shipRef,
            isGameOver // Pass the flag
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

    updatePickups(shipRef.current);

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
    livesRef,
    spawnPickups,
    updatePickups,
    levelUpEffectRef,
    stageClearEffectRef,
    hyperSpaceJumpEffectRef,
    deathExplosionRef,
    starsRef,
    updateAsteroidCounts,
    modeRef,
    survivalStateRef,
    spawnSurvivalAsteroid,
    onLifeLost,
  ]);

  return { update };
}

import { checkCollision, wrapPosition } from '../utils/collision';
import { Bullet } from '../components/Bullet';
import { WEAPON_CONFIG, SHIP_CONFIG, SCORING_CONFIG, CANVAS_CONFIG } from '../utils/constants';

const { BULLET_FIRE_RATE, MAX_BULLETS } = WEAPON_CONFIG;
const { SHIP_FRICTION, SHIP_DECELERATION } = SHIP_CONFIG;
const { SCORE_PER_ASTEROID, XP_PER_ASTEROID } = SCORING_CONFIG;
const { CANVAS_WIDTH, CANVAS_HEIGHT } = CANVAS_CONFIG;

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const updateGame = (deathEffectRef, livesRef, gameOverRef, stopTimer, setUiState, stageRef, levelRef, scoreRef, elapsedTimeRef, gameStartedRef, isPausedRef, deathSequenceActiveRef, cameraRef, keysRef, shipRef, canvasWidthRef, canvasHeightRef, mouseScreenRef, mousePositionRef, asteroidsRef, bulletsRef, setBulletCount, isMouseDownRef, lastShotTimeRef, addXp, updateAsteroidCounts, pauseStartRef, levelUpEffectRef, stageClearEffectRef, hyperSpaceJumpEffectRef, starsRef) => {
  // ALWAYS update death effect, even during pause
  if (deathEffectRef.current.active) {
    deathEffectRef.current.update();
  }

  // Check for game over after death effect completes
  if (deathEffectRef.current.isDone() && livesRef.current <= 0 && !gameOverRef.current) {
    deathSequenceActiveRef.current = false; // Unpause for game over screen
    gameOverRef.current = true;
    stopTimer();
    setUiState(prev => ({ 
      ...prev, 
      gameOver: true,
      finalStats: {
        wave: stageRef.current,
        level: levelRef.current,
        score: scoreRef.current,
        timeString: formatTime(elapsedTimeRef.current)
      }
    }));
    deathEffectRef.current.reset();
  }

  // Now check pause conditions (but exclude death effect from the check)
  if (gameOverRef.current || !gameStartedRef.current || isPausedRef.current || deathSequenceActiveRef.current) return;

  // Update camera zoom
  const camera = cameraRef.current;
  camera.updateZoom();

  // Update ship - aims at crosshair, moves with W/S
  const keys = keysRef.current;
  const ship = shipRef.current;

  if (deathEffectRef.current.active) {
    // Skip ship update during death effect
  } else {
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
  }

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

  // Ship collision - only check if not invulnerable and not in death sequence
  if (!deathSequenceActiveRef.current && shipRef.current && !shipRef.current.invulnerable) {
    let shipCollisionIndex = -1;
    let shipCollisionSplits = [];

    asteroidsRef.current.forEach((asteroid, ai) => {
      if (checkCollision(shipRef.current, asteroid)) {
        livesRef.current -= 1;
        shipCollisionSplits = asteroid.split();
        shipCollisionIndex = ai;

        // Pause game immediately
        deathSequenceActiveRef.current = true;
        pauseStartRef.current = Date.now(); // Track when pause started

        // Trigger death effect
        deathEffectRef.current.trigger(shipRef.current.x, shipRef.current.y);

        if (livesRef.current > 0) {
          // Show death overlay after explosion
          setTimeout(() => {
            setUiState(prev => ({ 
              ...prev, 
              showDeathOverlay: true,
              lives: livesRef.current
            }));
          }, 1500);
        }
      }
    });

    // Remove asteroid and add splits
    if (shipCollisionIndex >= 0) {
      asteroidsRef.current.splice(shipCollisionIndex, 1);
      asteroidsRef.current.push(...shipCollisionSplits);
    }
  }

  // Update invulnerability
  if (shipRef.current && shipRef.current.invulnerable) {
    if (Date.now() > shipRef.current.invulnerableUntil) {
      shipRef.current.invulnerable = false;
    }
  }

  // Level-up effect update
  levelUpEffectRef.current.update();
  stageClearEffectRef.current.update();
  hyperSpaceJumpEffectRef.current.update();
  hyperSpaceJumpEffectRef.current.updateStars(starsRef.current);

  // Update asteroid counts for active tracking
  updateAsteroidCounts();
};

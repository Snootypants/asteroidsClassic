import { CANVAS_CONFIG, WORLD_CONFIG, SHIP_CONFIG, WEAPON_CONFIG, 
         ASTEROID_CONFIG, SCORING_CONFIG } from '../utils/constants.js';
import { checkCollision, wrapPosition } from '../utils/collision.js';
import { Bullet } from './Bullet.js';

export class GameCore {
  constructor(refs, callbacks) {
    this.refs = refs;
    this.callbacks = callbacks;
  }

  updateShip() {
    const { shipRef, keysRef, cameraRef, mousePositionRef, 
            mouseScreenRef, canvasWidthRef, canvasHeightRef, 
            deathEffectRef } = this.refs;
    
    if (deathEffectRef.current.active) {
      // Skip ship update during death effect
      return;
    }
    
    const camera = cameraRef.current;
    const ship = shipRef.current;
    const keys = keysRef.current;
    
    // Reproject last known screen mouse into world space even if mouse is idle.
    // This prevents the crosshair from becoming stale when the camera moves.
    const canvasWidth = canvasWidthRef.current || CANVAS_CONFIG.WIDTH;
    const canvasHeight = canvasHeightRef.current || CANVAS_CONFIG.HEIGHT;
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
      ship.vx *= SHIP_CONFIG.DECELERATION;
      ship.vy *= SHIP_CONFIG.DECELERATION;
    } else {
      ship.vx *= SHIP_CONFIG.FRICTION;
      ship.vy *= SHIP_CONFIG.FRICTION;
    }
    wrapPosition(ship); // World wrapping

    // Update camera to follow ship
    camera.followShip(ship.x, ship.y, canvasWidth, canvasHeight);
  }

  updateBullets() {
    const { bulletsRef, keysRef, isMouseDownRef, lastShotTimeRef, 
            shipRef } = this.refs;
    
    // Update existing bullets
    bulletsRef.current.forEach((bullet) => {
      bullet.update();
      wrapPosition(bullet); // World wrapping
    });
    bulletsRef.current = bulletsRef.current.filter((bullet) => !bullet.isExpired());
    
    // Fire new bullets - Unified, smooth firing cadence for Space or LMB hold
    const currentTime = Date.now();
    const isFiring = keysRef.current.Space || isMouseDownRef.current;
    
    if (isFiring && 
        currentTime - lastShotTimeRef.current >= WEAPON_CONFIG.BULLET_FIRE_RATE &&
        bulletsRef.current.length < WEAPON_CONFIG.MAX_BULLETS) {
      const ship = shipRef.current;
      bulletsRef.current.push(new Bullet(ship.x, ship.y, ship.angle));
      lastShotTimeRef.current = currentTime;
    }
    
    this.callbacks.onBulletCountChange(bulletsRef.current.length);
  }

  updateAsteroids() {
    const { asteroidsRef } = this.refs;
    asteroidsRef.current.forEach((asteroid) => {
      asteroid.update();
      wrapPosition(asteroid); // World wrapping
    });
  }

  checkCollisions() {
    // Bullet-asteroid collisions
    this.checkBulletAsteroidCollisions();
    
    // Ship-asteroid collisions
    this.checkShipAsteroidCollisions();
    
    // Update invulnerability
    this.updateInvulnerability();
  }

  checkBulletAsteroidCollisions() {
    const { bulletsRef, asteroidsRef, scoreRef } = this.refs;
    let asteroidsToRemove = [];
    let bulletsToRemove = [];
    let newAsteroids = [];

    bulletsRef.current.forEach((bullet, bi) => {
      asteroidsRef.current.forEach((asteroid, ai) => {
        if (checkCollision(bullet, asteroid)) {
          if (!bulletsToRemove.includes(bi)) bulletsToRemove.push(bi);
          if (!asteroidsToRemove.includes(ai)) asteroidsToRemove.push(ai);
          newAsteroids.push(...asteroid.split());
          scoreRef.current += SCORING_CONFIG.SCORE_PER_ASTEROID;
          this.callbacks.addXp(SCORING_CONFIG.XP_PER_ASTEROID);
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
  }

  checkShipAsteroidCollisions() {
    const { shipRef, asteroidsRef, livesRef, deathSequenceActiveRef, 
            deathEffectRef, pauseStartRef } = this.refs;
    
    // Ship collision - only check if not invulnerable and not in death sequence
    if (deathSequenceActiveRef.current || !shipRef.current || 
        shipRef.current.invulnerable) return;
    
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
            this.callbacks.onShowDeathOverlay();
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

  updateInvulnerability() {
    const { shipRef } = this.refs;
    if (shipRef.current && shipRef.current.invulnerable) {
      if (Date.now() > shipRef.current.invulnerableUntil) {
        shipRef.current.invulnerable = false;
      }
    }
  }

  updateEffects() {
    const { levelUpEffectRef, stageClearEffectRef, hyperSpaceJumpEffectRef, 
            starsRef } = this.refs;
    
    levelUpEffectRef.current.update();
    stageClearEffectRef.current.update();
    hyperSpaceJumpEffectRef.current.update();
    hyperSpaceJumpEffectRef.current.updateStars(starsRef.current);
  }

  update() {
    // Update camera zoom
    const camera = this.refs.cameraRef.current;
    camera.updateZoom();

    // Update ship - aims at crosshair, moves with W/S
    this.updateShip();

    // Update asteroids
    this.updateAsteroids();

    // Update bullets
    this.updateBullets();

    // Check all collisions
    this.checkCollisions();

    // Update effects
    this.updateEffects();
    
    // Update asteroid counts for active tracking
    this.callbacks.updateAsteroidCounts();
  }
}
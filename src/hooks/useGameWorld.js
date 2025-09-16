import { useRef, useCallback } from 'react';
import { Asteroid } from '../components/Asteroid.js';
import { WORLD_WIDTH, WORLD_HEIGHT, STAR_COUNT, STAR_MIN_BRIGHTNESS, STAR_MAX_BRIGHTNESS,
         STAR_LARGE_THRESHOLD, STAR_MEDIUM_THRESHOLD, STAR_FIELD_MULTIPLIER, STAR_FIELD_SPREAD,
         MIN_PARALLAX, MAX_PARALLAX, INITIAL_ASTEROID_COUNT, XP_LEVEL_BASE, XP_LEVEL_GROWTH,
         ASTEROID_SIZE_LARGE, ASTEROID_SIZE_MEDIUM, ASTEROID_SIZE_SMALL } from '../utils/constants.js';

export function useGameWorld({
  shipRef,
  bulletsRef,
  setBulletCount,
  stageClearEffectRef,
  hyperSpaceJumpEffectRef,
  setUiState,
}) {
  const starsRef = useRef([]);
  const asteroidsRef = useRef([]);
  const asteroidCountsRef = useRef({ large: 0, medium: 0, small: 0 });
  const xpRef = useRef(0);
  const levelRef = useRef(1);
  const stageRef = useRef(1);
  const baseAsteroidCountRef = useRef(INITIAL_ASTEROID_COUNT);
  const stageClearedRef = useRef(false);

  // Generate stars with bell curve distribution
  const generateStarfield = useCallback(() => {
    const stars = [];
    for (let i = 0; i < STAR_COUNT * STAR_FIELD_MULTIPLIER; i++) { // More stars for bigger world
      // Box-Muller transform for normal distribution
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

      // Convert to bell curve centered at 0.5 with std dev of 0.15
      let brightness = 0.5 + z0 * 0.15;
      // Clamp to valid range
      brightness = Math.max(STAR_MIN_BRIGHTNESS, Math.min(STAR_MAX_BRIGHTNESS, brightness));

      stars.push({
        x: Math.random() * WORLD_WIDTH * STAR_FIELD_SPREAD, // Spread beyond world boundaries
        y: Math.random() * WORLD_HEIGHT * STAR_FIELD_SPREAD,
        brightness: brightness,
        size: brightness > STAR_LARGE_THRESHOLD ? 2 : brightness > STAR_MEDIUM_THRESHOLD ? 1.5 : 1,
        parallax: MIN_PARALLAX + Math.random() * (MAX_PARALLAX - MIN_PARALLAX) // Random parallax speed
      });
    }
    starsRef.current = stars;
  }, []);

  // Reusable function to initialize asteroids
  const initializeAsteroids = useCallback((count = INITIAL_ASTEROID_COUNT) => {
    const initialAsteroids = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * WORLD_WIDTH;
      const y = Math.random() * WORLD_HEIGHT;
      initialAsteroids.push(new Asteroid(x, y));
    }
    asteroidsRef.current = initialAsteroids;
  }, []);

  const xpNeededForNextLevel = useCallback((level) => Math.round(XP_LEVEL_BASE * Math.pow(XP_LEVEL_GROWTH, Math.max(0, level - 1))), []);

  const triggerLevelUp = useCallback((newLevel) => {
    levelRef.current = newLevel;
    setUiState(prev => ({ ...prev, level: newLevel }));
  }, [setUiState]);

  const addXp = useCallback((amount) => {
    xpRef.current += amount;

    // Check for level up
    const currentLevel = levelRef.current;
    const requiredXp = xpNeededForNextLevel(currentLevel);

    if (xpRef.current >= requiredXp) {
      const newLevel = currentLevel + 1;
      // Remove used XP for next level calculation
      xpRef.current -= requiredXp;
      triggerLevelUp(newLevel);
    }

    // Update UI
    setUiState(prev => ({ ...prev, xp: xpRef.current }));
  }, [xpNeededForNextLevel, triggerLevelUp, setUiState]);

  const updateAsteroidCounts = useCallback(() => {
    const counts = { large: 0, medium: 0, small: 0 };

    asteroidsRef.current.forEach(asteroid => {
      if (asteroid.size === ASTEROID_SIZE_LARGE) counts.large++;
      else if (asteroid.size === ASTEROID_SIZE_MEDIUM) counts.medium++;
      else if (asteroid.size === ASTEROID_SIZE_SMALL) counts.small++;
    });

    asteroidCountsRef.current = counts;

    // Check if stage is cleared (no asteroids left)
    const totalAsteroids = counts.large + counts.medium + counts.small;
    if (totalAsteroids === 0 && !stageClearedRef.current) {
      stageClearedRef.current = true;
      // Trigger stage clear effect
      stageClearEffectRef.current.trigger();

      // After a delay, start hyperspace jump to next stage
      setTimeout(() => {
        if (shipRef.current && hyperSpaceJumpEffectRef.current) {
          hyperSpaceJumpEffectRef.current.trigger(
            shipRef.current.angle,
            stageRef.current,
            baseAsteroidCountRef.current + Math.floor(stageRef.current * 0.5),
            (stageNumber, asteroidCount) => {
              setTimeout(() => startNewStage(stageNumber, asteroidCount), 100);
            }
          );
          hyperSpaceJumpEffectRef.current.initStarVelocities(starsRef.current);
        }
      }, 2000);
    }
  }, [shipRef, stageClearEffectRef, hyperSpaceJumpEffectRef, starsRef, startNewStage]);

  const startNewStage = useCallback((stageNumber, asteroidCount) => {
    stageRef.current = stageNumber;
    baseAsteroidCountRef.current = asteroidCount;
    stageClearedRef.current = false;

    // Clear bullets
    bulletsRef.current = [];
    setBulletCount(0);

    // Reset and re-center ship with zero velocity
    const ship = shipRef.current;
    if (ship) {
      ship.x = WORLD_WIDTH / 2;
      ship.y = WORLD_HEIGHT / 2;
      ship.vx = 0;
      ship.vy = 0;
    }

    // Initialize new asteroids for the stage
    initializeAsteroids(asteroidCount);

    // Regenerate starfield for variety
    generateStarfield();

    // Update UI stage indicator
    setUiState(prev => ({ ...prev, stage: stageNumber }));
  }, [initializeAsteroids, generateStarfield, bulletsRef, setBulletCount, shipRef, setUiState]);

  return {
    // refs
    starsRef,
    asteroidsRef,
    asteroidCountsRef,
    xpRef,
    levelRef,
    stageRef,
    baseAsteroidCountRef,
    stageClearedRef,
    // functions
    generateStarfield,
    initializeAsteroids,
    xpNeededForNextLevel,
    triggerLevelUp,
    addXp,
    updateAsteroidCounts,
    startNewStage,
  };
}
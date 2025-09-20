import { useRef, useCallback } from 'react';
import { Asteroid } from '../components/Asteroid.js';
import { Pickup } from '../components/Pickup.js';
import { WORLD_WIDTH, WORLD_HEIGHT, STAR_COUNT, STAR_MIN_BRIGHTNESS, STAR_MAX_BRIGHTNESS,
         STAR_LARGE_THRESHOLD, STAR_MEDIUM_THRESHOLD, STAR_FIELD_MULTIPLIER, STAR_FIELD_SPREAD,
         MIN_PARALLAX, MAX_PARALLAX, INITIAL_ASTEROID_COUNT, XP_LEVEL_BASE, XP_LEVEL_GROWTH,
         ASTEROID_SIZE_LARGE, ASTEROID_SIZE_MEDIUM, ASTEROID_SIZE_SMALL,
         XP_PICKUP_VALUE, XP_DROP_WEIGHTS, CURRENCY_DROP_CHANCE, CURRENCY_DROP_WEIGHTS,
         HYPER_JUMP_COUNTDOWN_MS } from '../utils/constants.js';

export function useGameWorld({
  shipRef,
  bulletsRef,
  setBulletCount,
  levelUpEffectRef,
  stageClearEffectRef,
  hyperSpaceJumpEffectRef,
  modeRef,
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
  const currencyRef = useRef(0);
  const pickupsRef = useRef([]);
  const hyperCountdownRef = useRef(0);
  const hyperCountdownIntervalRef = useRef(null);
  const hyperCountdownTimeoutRef = useRef(null);

  const pickCurrencyAmount = useCallback(() => {
    const totalWeight = CURRENCY_DROP_WEIGHTS.reduce((sum, entry) => sum + entry.weight, 0);
    const roll = Math.random() * totalWeight;
    let cumulative = 0;
    for (const entry of CURRENCY_DROP_WEIGHTS) {
      cumulative += entry.weight;
      if (roll <= cumulative) {
        return entry.amount;
      }
    }
    return CURRENCY_DROP_WEIGHTS[CURRENCY_DROP_WEIGHTS.length - 1].amount;
  }, []);

  const pickXpCount = useCallback(() => {
    const totalWeight = XP_DROP_WEIGHTS.reduce((sum, entry) => sum + entry.weight, 0);
    const roll = Math.random() * totalWeight;
    let cumulative = 0;
    for (const entry of XP_DROP_WEIGHTS) {
      cumulative += entry.weight;
      if (roll <= cumulative) {
        return entry.amount;
      }
    }
    return XP_DROP_WEIGHTS[XP_DROP_WEIGHTS.length - 1].amount;
  }, []);

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
    const ship = shipRef?.current;
    if (levelUpEffectRef?.current?.trigger) {
      const x = ship?.x ?? WORLD_WIDTH / 2;
      const y = ship?.y ?? WORLD_HEIGHT / 2;
      levelUpEffectRef.current.trigger(x, y, newLevel);
    }
    setUiState(prev => ({ ...prev, level: newLevel }));
  }, [setUiState, levelUpEffectRef, shipRef]);

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

  const addCurrency = useCallback((amount) => {
    currencyRef.current += amount;
    setUiState(prev => ({ ...prev, currency: currencyRef.current }));
  }, [setUiState]);

  const spawnPickups = useCallback((x, y) => {
    const jitter = () => {
      const angle = Math.random() * Math.PI * 2;
      const radius = 8 + Math.random() * 16;
      return {
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius,
      };
    };

    const xpCount = pickXpCount();
    for (let i = 0; i < xpCount; i += 1) {
      const xpPos = jitter();
      pickupsRef.current.push(new Pickup({ type: 'xp', value: XP_PICKUP_VALUE, ...xpPos }));
    }

    if (Math.random() < CURRENCY_DROP_CHANCE) {
      const currencyPos = jitter();
      const amount = pickCurrencyAmount();
      pickupsRef.current.push(new Pickup({ type: 'currency', value: amount, ...currencyPos }));
    }
  }, [pickCurrencyAmount, pickXpCount]);

  const clearPickups = useCallback(() => {
    pickupsRef.current = [];
  }, []);

  const clearHyperCountdown = useCallback(() => {
    if (hyperCountdownIntervalRef.current) {
      clearInterval(hyperCountdownIntervalRef.current);
      hyperCountdownIntervalRef.current = null;
    }
    if (hyperCountdownTimeoutRef.current) {
      clearTimeout(hyperCountdownTimeoutRef.current);
      hyperCountdownTimeoutRef.current = null;
    }
    hyperCountdownRef.current = 0;
    setUiState(prev => ({ ...prev, hyperCountdownMs: 0 }));
  }, [setUiState]);

  const updatePickups = useCallback((ship) => {
    if (!ship) return;
    const remaining = [];
    pickupsRef.current.forEach((pickup) => {
      const state = pickup.update(ship);
      if (state === 'collected') {
        if (pickup.type === 'xp') {
          addXp(pickup.value);
        } else if (pickup.type === 'currency') {
          addCurrency(pickup.value);
        }
      } else if (state !== 'expired') {
        remaining.push(pickup);
      }
    });
    pickupsRef.current = remaining;
  }, [addXp, addCurrency]);

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
    clearPickups();
    clearHyperCountdown();
  }, [initializeAsteroids, generateStarfield, bulletsRef, setBulletCount, shipRef, setUiState, clearPickups, clearHyperCountdown]);

  const startHyperCountdown = useCallback(() => {
    clearHyperCountdown();
    hyperCountdownRef.current = HYPER_JUMP_COUNTDOWN_MS;
    setUiState(prev => ({ ...prev, hyperCountdownMs: hyperCountdownRef.current }));

    hyperCountdownIntervalRef.current = setInterval(() => {
      hyperCountdownRef.current = Math.max(0, hyperCountdownRef.current - 50);
      setUiState(prev => ({ ...prev, hyperCountdownMs: hyperCountdownRef.current }));
    }, 50);

    hyperCountdownTimeoutRef.current = setTimeout(() => {
      if (hyperCountdownIntervalRef.current) {
        clearInterval(hyperCountdownIntervalRef.current);
        hyperCountdownIntervalRef.current = null;
      }
      hyperCountdownTimeoutRef.current = null;
      hyperCountdownRef.current = 0;
      setUiState(prev => ({ ...prev, hyperCountdownMs: 0 }));

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
    }, HYPER_JUMP_COUNTDOWN_MS);
  }, [clearHyperCountdown, setUiState, shipRef, hyperSpaceJumpEffectRef, stageRef, baseAsteroidCountRef, starsRef, startNewStage]);

  const updateAsteroidCounts = useCallback(() => {
    const counts = { large: 0, medium: 0, small: 0 };

    asteroidsRef.current.forEach(asteroid => {
      if (asteroid.size === ASTEROID_SIZE_LARGE) counts.large++;
      else if (asteroid.size === ASTEROID_SIZE_MEDIUM) counts.medium++;
      else if (asteroid.size === ASTEROID_SIZE_SMALL) counts.small++;
    });

    asteroidCountsRef.current = counts;

    if (modeRef?.current === 'survival') {
      stageClearedRef.current = false;
      return;
    }

    const totalAsteroids = counts.large + counts.medium + counts.small;
    if (totalAsteroids === 0 && !stageClearedRef.current) {
      stageClearedRef.current = true;
      stageClearEffectRef.current.trigger();
      startHyperCountdown();
    }
  }, [asteroidsRef, asteroidCountsRef, stageClearEffectRef, stageClearedRef, startHyperCountdown, modeRef]);

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
    addCurrency,
    updateAsteroidCounts,
    startNewStage,
    currencyRef,
    pickupsRef,
    spawnPickups,
    updatePickups,
    clearPickups,
    hyperCountdownRef,
    clearHyperCountdown,
  };
}

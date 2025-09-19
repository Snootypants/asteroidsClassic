import { useCallback, useRef } from 'react';
import { Asteroid } from '../components/Asteroid';
import { ASTEROID_CONFIG, WORLD_CONFIG } from '../utils/constants';

const { INITIAL_ASTEROID_COUNT, ASTEROID_SIZE_LARGE, ASTEROID_SIZE_MEDIUM, ASTEROID_SIZE_SMALL } = ASTEROID_CONFIG;
const { WORLD_WIDTH, WORLD_HEIGHT } = WORLD_CONFIG;

export const useAsteroids = (
  gameStartedRef,
  gameOverRef,
  stageClearedRef,
  hyperSpaceJumpEffectRef,
  shipRef,
  stageRef,
  baseAsteroidCountRef,
  bulletsRef,
  setBulletCount,
  generateStarfield,
  starsRef,
  stageClearEffectRef
) => {
  const asteroidsRef = useRef([]);
  const asteroidCountsRef = useRef({ large: 0, medium: 0, small: 0 });

  const initializeAsteroids = useCallback((count = INITIAL_ASTEROID_COUNT) => {
    const initialAsteroids = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * WORLD_WIDTH;
      const y = Math.random() * WORLD_HEIGHT;
      initialAsteroids.push(new Asteroid(x, y));
    }
    asteroidsRef.current = initialAsteroids;
  }, []);

  const startNewStage = useCallback(startNewStageImpl, [
    initializeAsteroids,
    generateStarfield,
    shipRef,
    stageRef,
    baseAsteroidCountRef,
    bulletsRef,
    setBulletCount,
    stageClearedRef
  ]);

  function startNewStageImpl(stageNumber, asteroidCount) {
    stageRef.current = stageNumber;
    baseAsteroidCountRef.current = asteroidCount;
    bulletsRef.current = [];
    setBulletCount(0);
    if (shipRef.current) {
      shipRef.current.x = WORLD_WIDTH / 2;
      shipRef.current.y = WORLD_HEIGHT / 2;
      shipRef.current.vx = 0;
      shipRef.current.vy = 0;
    }
    initializeAsteroids(asteroidCount);
    stageClearedRef.current = false;
    generateStarfield();
  }

  const updateAsteroidCounts = useCallback(() => {
    const counts = { large: 0, medium: 0, small: 0 };
    asteroidsRef.current.forEach(asteroid => {
      if (asteroid.size === ASTEROID_SIZE_LARGE) counts.large++;
      else if (asteroid.size === ASTEROID_SIZE_MEDIUM) counts.medium++;
      else if (asteroid.size === ASTEROID_SIZE_SMALL) counts.small++;
    });
    asteroidCountsRef.current = counts;

    const totalAsteroids = counts.large + counts.medium + counts.small;
    if (
      totalAsteroids === 0 &&
      gameStartedRef.current &&
      !gameOverRef.current &&
      !stageClearedRef.current &&
      !hyperSpaceJumpEffectRef.current.active
    ) {
      stageClearedRef.current = true;
      stageClearEffectRef.current.trigger();
      setTimeout(() => {
        const ship = shipRef.current;
        if (ship) {
          hyperSpaceJumpEffectRef.current.trigger(
            ship.angle,
            stageRef.current,
            baseAsteroidCountRef.current,
            startNewStageImpl
          );
          hyperSpaceJumpEffectRef.current.initStarVelocities(starsRef.current);
        }
      }, 1000);
    }
  }, [
    gameStartedRef,
    gameOverRef,
    stageClearedRef,
    hyperSpaceJumpEffectRef,
    shipRef,
    stageRef,
    baseAsteroidCountRef,
    startNewStageImpl,
    starsRef,
    stageClearEffectRef
  ]);

  return { asteroidsRef, asteroidCountsRef, initializeAsteroids, updateAsteroidCounts, startNewStage };
};

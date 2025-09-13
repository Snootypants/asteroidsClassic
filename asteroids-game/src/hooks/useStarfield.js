import { useCallback } from 'react';
import { STAR_CONFIG, WORLD_CONFIG } from '../utils/constants';

const {
  STAR_COUNT,
  STAR_FIELD_MULTIPLIER,
  STAR_MIN_BRIGHTNESS,
  STAR_MAX_BRIGHTNESS,
  STAR_LARGE_THRESHOLD,
  STAR_MEDIUM_THRESHOLD,
  MIN_PARALLAX,
  MAX_PARALLAX,
} = STAR_CONFIG;

const { WORLD_WIDTH, WORLD_HEIGHT, STAR_FIELD_SPREAD } = WORLD_CONFIG;

export const useStarfield = (starsRef) => {
  const generateStarfield = useCallback(() => {
    const stars = [];
    for (let i = 0; i < STAR_COUNT * STAR_FIELD_MULTIPLIER; i++) {
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

      let brightness = 0.5 + z0 * 0.15;
      brightness = Math.max(STAR_MIN_BRIGHTNESS, Math.min(STAR_MAX_BRIGHTNESS, brightness));

      stars.push({
        x: Math.random() * WORLD_WIDTH * STAR_FIELD_SPREAD,
        y: Math.random() * WORLD_HEIGHT * STAR_FIELD_SPREAD,
        brightness: brightness,
        size: brightness > STAR_LARGE_THRESHOLD ? 2 : brightness > STAR_MEDIUM_THRESHOLD ? 1.5 : 1,
        parallax: MIN_PARALLAX + Math.random() * (MAX_PARALLAX - MIN_PARALLAX),
      });
    }
    starsRef.current = stars;
  }, [starsRef]);

  return { generateStarfield };
};

import { describe, it, expect } from 'vitest';
import { Asteroid } from './Asteroid.js';
import { ASTEROID_SIZE_LARGE, ASTEROID_SIZE_MEDIUM, ASTEROID_SIZE_SMALL } from '../utils/constants.js';

describe('Asteroid.split', () => {
  it('splits large asteroids into two medium ones', () => {
    const a = new Asteroid(0, 0, ASTEROID_SIZE_LARGE);
    const parts = a.split();
    expect(parts).toHaveLength(2);
    expect(parts.every(p => p.size === ASTEROID_SIZE_MEDIUM)).toBe(true);
  });

  it('splits medium asteroids into two small ones', () => {
    const a = new Asteroid(0, 0, ASTEROID_SIZE_MEDIUM);
    const parts = a.split();
    expect(parts).toHaveLength(2);
    expect(parts.every(p => p.size === ASTEROID_SIZE_SMALL)).toBe(true);
  });

  it('does not split small asteroids', () => {
    const a = new Asteroid(0, 0, ASTEROID_SIZE_SMALL);
    expect(a.split()).toHaveLength(0);
  });
});

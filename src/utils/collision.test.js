import { describe, it, expect } from 'vitest';
import { checkCollision, wrapPosition } from './collision.js';

describe('collision utilities', () => {
  it('detects overlapping objects', () => {
    const obj1 = { x: 0, y: 0, size: 5 };
    const obj2 = { x: 7, y: 0, size: 5 };
    expect(checkCollision(obj1, obj2)).toBe(true);
  });

  it('returns false for non-overlapping objects', () => {
    const obj1 = { x: 0, y: 0, size: 5 };
    const obj2 = { x: 20, y: 0, size: 5 };
    expect(checkCollision(obj1, obj2)).toBe(false);
  });

  it('wraps positions around world bounds', () => {
    const obj = { x: -1, y: 101 };
    const wrapped = wrapPosition(obj, 100, 100);
    expect(wrapped.x).toBe(100);
    expect(wrapped.y).toBe(0);
  });
});

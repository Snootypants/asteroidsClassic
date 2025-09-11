import { render, fireEvent, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App.jsx';
import { BULLET_FIRE_RATE, MAX_BULLETS } from './utils/constants.js';

describe('bullet firing limits', () => {
  it('caps bullets at MAX_BULLETS when holding fire', () => {
    vi.useFakeTimers();
    render(<App />);
    const canvas = screen.getByRole('img');
    fireEvent.click(canvas); // start game
    fireEvent.keyDown(window, { code: 'Space' });

    for (let i = 0; i < MAX_BULLETS + 2; i++) {
      act(() => {
        vi.advanceTimersByTime(BULLET_FIRE_RATE);
      });
    }

    const count = Number(screen.getByTestId('bullet-count').textContent);
    expect(count).toBe(MAX_BULLETS);
    vi.useRealTimers();
  });
});

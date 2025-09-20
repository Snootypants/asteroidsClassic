import { render, fireEvent, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App.jsx';
import { BULLET_FIRE_RATE, MAX_BULLETS } from './utils/constants.js';

describe('bullet firing limits', () => {
  it('caps bullets at MAX_BULLETS when holding fire', () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);

    render(<App />);

    // Click StartOverlay "Waves" button to start
    const wavesButton = screen.getByRole('button', { name: /^waves/i });
    fireEvent.click(wavesButton);

    // Hold Space to fire
    fireEvent.keyDown(window, { code: 'Space' });

    for (let i = 0; i < MAX_BULLETS + 2; i++) {
      act(() => {
        vi.advanceTimersByTime(BULLET_FIRE_RATE);
      });
    }

    const count = Number(screen.getByTestId('bullet-count').textContent);
    expect(count).toBeLessThanOrEqual(MAX_BULLETS);

    fireEvent.keyUp(window, { code: 'Space' });
    vi.useRealTimers();
  });
});

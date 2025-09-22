import { useMemo } from 'react';
import {
  HYPER_JUMP_COUNTDOWN_MS,
  COUNTDOWN_COLOR_RANGE_DEGREES,
  COUNTDOWN_SATURATION_PERCENT,
  COUNTDOWN_LIGHTNESS_BASE_PERCENT,
  COUNTDOWN_LIGHTNESS_DELTA,
  COUNTDOWN_BRIGHTNESS_BOOST,
} from '../utils/constants.js';

export function useHyperCountdownDisplay({ mode, hyperCountdownMs }) {
  return useMemo(() => {
    const countdownActive = mode === 'waves' && hyperCountdownMs > 0;
    if (!countdownActive) {
      return {
        countdownActive: false,
        countdownColor: undefined,
        outerSpaceStyle: undefined,
        countdownRatio: 0,
      };
    }

    const countdownRatio = Math.max(0, Math.min(1, hyperCountdownMs / HYPER_JUMP_COUNTDOWN_MS));
    const countdownHue = Math.round(COUNTDOWN_COLOR_RANGE_DEGREES * countdownRatio);
    const countdownLightness =
      COUNTDOWN_LIGHTNESS_BASE_PERCENT + (1 - countdownRatio) * COUNTDOWN_LIGHTNESS_DELTA;
    const countdownColor = `hsl(${countdownHue}, ${COUNTDOWN_SATURATION_PERCENT}%, ${countdownLightness}%)`;
    const brightness = 1 + (1 - countdownRatio) * COUNTDOWN_BRIGHTNESS_BOOST;

    return {
      countdownActive,
      countdownColor,
      outerSpaceStyle: { filter: `brightness(${brightness})` },
      countdownRatio,
    };
  }, [mode, hyperCountdownMs]);
}

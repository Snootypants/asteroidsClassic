import { useCallback, useMemo, useRef, useState } from 'react';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../utils/constants.js';

const STAT_OPTIONS = [
  { key: 'fps', label: 'FPS' },
  { key: 'asteroids', label: 'Asteroids Remaining' },
  { key: 'lives', label: 'Lives' },
  { key: 'level', label: 'Player Level' },
  { key: 'xp', label: 'XP Progress' },
  { key: 'currency', label: 'Currency' },
  { key: 'wave', label: 'Wave / Mode' },
  { key: 'hyper', label: 'Hyper Countdown' },
  { key: 'bullets', label: 'Active Bullets' },
];

const FPS_SAMPLE_WINDOW_MS = 500;
const MS_PER_SECOND = 1000;

const createInitialSelections = () => {
  const entries = STAT_OPTIONS.map(option => [option.key, false]);
  return Object.fromEntries(entries);
};

export function useTestConsole({
  shipRef,
  deathExplosionRef,
  hyperSpaceJumpEffectRef,
  stageClearEffectRef,
  triggerLevelUp,
  levelRef,
  stageRef,
  baseAsteroidCountRef,
  starsRef,
  startNewStage,
}) {
  const [statSelections, setStatSelections] = useState(createInitialSelections);
  const [frameRate, setFrameRate] = useState(0);
  const frameMetricsRef = useRef({
    frames: 0,
    lastSample: typeof performance !== 'undefined' ? performance.now() : Date.now(),
  });

  const onFrame = useCallback((deltaMs = 0) => {
    frameMetricsRef.current.frames += 1;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();

    if (now - frameMetricsRef.current.lastSample >= FPS_SAMPLE_WINDOW_MS) {
      const elapsed = now - frameMetricsRef.current.lastSample || deltaMs;
      const fps = elapsed > 0 ? Math.round((frameMetricsRef.current.frames * MS_PER_SECOND) / elapsed) : 0;

      frameMetricsRef.current.frames = 0;
      frameMetricsRef.current.lastSample = now;
      setFrameRate(fps);
    }
  }, []);

  const toggleStat = useCallback((key) => {
    setStatSelections(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const effectActions = useMemo(() => {
    const actions = [];

    actions.push({
      key: 'shipExplosion',
      label: 'Ship Explosion',
      description: 'Simulate a player death and respawn.',
      hotkey: '1',
      handler: () => {
        const ship = shipRef.current;
        const deathExplosion = deathExplosionRef.current;

        if (!ship || !deathExplosion) return;

        deathExplosion.trigger(
          ship.x,
          ship.y,
          () => {
            const respawnShip = shipRef.current;
            if (respawnShip) {
              respawnShip.resetKinematics(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
              if (typeof respawnShip.setInvulnerableFrom === 'function') {
                const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
                respawnShip.setInvulnerableFrom(now);
              }
            }
          },
          shipRef
        );
      },
    });

    actions.push({
      key: 'levelUp',
      label: 'Level Up',
      description: 'Play the level-up burst at the ship.',
      hotkey: '2',
      handler: () => {
        if (typeof triggerLevelUp === 'function' && levelRef?.current != null) {
          triggerLevelUp(levelRef.current);
        }
      },
    });

    actions.push({
      key: 'hyperJump',
      label: 'Hyperspace Jump',
      description: 'Run the hyperspace jump sequence instantly.',
      hotkey: '3',
      handler: () => {
        const effect = hyperSpaceJumpEffectRef.current;
        const ship = shipRef.current;

        if (!effect || !ship) return;

        effect.trigger(
          ship.angle,
          stageRef?.current,
          baseAsteroidCountRef?.current,
          startNewStage
        );
        effect.initStarVelocities(starsRef?.current);
      },
    });

    actions.push({
      key: 'stageClear',
      label: 'Stage Clear Banner',
      description: 'Show the stage clear celebration overlay.',
      hotkey: '4',
      handler: () => {
        if (stageClearEffectRef.current?.trigger) {
          stageClearEffectRef.current.trigger();
        }
      },
    });

    return actions;
  }, [
    baseAsteroidCountRef,
    deathExplosionRef,
    hyperSpaceJumpEffectRef,
    levelRef,
    shipRef,
    stageClearEffectRef,
    stageRef,
    startNewStage,
    starsRef,
    triggerLevelUp,
  ]);

  return {
    statOptions: STAT_OPTIONS,
    statSelections,
    toggleStat,
    effectActions,
    frameRate,
    onFrame,
  };
}

export const TEST_CONSOLE_STAT_OPTIONS = STAT_OPTIONS;

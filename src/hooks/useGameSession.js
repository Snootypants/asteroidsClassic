import { useCallback } from 'react';
import { Ship } from '../components/Ship.js';
import { Bullet } from '../components/Bullet.js';
import { WORLD_WIDTH, WORLD_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT, INITIAL_LIVES,
         INITIAL_ASTEROID_COUNT, MAX_BULLETS } from '../utils/constants.js';

export function useGameSession({
  setUiState,
  shipRef,
  isPausedRef,
  bulletsRef,
  setBulletCount,
  canvasRef,
  cameraRef,
  mouseScreenRef,
  mousePositionRef,
  gameStartedRef,
  gameOverRef,
  currencyRef,
  livesRef,
  lastShotTimeRef,
  xpRef,
  levelRef,
  stageRef,
  baseAsteroidCountRef,
  initializeAsteroids,
  generateStarfield,
  clearPickups,
  clearHyperCountdown,
  modeRef,
  survivalStateRef,
  setLastRun,
  formattedTime,
}) {
  const startGame = useCallback(() => {
    gameStartedRef.current = true;
    isPausedRef.current = false;
    setUiState(prev => ({ ...prev, gameStarted: true, gameOver: false, xp: 0, level: 1, currency: 0 }));
    currencyRef.current = 0;
    livesRef.current = INITIAL_LIVES;
    xpRef.current = 0;
    levelRef.current = 1;
    gameOverRef.current = false;
    lastShotTimeRef.current = 0;
    shipRef.current = new Ship(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    bulletsRef.current = [];
    setBulletCount(0);
    stageRef.current = 1;
    baseAsteroidCountRef.current = INITIAL_ASTEROID_COUNT;
    survivalStateRef.current = { lastSpawnMs: 0, speedMultiplier: 1, spawnIntervalMs: 2000 };

    // Reset camera
    const camera = cameraRef.current;
    camera.x = WORLD_WIDTH / 2;
    camera.y = WORLD_HEIGHT / 2;
    camera.zoom = 1;
    camera.targetZoom = 1;

    // Initialize crosshair: seed screen position slightly to the right of center
    const canvas = canvasRef.current;
    const cw = (canvas?.width) || CANVAS_WIDTH;
    const ch = (canvas?.height) || CANVAS_HEIGHT;
    mouseScreenRef.current = { x: cw / 2 + 50, y: ch / 2 };
    const worldPos = cameraRef.current.screenToWorld(mouseScreenRef.current.x, mouseScreenRef.current.y, cw, ch);
    mousePositionRef.current = { x: worldPos.x, y: worldPos.y };

    // Re-initialize asteroids
    clearPickups();
    initializeAsteroids();

    // Regenerate starfield for new game
    generateStarfield();
    clearHyperCountdown();
  }, [
    setUiState, shipRef, bulletsRef, setBulletCount, cameraRef, canvasRef,
    mouseScreenRef, mousePositionRef, gameStartedRef, isPausedRef, gameOverRef,
    currencyRef, livesRef, lastShotTimeRef, xpRef, levelRef, stageRef, baseAsteroidCountRef,
    initializeAsteroids, generateStarfield, clearPickups, clearHyperCountdown, survivalStateRef
  ]);

  const shootBullet = useCallback((bypassLimit = false) => {
    const ship = shipRef.current;
    if (ship && gameStartedRef.current && !gameOverRef.current) {
      if (bypassLimit || bulletsRef.current.length < MAX_BULLETS) {
        bulletsRef.current.push(new Bullet(ship.x, ship.y, ship.angle));
        setBulletCount(bulletsRef.current.length);
      }
    }
  }, [shipRef, gameStartedRef, gameOverRef, bulletsRef, setBulletCount]);

  const handleSelectMode = useCallback((mode) => {
    setUiState(prev => ({ ...prev, mode }));
    if (modeRef) {
      modeRef.current = mode;
    }
    startGame(); // For now both modes start the same gameplay
  }, [setUiState, startGame, modeRef]);

  const handleResume = useCallback(() => {
    setUiState(prev => ({ ...prev, isPaused: false }));
  }, [setUiState]);

  const handleExitToMenu = useCallback(() => {
    // Capture lastRun stats if game was over
    setUiState(prev => {
      if (prev.gameOver) {
        setLastRun({
          level: prev.level,
          wave: stageRef.current,
          time: formattedTime,
          currency: prev.currency
        });
      }
      return { ...prev, isPaused: false, gameStarted: false };
    });

    // Clear gameplay state and return to start menu
    gameStartedRef.current = false;
    gameOverRef.current = false;
    bulletsRef.current = [];
    setBulletCount(0);
    clearPickups();
    clearHyperCountdown();
    if (modeRef) {
      modeRef.current = null;
    }
  }, [gameStartedRef, gameOverRef, bulletsRef, setBulletCount, setUiState, setLastRun, stageRef, formattedTime, clearPickups, clearHyperCountdown, modeRef]);

  return {
    startGame,
    shootBullet,
    handleSelectMode,
    handleResume,
    handleExitToMenu,
  };
}

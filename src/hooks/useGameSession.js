import { useCallback } from 'react';
import { Ship } from '../components/Ship.js';
import { Bullet } from '../components/Bullet.js';
import { WORLD_WIDTH, WORLD_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT, INITIAL_LIVES,
         INITIAL_ASTEROID_COUNT, MAX_BULLETS } from '../utils/constants.js';

export function useGameSession({
  setUiState,
  shipRef,
  bulletsRef,
  setBulletCount,
  canvasRef,
  cameraRef,
  mouseScreenRef,
  mousePositionRef,
  gameStartedRef,
  gameOverRef,
  scoreRef,
  livesRef,
  lastShotTimeRef,
  xpRef,
  levelRef,
  stageRef,
  baseAsteroidCountRef,
  initializeAsteroids,
  generateStarfield,
}) {
  const startGame = () => {
    gameStartedRef.current = true;
    setUiState(prev => ({ ...prev, gameStarted: true, gameOver: false, xp: 0, level: 1 }));
    scoreRef.current = 0;
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
    initializeAsteroids();

    // Regenerate starfield for new game
    generateStarfield();
  };

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
    startGame(); // For now both modes start the same gameplay
  }, [setUiState]);

  const handleResume = useCallback(() => {
    setUiState(prev => ({ ...prev, isPaused: false }));
  }, [setUiState]);

  const handleExitToMenu = useCallback(() => {
    // Clear gameplay state and return to start menu
    gameStartedRef.current = false;
    gameOverRef.current = false;
    bulletsRef.current = [];
    setBulletCount(0);
    // Reset basic UI
    setUiState(prev => ({ ...prev, isPaused: false, gameStarted: false }));
  }, [gameStartedRef, gameOverRef, bulletsRef, setBulletCount, setUiState]);

  return {
    startGame,
    shootBullet,
    handleSelectMode,
    handleResume,
    handleExitToMenu,
  };
}
import { useEffect, useMemo } from 'react';
import { ZOOM_SPEED } from '../utils/constants.js';

export function useGameControls({
  canvasRef,
  keysRef,
  mousePositionRef,
  mouseScreenRef,
  isMouseDownRef,
  isPausedRef,
  testingModeRef,
  shootBullet,
  hyperSpaceJumpEffectRef,
  deathExplosionRef,
  startGame,
  setUiState,
  cameraRef,
  gameStartedRef,
  gameOverRef,
  testingEffectActions,
}) {
  const effectHotkeyMap = useMemo(() => {
    if (!Array.isArray(testingEffectActions)) return {};
    return testingEffectActions.reduce((acc, action) => {
      if (action?.hotkey && typeof action.handler === 'function') {
        acc[`Digit${action.hotkey}`] = action.handler;
      }
      return acc;
    }, {});
  }, [testingEffectActions]);

  // Handle pointer lock and mouse/keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['KeyW', 'KeyS', 'Space', 'Escape', 'Tab', 'Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(e.code)) {
        e.preventDefault();
      }

      keysRef.current[e.code] = true;

      // Handle pause toggle with ESC
      if (e.code === 'Escape' && gameStartedRef.current && !gameOverRef.current) {
        isPausedRef.current = !isPausedRef.current;
        setUiState(prev => ({ ...prev, isPaused: isPausedRef.current }));
      }

      // Toggle testing mode with Shift + Tab
      if (e.code === 'Tab') {
        if (!e.shiftKey) {
          return;
        }
        if (e.repeat) {
          return;
        }
        testingModeRef.current = !testingModeRef.current;
        setUiState(prev => ({ ...prev, testingMode: testingModeRef.current }));
        }

      // Testing mode effect triggers
      if (testingModeRef.current && gameStartedRef.current) {
        const handler = effectHotkeyMap[e.code];
        if (handler) {
          handler();
        }
      }
    };

    const handleKeyUp = (e) => {
      keysRef.current[e.code] = false;
    };

    const handleMouseMove = (e) => {
      if (canvasRef.current && gameStartedRef.current) {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const camera = cameraRef.current;

        // Get mouse position relative to canvas
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        // Persist screen-space position for idle reprojection
        mouseScreenRef.current.x = canvasX;
        mouseScreenRef.current.y = canvasY;

        // Convert canvas coordinates to world coordinates
        const worldPos = camera.screenToWorld(canvasX, canvasY, canvas.width, canvas.height);

        mousePositionRef.current.x = worldPos.x;
        mousePositionRef.current.y = worldPos.y;
      }
    };

    const handleMouseDown = (e) => {
      if (e.button === 0 && gameStartedRef.current && !gameOverRef.current) {
        isMouseDownRef.current = true;
        // fire immediately; update loop will handle steady cadence
        shootBullet(true);
      }
    };

    const handleMouseUp = (e) => {
      if (e.button === 0) {
        isMouseDownRef.current = false;
      }
    };

    const handleWheel = (e) => {
      e.preventDefault();
      const camera = cameraRef.current;
      const zoomDelta = e.deltaY > 0 ? ZOOM_SPEED : -ZOOM_SPEED;
      camera.setZoom(camera.targetZoom + zoomDelta);
    };

    const handleCanvasClick = () => {
      if (!gameStartedRef.current) {
        setUiState(prev => ({ ...prev, mode: prev.mode ?? 'survival' }));
        startGame();
        return;
      }
      if (hyperSpaceJumpEffectRef.current?.phase === 'waiting') {
        hyperSpaceJumpEffectRef.current.startNewStage();
      }
      if (deathExplosionRef.current?.isWaiting()) {
        deathExplosionRef.current.startRespawn();
      }
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('click', handleCanvasClick);
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('wheel', handleWheel);
      if (canvas) {
        canvas.removeEventListener('click', handleCanvasClick);
      }
    };
  }, [
    canvasRef,
    keysRef,
    mousePositionRef,
    mouseScreenRef,
    isMouseDownRef,
    isPausedRef,
    testingModeRef,
    shootBullet,
    hyperSpaceJumpEffectRef,
    deathExplosionRef,
    startGame,
    setUiState,
    cameraRef,
    gameStartedRef,
    gameOverRef,
    effectHotkeyMap,
  ]);
}

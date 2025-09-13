
import { useEffect, useRef } from 'react';
import { CAMERA_CONFIG } from '../utils/constants';

const { ZOOM_SPEED } = CAMERA_CONFIG;

export const useInput = ({
  gameStarted,
  gameOver,
  isPaused,
  testingMode,
  canvasRef,
  cameraRef,
  keysRef,
  mousePositionRef,
  mouseScreenRef,
  isMouseDownRef,
  hyperSpaceJumpEffectRef,
  onPause,
  onToggleTestingMode,
  onTriggerLevelUp,
  onStageClear,
  onHyperSpaceJump,
  onGameOver,
  onDeathEffect,
  onShoot,
  onStartNewStage,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['KeyW', 'KeyS', 'Space', 'Escape', 'Tab', 'Digit1', 'Digit2', 'Digit3'].includes(e.code)) {
        e.preventDefault();
      }

      keysRef.current[e.code] = true;

      if (e.code === 'Escape' && gameStarted && !gameOver) {
        onPause();
      }

      if (e.code === 'Tab') {
        onToggleTestingMode();
      }

      if (testingMode && gameStarted) {
        if (e.code === 'Digit1') onTriggerLevelUp();
        if (e.code === 'Digit2') onStageClear();
        if (e.code === 'Digit3') onHyperSpaceJump();
        if (e.code === 'Digit4') onGameOver();
        if (e.code === 'Digit5') onDeathEffect();
      }
    };

    const handleKeyUp = (e) => {
      keysRef.current[e.code] = false;
    };

    const handleMouseMove = (e) => {
      if (canvasRef.current && gameStarted) {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const camera = cameraRef.current;

        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        mouseScreenRef.current.x = canvasX;
        mouseScreenRef.current.y = canvasY;

        const worldPos = camera.screenToWorld(canvasX, canvasY, canvas.width, canvas.height);
        mousePositionRef.current.x = worldPos.x;
        mousePositionRef.current.y = worldPos.y;
      }
    };

    const handleMouseDown = (e) => {
      if (e.button === 0 && gameStarted && !gameOver) {
        isMouseDownRef.current = true;
        onShoot(true);
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
      if (hyperSpaceJumpEffectRef.current.phase === 'waiting') {
        onStartNewStage();
      }
    };

    if (canvasRef.current) {
      canvasRef.current.addEventListener('click', handleCanvasClick);
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('wheel', handleWheel);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('wheel', handleWheel);
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('click', handleCanvasClick);
      }
    };
  }, [
    gameStarted,
    gameOver,
    isPaused,
    testingMode,
    canvasRef,
    cameraRef,
    keysRef,
    mousePositionRef,
    mouseScreenRef,
    isMouseDownRef,
    hyperSpaceJumpEffectRef,
    onPause,
    onToggleTestingMode,
    onTriggerLevelUp,
    onStageClear,
    onHyperSpaceJump,
    onGameOver,
    onDeathEffect,
    onShoot,
    onStartNewStage,
  ]);
};

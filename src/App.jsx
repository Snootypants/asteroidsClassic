import { useRef, useEffect, useState, useCallback } from 'react';
import { Ship } from './components/Ship.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, CROSSHAIR_SIZE, INITIAL_LIVES, WORLD_WIDTH, WORLD_HEIGHT } from './utils/constants.js';
import { LevelUpEffect } from './effects/LevelUpEffect.js';
import { StageClearEffect } from './effects/StageClearEffect.js';
import { HyperSpaceJumpEffect } from './effects/HyperSpaceJumpEffect.js';
import { Camera } from './utils/camera.js';
import { Minimap } from './components/Minimap.js';
import { useGameWorld } from './hooks/useGameWorld.js';
import { useGameSession } from './hooks/useGameSession.js';
import { useGameControls } from './hooks/useGameControls.js';
import { useGameLogic } from './hooks/useGameLogic.js';
import { useResponsiveLayout } from './hooks/useResponsiveLayout.js';
import { useGameLoop } from './hooks/useGameLoop.js';
import { renderScene, renderMinimap, renderXpBar } from './render/gameRenderer.js';
import HudInfo from './components/HudInfo.jsx';
import PauseOverlay from './components/PauseOverlay.jsx';
import StartOverlay from './components/StartOverlay.jsx';
import './App.css';

function App() {
  const canvasRef = useRef(null);
  const minimapCanvasRef = useRef(null);
  const xpBarCanvasRef = useRef(null);
  const playAreaRef = useRef(null);
  const canvasWidthRef = useRef(CANVAS_WIDTH);
  const canvasHeightRef = useRef(CANVAS_HEIGHT);
  const shipRef = useRef(new Ship(WORLD_WIDTH / 2, WORLD_HEIGHT / 2));
  const cameraRef = useRef(new Camera());
  const bulletsRef = useRef([]);
  const keysRef = useRef({});
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const mouseScreenRef = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 });
  const isMouseDownRef = useRef(false);
  const isPausedRef = useRef(false);
  const testingModeRef = useRef(false);
  const gameStartedRef = useRef(false);
  const gameOverRef = useRef(false);
  const scoreRef = useRef(0);
  const livesRef = useRef(INITIAL_LIVES);
  const lastShotTimeRef = useRef(0);
  const levelUpEffectRef = useRef(new LevelUpEffect());
  const stageClearEffectRef = useRef(new StageClearEffect());
  const hyperSpaceJumpEffectRef = useRef(new HyperSpaceJumpEffect());
  const [uiState, setUiState] = useState({
    score: 0, lives: INITIAL_LIVES, xp: 0, level: 1, gameOver: false,
    gameStarted: false, isPaused: false, testingMode: false, mode: null
  });
  const [bulletCount, setBulletCount] = useState(0);

  const world = useGameWorld({ shipRef, bulletsRef, setBulletCount, stageClearEffectRef, hyperSpaceJumpEffectRef, setUiState });
  const session = useGameSession({
    setUiState, shipRef, bulletsRef, setBulletCount, canvasRef, cameraRef, mouseScreenRef, mousePositionRef,
    gameStartedRef, gameOverRef, scoreRef, livesRef, lastShotTimeRef, xpRef: world.xpRef, levelRef: world.levelRef,
    stageRef: world.stageRef, baseAsteroidCountRef: world.baseAsteroidCountRef,
    initializeAsteroids: world.initializeAsteroids, generateStarfield: world.generateStarfield,
  });

  useGameControls({
    canvasRef, keysRef, mousePositionRef, mouseScreenRef, isMouseDownRef, isPausedRef, testingModeRef,
    shootBullet: session.shootBullet, triggerLevelUp: world.triggerLevelUp, stageClearEffectRef, hyperSpaceJumpEffectRef,
    shipRef, stageRef: world.stageRef, baseAsteroidCountRef: world.baseAsteroidCountRef, starsRef: world.starsRef,
    startNewStage: world.startNewStage, setUiState, cameraRef, gameStartedRef, gameOverRef, levelRef: world.levelRef,
  });

  const { update } = useGameLogic({
    gameOverRef, gameStartedRef, isPausedRef, cameraRef, canvasWidthRef, canvasHeightRef, keysRef, shipRef,
    mouseScreenRef, mousePositionRef, asteroidsRef: world.asteroidsRef, bulletsRef, setBulletCount, isMouseDownRef,
    lastShotTimeRef, scoreRef, livesRef, addXp: world.addXp, levelUpEffectRef, stageClearEffectRef, hyperSpaceJumpEffectRef,
    starsRef: world.starsRef, updateAsteroidCounts: world.updateAsteroidCounts,
  });

  const { layout, metaLayout } = useResponsiveLayout({ canvasRef, minimapCanvasRef, xpBarCanvasRef, playAreaRef, canvasWidthRef, canvasHeightRef });

  useEffect(() => {
    world.initializeAsteroids();
    world.generateStarfield();
  }, [world]);
  const render = useCallback(() => {
    renderScene({
      canvasRef,
      canvasWidthRef,
      canvasHeightRef,
      cameraRef,
      starsRef: world.starsRef,
      shipRef,
      asteroidsRef: world.asteroidsRef,
      bulletsRef,
      mousePositionRef,
      gameStartedRef,
      levelUpEffectRef,
      stageClearEffectRef,
      hyperSpaceJumpEffectRef,
      CROSSHAIR_SIZE,
      renderMinimapFn: () => renderMinimap({
        minimapCanvasRef,
        shipRef,
        asteroidsRef: world.asteroidsRef,
        cameraRef,
        Minimap,
      }),
      renderXpBarFn: () => renderXpBar({
        xpBarCanvasRef,
        uiState,
        xpNeededForNextLevel: world.xpNeededForNextLevel,
      }),
    });
  }, [
    canvasRef,
    canvasWidthRef,
    canvasHeightRef,
    cameraRef,
    world.starsRef,
    shipRef,
    world.asteroidsRef,
    bulletsRef,
    mousePositionRef,
    gameStartedRef,
    levelUpEffectRef,
    stageClearEffectRef,
    hyperSpaceJumpEffectRef,
    minimapCanvasRef,
    xpBarCanvasRef,
    uiState,
    world.xpNeededForNextLevel,
  ]);
  useGameLoop({ update, render, setUiState, scoreRef, livesRef, gameOverRef, xpRef: world.xpRef, levelRef: world.levelRef });

  return (
    <div className="app">
      <div className="play-area" ref={playAreaRef}>
        <canvas
          ref={canvasRef}
          width={1200}
          height={900}
          className="game-canvas"
          role="img"
          aria-label="Asteroids play area"
        />
        <canvas ref={xpBarCanvasRef} className="xpbar-canvas" />
        {!uiState.gameStarted && (
          <StartOverlay onSelect={session.handleSelectMode} />
        )}
        {uiState.gameStarted && !uiState.gameOver && uiState.isPaused && (
          <PauseOverlay
            xp={uiState.xp}
            lives={uiState.lives}
            largeCount={world.asteroidCountsRef.current.large}
            mediumCount={world.asteroidCountsRef.current.medium}
            smallCount={world.asteroidCountsRef.current.small}
            onResume={session.handleResume}
            onExit={session.handleExitToMenu}
          />
        )}
        <canvas
          ref={minimapCanvasRef}
          className="minimap-canvas"
          style={{ bottom: `${layout.minimapBottom}px` }}
        />

        <HudInfo
          lives={uiState.lives}
          level={uiState.level}
          xp={uiState.xp}
          xpNeeded={world.xpNeededForNextLevel(uiState.level)}
          metaLayout={metaLayout}
          bulletCount={bulletCount}
          gameOver={uiState.gameOver}
          gameStarted={uiState.gameStarted}
          onStartGame={session.startGame}
        />
      </div>
      {uiState.testingMode && (
        <div className="testing-mode-indicator">
          Testing Mode ON
        </div>
      )}
    </div>
  );
}

export default App;
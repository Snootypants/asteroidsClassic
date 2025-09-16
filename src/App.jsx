import { useRef, useEffect, useState, useCallback } from 'react';
import { Ship } from './components/Ship.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, CROSSHAIR_SIZE, INITIAL_LIVES, WORLD_WIDTH, WORLD_HEIGHT } from './utils/constants.js';
import { LevelUpEffect } from './effects/LevelUpEffect.js';
import { StageClearEffect } from './effects/StageClearEffect.js';
import { HyperSpaceJumpEffect } from './effects/HyperSpaceJumpEffect.js';
import { DeathExplosion } from './effects/DeathExplosion.js';
import { Camera } from './utils/camera.js';
import { useGameWorld } from './hooks/useGameWorld.js';
import { useGameSession } from './hooks/useGameSession.js';
import { useGameControls } from './hooks/useGameControls.js';
import { useGameLogic } from './hooks/useGameLogic.js';
import { useResponsiveLayout } from './hooks/useResponsiveLayout.js';
import { useGameLoop } from './hooks/useGameLoop.js';
import { useGameTimer } from './hooks/useGameTimer.js';
import { renderScene } from './render/gameRenderer.js';
import PauseOverlay from './components/PauseOverlay.jsx';
import StartOverlay from './components/StartOverlay.jsx';
import LifeLostOverlay from './components/LifeLostOverlay.jsx';
import Hud from './components/Hud.jsx';
import './App.css';

function App() {
  const canvasRef = useRef(null);
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
  const deathExplosionRef = useRef(new DeathExplosion());
  const [uiState, setUiState] = useState({
    score: 0, lives: INITIAL_LIVES, xp: 0, level: 1, gameOver: false,
    gameStarted: false, isPaused: false, testingMode: false, mode: null
  });
  const [bulletCount, setBulletCount] = useState(0);
  const [lifeLostVisible, setLifeLostVisible] = useState(false);

  const world = useGameWorld({ shipRef, bulletsRef, setBulletCount, stageClearEffectRef, hyperSpaceJumpEffectRef, deathExplosionRef, setUiState });
  const session = useGameSession({
    setUiState, shipRef, isPausedRef, bulletsRef, setBulletCount, canvasRef, cameraRef, mouseScreenRef, mousePositionRef,
    gameStartedRef, gameOverRef, scoreRef, livesRef, lastShotTimeRef, xpRef: world.xpRef, levelRef: world.levelRef,
    stageRef: world.stageRef, baseAsteroidCountRef: world.baseAsteroidCountRef,
    initializeAsteroids: world.initializeAsteroids, generateStarfield: world.generateStarfield,
  });

  useGameControls({
    canvasRef, keysRef, mousePositionRef, mouseScreenRef, isMouseDownRef, isPausedRef, testingModeRef,
    shootBullet: session.shootBullet, triggerLevelUp: world.triggerLevelUp, stageClearEffectRef, hyperSpaceJumpEffectRef, deathExplosionRef,
    shipRef, stageRef: world.stageRef, baseAsteroidCountRef: world.baseAsteroidCountRef, starsRef: world.starsRef,
    startNewStage: world.startNewStage, startGame: session.startGame, setUiState, cameraRef, gameStartedRef, gameOverRef, levelRef: world.levelRef,
  });

  const { update } = useGameLogic({
    gameOverRef, gameStartedRef, isPausedRef, cameraRef, canvasWidthRef, canvasHeightRef, keysRef, shipRef,
    mouseScreenRef, mousePositionRef, asteroidsRef: world.asteroidsRef, bulletsRef, setBulletCount, isMouseDownRef,
    lastShotTimeRef, scoreRef, livesRef, addXp: world.addXp, levelUpEffectRef, stageClearEffectRef, hyperSpaceJumpEffectRef, deathExplosionRef,
    starsRef: world.starsRef, updateAsteroidCounts: world.updateAsteroidCounts,
  }, {
    onLifeLost: (ms) => {
      setLifeLostVisible(true);
      window.setTimeout(() => setLifeLostVisible(false), ms);
    }
  });

  const { metaLayout } = useResponsiveLayout({ canvasRef, playAreaRef, canvasWidthRef, canvasHeightRef });

  const { start, pause, reset, formattedTime } = useGameTimer();

  const { initializeAsteroids, generateStarfield } = world;

  useEffect(() => {
    initializeAsteroids();
    generateStarfield();
  }, [initializeAsteroids, generateStarfield]);

  useEffect(() => {
    const active = uiState.mode === 'survival' && uiState.gameStarted && !uiState.isPaused && !uiState.gameOver;
    active ? start() : pause();
  }, [uiState.mode, uiState.gameStarted, uiState.isPaused, uiState.gameOver, start, pause]);

  useEffect(() => {
    if (!uiState.gameStarted || uiState.mode !== 'survival') reset();
  }, [uiState.gameStarted, uiState.mode, reset]);
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
      deathExplosionRef,
      CROSSHAIR_SIZE,
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
    deathExplosionRef,
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
        {!uiState.gameStarted && (
          <StartOverlay onSelect={session.handleSelectMode} />
        )}
        <LifeLostOverlay visible={lifeLostVisible} />
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

        <div data-testid="bullet-count" style={{ display: 'none' }}>{bulletCount}</div>

        {uiState.gameOver && (
          <div style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'white'
          }}>
            <div style={{ textAlign: 'center', marginBottom: 12, fontSize: 24 }}>Game Over</div>
            {uiState.gameStarted && <button onClick={session.startGame}>New Game</button>}
          </div>
        )}
      </div>

      <Hud
        uiState={uiState}
        metaLayout={metaLayout}
        world={world}
        shipRef={shipRef}
        cameraRef={cameraRef}
        formattedTime={formattedTime}
      />
      {uiState.testingMode && (
        <div className="testing-mode-indicator">
          Testing Mode ON
        </div>
      )}
    </div>
  );
}

export default App;
import { useRef, useEffect, useState, useCallback } from 'react';
import { Ship } from './components/Ship.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, CROSSHAIR_SIZE, INITIAL_LIVES, WORLD_WIDTH, WORLD_HEIGHT, HYPER_JUMP_COUNTDOWN_MS } from './utils/constants.js';
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
import HUD from './components/ui/HUD';
import StartScreen from './components/ui/StartScreen';
import GameOverOverlay from './components/ui/GameOverOverlay';
import './App.css';
import './styles/theme.css';
import './styles/ui.css';

const formatCountdown = (ms) => {
  const clamped = Math.max(0, Math.floor(ms));
  const seconds = Math.floor(clamped / 1000);
  const hundredths = Math.floor((clamped % 1000) / 10);
  return `${seconds.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
};

function App() {
  const canvasRef = useRef(null);
  const playAreaRef = useRef(null);
  const canvasWidthRef = useRef(CANVAS_WIDTH);
  const canvasHeightRef = useRef(CANVAS_HEIGHT);
  const minimapCanvasRef = useRef(null);
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
  const livesRef = useRef(INITIAL_LIVES);
  const lastShotTimeRef = useRef(0);
  const levelUpEffectRef = useRef(new LevelUpEffect());
  const stageClearEffectRef = useRef(new StageClearEffect());
  const hyperSpaceJumpEffectRef = useRef(new HyperSpaceJumpEffect());
  const deathExplosionRef = useRef(new DeathExplosion());
  const modeRef = useRef(null);
  const survivalStateRef = useRef({ lastSpawnMs: 0, speedMultiplier: 1, spawnIntervalMs: 2000 });
  const [uiState, setUiState] = useState({
    currency: 0,
    lives: INITIAL_LIVES,
    xp: 0,
    level: 1,
    gameOver: false,
    gameStarted: false,
    isPaused: false,
    testingMode: false,
    mode: null,
    hyperCountdownMs: 0,
  });
  const [bulletCount, setBulletCount] = useState(0);
  const [lastRun, setLastRun] = useState({ level: 1, wave: 1, time: '00:00:00', currency: 0 });

  const world = useGameWorld({ shipRef, bulletsRef, setBulletCount, levelUpEffectRef, stageClearEffectRef, hyperSpaceJumpEffectRef, modeRef, setUiState });
  const { start, pause, reset, formattedTime } = useGameTimer();

  const session = useGameSession({
    setUiState, shipRef, isPausedRef, bulletsRef, setBulletCount, canvasRef, cameraRef, mouseScreenRef, mousePositionRef,
    gameStartedRef, gameOverRef, currencyRef: world.currencyRef, livesRef, lastShotTimeRef, xpRef: world.xpRef, levelRef: world.levelRef,
    stageRef: world.stageRef, baseAsteroidCountRef: world.baseAsteroidCountRef,
    initializeAsteroids: world.initializeAsteroids, generateStarfield: world.generateStarfield,
    clearPickups: world.clearPickups, clearHyperCountdown: world.clearHyperCountdown,
    modeRef,
    survivalStateRef,
    setLastRun, formattedTime,
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
    lastShotTimeRef, livesRef, spawnPickups: world.spawnPickups, updatePickups: world.updatePickups,
    levelUpEffectRef, stageClearEffectRef, hyperSpaceJumpEffectRef, deathExplosionRef,
    starsRef: world.starsRef, updateAsteroidCounts: world.updateAsteroidCounts,
    modeRef,
    survivalStateRef,
  });

  const { metaLayout } = useResponsiveLayout({ canvasRef, playAreaRef, canvasWidthRef, canvasHeightRef });

  const { initializeAsteroids, generateStarfield } = world;

  useEffect(() => {
    initializeAsteroids();
    generateStarfield();
  }, [initializeAsteroids, generateStarfield]);

  useEffect(() => {
    modeRef.current = uiState.mode;
  }, [uiState.mode]);

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
      minimapCanvasRef,
      cameraRef,
      starsRef: world.starsRef,
      shipRef,
      asteroidsRef: world.asteroidsRef,
      pickupsRef: world.pickupsRef,
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
    minimapCanvasRef,
    cameraRef,
    world.starsRef,
    shipRef,
    world.asteroidsRef,
    world.pickupsRef,
    bulletsRef,
    mousePositionRef,
    gameStartedRef,
    levelUpEffectRef,
    stageClearEffectRef,
    hyperSpaceJumpEffectRef,
    deathExplosionRef,
  ]);
  useGameLoop({ update, render, setUiState, currencyRef: world.currencyRef, livesRef, gameOverRef, xpRef: world.xpRef, levelRef: world.levelRef, hyperCountdownRef: world.hyperCountdownRef });

  const countdownActive = uiState.mode === 'waves' && uiState.hyperCountdownMs > 0;
  const countdownRatio = countdownActive ? Math.max(0, Math.min(1, uiState.hyperCountdownMs / HYPER_JUMP_COUNTDOWN_MS)) : 0;
  const countdownColor = countdownActive
    ? `hsl(${Math.round(120 * countdownRatio)}, 85%, ${45 + (1 - countdownRatio) * 20}%)`
    : undefined;
  const outerSpaceStyle = countdownActive
    ? { filter: `brightness(${1 + (1 - countdownRatio) * 0.35})` }
    : undefined;

  return (
    <div className="outerSpace" style={outerSpaceStyle}>
      <div
        ref={playAreaRef}
        className="playfieldFrame"
        style={{
          width: canvasWidthRef.current + 4,
          height: canvasHeightRef.current + 4,
          left: `${metaLayout.playX}px`,
          top: `${metaLayout.playY}px`,
          position: 'absolute'
        }}
      >
        <canvas
          ref={canvasRef}
          width={canvasWidthRef.current}
          height={canvasHeightRef.current}
          className="game-canvas"
          role="img"
          aria-label="Asteroids play area"
        />
      </div>

      <HUD
        xp={uiState.xp}
        xpMax={world.xpNeededForNextLevel(uiState.level)}
        level={uiState.level}
        lives={uiState.lives}
        wave={uiState.mode === 'waves' ? world.stageRef.current : 1}
        time={formattedTime}
        currency={uiState.currency}
        minimapRef={minimapCanvasRef}
        mode={uiState.mode}
      />

      {countdownActive && (
        <div className="hyperCountdownBanner" style={{ color: countdownColor }}>
          <span className="label">Hyper jump in</span>
          <span className="timer mono">{formatCountdown(uiState.hyperCountdownMs)}</span>
        </div>
      )}

      {!uiState.gameStarted && (
        <StartScreen
          onStartWaves={() => session.handleSelectMode('waves')}
          onStartSurvival={() => session.handleSelectMode('survival')}
        />
      )}

      {uiState.gameOver && (
        <GameOverOverlay
          level={lastRun.level}
          wave={lastRun.wave}
          time={lastRun.time}
          currency={lastRun.currency}
          onMainMenu={session.handleExitToMenu}
          onPlayAgain={() => session.startGame()}
        />
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

      {uiState.testingMode && (
        <div className="testing-mode-indicator">Testing Mode ON</div>
      )}

      <div data-testid="bullet-count" style={{ display: 'none' }}>{bulletCount}</div>
    </div>
  );
}

export default App;

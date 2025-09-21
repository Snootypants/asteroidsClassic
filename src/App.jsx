import { useRef, useEffect, useState, useCallback } from 'react';
import { Ship } from './components/Ship.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, CROSSHAIR_SIZE, INITIAL_LIVES, WORLD_WIDTH, WORLD_HEIGHT, HYPER_JUMP_COUNTDOWN_MS, PLAYFIELD_FRAME_BORDER_OFFSET, COUNTDOWN_COLOR_RANGE_DEGREES, COUNTDOWN_SATURATION_PERCENT, COUNTDOWN_LIGHTNESS_BASE_PERCENT, COUNTDOWN_LIGHTNESS_DELTA, COUNTDOWN_BRIGHTNESS_BOOST } from './utils/constants.js';
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
import { formatCountdown } from './utils/time.js';
import PauseOverlay from './components/PauseOverlay.jsx';
import HUD from './components/ui/HUD';
import StartScreen from './components/ui/StartScreen';
import GameOverOverlay from './components/ui/GameOverOverlay';
import TestConsole from './components/ui/TestConsole.jsx';
import DebugStatsDisplay from './components/ui/DebugStatsDisplay.jsx';
import { useTestConsole } from './hooks/useTestConsole.js';
import './App.css';
import './styles/theme.css';
import './styles/ui.css';

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
  const {
    initializeAsteroids,
    generateStarfield,
    currencyRef,
    xpRef,
    levelRef,
    stageRef,
    baseAsteroidCountRef,
    clearPickups,
    clearHyperCountdown,
    startNewStage,
    xpNeededForNextLevel,
    asteroidCountsRef,
    hyperCountdownRef,
    asteroidsRef,
    pickupsRef,
    starsRef,
    spawnPickups,
    updatePickups,
    updateAsteroidCounts,
    triggerLevelUp,
  } = useGameWorld({ shipRef, bulletsRef, setBulletCount, levelUpEffectRef, stageClearEffectRef, hyperSpaceJumpEffectRef, modeRef, setUiState });
  const { start, pause, reset, formattedTime } = useGameTimer();

  const session = useGameSession({
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
  });

  const {
    statOptions,
    statSelections,
    toggleStat: handleToggleDebugStat,
    effectActions,
    frameRate: debugFrameRate,
    onFrame: handleFrameSample,
  } = useTestConsole({
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
  });

  useGameControls({
    canvasRef,
    keysRef,
    mousePositionRef,
    mouseScreenRef,
    isMouseDownRef,
    isPausedRef,
    testingModeRef,
    shootBullet: session.shootBullet,
    hyperSpaceJumpEffectRef,
    deathExplosionRef,
    startGame: session.startGame,
    setUiState,
    cameraRef,
    gameStartedRef,
    gameOverRef,
    testingEffectActions: effectActions,
  });

  const { update } = useGameLogic({
    gameOverRef,
    gameStartedRef,
    isPausedRef,
    cameraRef,
    canvasWidthRef,
    canvasHeightRef,
    keysRef,
    shipRef,
    mouseScreenRef,
    mousePositionRef,
    asteroidsRef,
    bulletsRef,
    setBulletCount,
    isMouseDownRef,
    lastShotTimeRef,
    livesRef,
    spawnPickups,
    updatePickups,
    levelUpEffectRef,
    stageClearEffectRef,
    hyperSpaceJumpEffectRef,
    deathExplosionRef,
    starsRef,
    updateAsteroidCounts,
    modeRef,
    survivalStateRef,
  });

  const { metaLayout } = useResponsiveLayout({ canvasRef, playAreaRef, canvasWidthRef, canvasHeightRef });

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
      starsRef,
      shipRef,
      asteroidsRef,
      pickupsRef,
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
    starsRef,
    shipRef,
    asteroidsRef,
    pickupsRef,
    bulletsRef,
    mousePositionRef,
    gameStartedRef,
    levelUpEffectRef,
    stageClearEffectRef,
    hyperSpaceJumpEffectRef,
    deathExplosionRef,
  ]);
  useGameLoop({
    update,
    render,
    setUiState,
    currencyRef,
    livesRef,
    gameOverRef,
    xpRef,
    levelRef,
    hyperCountdownRef,
    onFrame: handleFrameSample,
  });

  const countdownActive = uiState.mode === 'waves' && uiState.hyperCountdownMs > 0;
  const countdownRatio = countdownActive ? Math.max(0, Math.min(1, uiState.hyperCountdownMs / HYPER_JUMP_COUNTDOWN_MS)) : 0;
  let countdownColor;
  let outerSpaceStyle;

  if (countdownActive) {
    const countdownHue = Math.round(COUNTDOWN_COLOR_RANGE_DEGREES * countdownRatio);
    const countdownLightness = COUNTDOWN_LIGHTNESS_BASE_PERCENT + (1 - countdownRatio) * COUNTDOWN_LIGHTNESS_DELTA;
    countdownColor = `hsl(${countdownHue}, ${COUNTDOWN_SATURATION_PERCENT}%, ${countdownLightness}%)`;
    const brightness = 1 + (1 - countdownRatio) * COUNTDOWN_BRIGHTNESS_BOOST;
    outerSpaceStyle = { filter: `brightness(${brightness})` };
  }
  const xpNeededForCurrentLevel = xpNeededForNextLevel(uiState.level);

  return (
    <div className="outerSpace" style={outerSpaceStyle}>
      <div
        ref={playAreaRef}
        className="playfieldFrame"
        style={{
          width: canvasWidthRef.current + PLAYFIELD_FRAME_BORDER_OFFSET,
          height: canvasHeightRef.current + PLAYFIELD_FRAME_BORDER_OFFSET,
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
        xpMax={xpNeededForCurrentLevel}
        level={uiState.level}
        lives={uiState.lives}
        wave={uiState.mode === 'waves' ? stageRef.current : 1}
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
          largeCount={asteroidCountsRef.current.large}
          mediumCount={asteroidCountsRef.current.medium}
          smallCount={asteroidCountsRef.current.small}
          onResume={session.handleResume}
          onExit={session.handleExitToMenu}
        />
      )}

      <TestConsole
        open={uiState.testingMode}
        effectActions={effectActions}
        statOptions={statOptions}
        statSelections={statSelections}
        onToggleStat={handleToggleDebugStat}
      />

      <DebugStatsDisplay
        visible={uiState.testingMode}
        selections={statSelections}
        frameRate={debugFrameRate}
        asteroidCounts={asteroidCountsRef.current}
        uiState={uiState}
        bulletCount={bulletCount}
        xpRequired={xpNeededForCurrentLevel}
        stageNumber={stageRef.current}
      />

      <div data-testid="bullet-count" style={{ display: 'none' }}>{bulletCount}</div>
    </div>
  );
}

export default App;

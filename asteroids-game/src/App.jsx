import { useRef, useEffect, useState, useCallback } from 'react';
import { Ship } from './components/Ship.js';
import { Asteroid } from './components/Asteroid.js';
import { Bullet } from './components/Bullet.js';
import { checkCollision, wrapPosition } from './utils/collision.js';
import { 
  CANVAS_CONFIG, WORLD_CONFIG, SHIP_CONFIG, WEAPON_CONFIG,
  ASTEROID_CONFIG, SCORING_CONFIG, STAR_CONFIG, CAMERA_CONFIG
} from './utils/constants.js';
import { LevelUpEffect } from './effects/LevelUpEffect.js';
import { StageClearEffect } from './effects/StageClearEffect.js';
import { HyperSpaceJumpEffect } from './effects/HyperSpaceJumpEffect.js';
import { DeathEffect } from './effects/DeathEffect.js';
import { Camera } from './utils/camera.js';
import { renderMinimap } from './components/Minimap.js';
import { renderXpBar } from './components/XpBar.js';
import { GameCore } from './components/GameCore.js';
import { useAsteroids } from './hooks/useAsteroids.js';
import { useInput } from './hooks/useInput.js';
import { useStarfield } from './hooks/useStarfield.js';
import { useTimer } from './hooks/useTimer.js';
import { useGameLoop } from './hooks/useGameLoop.js';
import { updateGame } from './game/gameLogic.js';
import { useGameLayout } from './hooks/useGameLayout.js';
import PauseOverlay from './components/PauseOverlay.jsx';
import StartOverlay from './components/StartOverlay.jsx';
import GameOverOverlay from './components/GameOverOverlay.jsx';
import DeathOverlay from './components/DeathOverlay.jsx';
import './App.css';

function App() {
  const { CANVAS_WIDTH, CANVAS_HEIGHT } = CANVAS_CONFIG;
  const { WORLD_WIDTH, WORLD_HEIGHT } = WORLD_CONFIG;
  const { SHIP_FRICTION, SHIP_DECELERATION } = SHIP_CONFIG;
  const { BULLET_FIRE_RATE, MAX_BULLETS } = WEAPON_CONFIG;
  const { INITIAL_ASTEROID_COUNT, ASTEROID_SIZE_LARGE, ASTEROID_SIZE_MEDIUM, ASTEROID_SIZE_SMALL } = ASTEROID_CONFIG;
  const { SCORE_PER_ASTEROID, INITIAL_LIVES, XP_PER_ASTEROID, XP_LEVEL_BASE, XP_LEVEL_GROWTH } = SCORING_CONFIG;
  const { CROSSHAIR_SIZE } = CAMERA_CONFIG;
  const canvasRef = useRef(null);
  const minimapCanvasRef = useRef(null);
  const xpBarCanvasRef = useRef(null);
  const playAreaRef = useRef(null);
  const shipRef = useRef(new Ship(WORLD_WIDTH / 2, WORLD_HEIGHT / 2));
  const cameraRef = useRef(new Camera());
  const bulletsRef = useRef([]);
  const stageClearedRef = useRef(false);
  const keysRef = useRef({});
  const scoreRef = useRef(0);
  const livesRef = useRef(INITIAL_LIVES);
  const xpRef = useRef(0);
  const levelRef = useRef(1);
  const levelUpEffectRef = useRef(new LevelUpEffect());
  const stageClearEffectRef = useRef(new StageClearEffect());
  const hyperSpaceJumpEffectRef = useRef(new HyperSpaceJumpEffect());
  const deathEffectRef = useRef(new DeathEffect());
  const deathSequenceActiveRef = useRef(false);
  const stageRef = useRef(1);
  const baseAsteroidCountRef = useRef(INITIAL_ASTEROID_COUNT);
  const gameOverRef = useRef(false);
  const gameStartedRef = useRef(false);
  
  const lastShotTimeRef = useRef(0);
  const starsRef = useRef([]);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  // Track the last known mouse position in SCREEN coordinates so we can
  // re-project it into world space every frame even when the mouse is idle
  const mouseScreenRef = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 });
  const isMouseDownRef = useRef(false);
  const isPausedRef = useRef(false);
  const testingModeRef = useRef(false);
  const canvasWidthRef = useRef(CANVAS_WIDTH);
  const canvasHeightRef = useRef(CANVAS_HEIGHT);
  
  // Simplified firing: handled in the main update loop via a single timer
  const [uiState, setUiState] = useState({
    score: 0,
    lives: INITIAL_LIVES,
    xp: 0,
    level: 1,
    gameOver: false,
    gameStarted: false,
    isPaused: false,
    testingMode: false,
    mode: null, // 'waves' | 'survival'
    timeString: '0:00',
    finalStats: null,
    showDeathOverlay: false
  });
  // Layout state for responsive HUD placement
  const [layout, setLayout] = useState({ minimapBottom: -90 });
  const [metaLayout, setMetaLayout] = useState({ playWidth: CANVAS_WIDTH, minimapWidth: 160, leftHudX: 0, rightHudX: CANVAS_WIDTH - 80 });
  const [bulletCount, setBulletCount] = useState(0);

  const { generateStarfield } = useStarfield(starsRef);

  const { asteroidsRef, asteroidCountsRef, initializeAsteroids, updateAsteroidCounts, startNewStage } = useAsteroids(gameStartedRef, gameOverRef, stageClearedRef, hyperSpaceJumpEffectRef, shipRef, stageRef, baseAsteroidCountRef, bulletsRef, setBulletCount, generateStarfield, starsRef, stageClearEffectRef);

  const xpNeededForNextLevel = useCallback((level) => Math.round(XP_LEVEL_BASE * Math.pow(XP_LEVEL_GROWTH, Math.max(0, level - 1))), []);

  const triggerLevelUp = useCallback((newLevel) => {
    const ship = shipRef.current;
    if (!ship) return;
    levelUpEffectRef.current.trigger(ship.x, ship.y, newLevel);
  }, []);

  const addXp = useCallback((amount) => {
    let newXp = xpRef.current + amount;
    let newLevel = levelRef.current;
    let needed = xpNeededForNextLevel(newLevel);
    while (newXp >= needed) {
      newXp -= needed;
      newLevel += 1;
      needed = xpNeededForNextLevel(newLevel);
    }
    xpRef.current = newXp;
    if (newLevel !== levelRef.current) {
      levelRef.current = newLevel;
      triggerLevelUp(newLevel);
    }
  }, [xpNeededForNextLevel, triggerLevelUp]);

  

  // Initialize asteroids and stars
  useEffect(() => {
    initializeAsteroids();

    // Generate initial starfield
    generateStarfield();
  }, [generateStarfield, initializeAsteroids]);

  useInput({
    gameStarted: gameStartedRef.current,
    gameOver: gameOverRef.current,
    isPaused: isPausedRef.current,
    testingMode: testingModeRef.current,
    canvasRef,
    cameraRef,
    keysRef,
    mousePositionRef,
    mouseScreenRef,
    isMouseDownRef,
    hyperSpaceJumpEffectRef,
    onPause: () => {
      isPausedRef.current = !isPausedRef.current;
      setUiState(prev => ({ ...prev, isPaused: isPausedRef.current }));
    },
    onToggleTestingMode: () => {
      testingModeRef.current = !testingModeRef.current;
      setUiState(prev => ({ ...prev, testingMode: testingModeRef.current }));
    },
    onTriggerLevelUp: () => triggerLevelUp(levelRef.current),
    onStageClear: () => stageClearEffectRef.current.trigger(),
    onHyperSpaceJump: () => {
      const ship = shipRef.current;
      if (ship) {
        hyperSpaceJumpEffectRef.current.trigger(
          ship.angle,
          stageRef.current,
          baseAsteroidCountRef.current,
          startNewStage
        );
        hyperSpaceJumpEffectRef.current.initStarVelocities(starsRef.current);
      }
    },
    onGameOver: () => {
      gameOverRef.current = true;
      stopTimer();
      setUiState(prev => ({ 
        ...prev, 
        gameOver: true,
        finalStats: {
          wave: stageRef.current,
          level: levelRef.current,
          score: scoreRef.current,
          timeString: formatTime(elapsedTimeRef.current)
        }
      }));
    },
    onDeathEffect: () => {
      const ship = shipRef.current;
      if (ship) {
        deathEffectRef.current.trigger(ship.x, ship.y);
        livesRef.current = 0;
      }
    },
    onShoot: shootBullet,
    onStartNewStage: () => {
      if (hyperSpaceJumpEffectRef.current.phase === 'waiting') {
        hyperSpaceJumpEffectRef.current.startNewStage();
      }
    },
  });

  const { formatTime, startTimer, stopTimer, elapsedTimeRef, pausedTimeRef } = useTimer(gameStartedRef, gameOverRef, isPausedRef, deathSequenceActiveRef, setUiState);

  const startGame = () => {
    gameStartedRef.current = true;
    setUiState(prev => ({ ...prev, gameStarted: true, gameOver: false, xp: 0, level: 1 }));
    scoreRef.current = 0;
    livesRef.current = INITIAL_LIVES;
    xpRef.current = 0;
    levelRef.current = 1;
    gameOverRef.current = false;
    lastShotTimeRef.current = 0;
    pausedTimeRef.current = 0;
    pauseStartRef.current = 0;
    startTimer();
    shipRef.current = new Ship(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    bulletsRef.current = [];
    setBulletCount(0);
    stageClearedRef.current = false;
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
    
    deathEffectRef.current.reset();
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
  }, []);

  // Removed interval-based continuous shooting; handled in update()

  const handleCanvasClick = () => {
    // Starting is handled by StartOverlay buttons.
    // Here, we only use clicks for stage transitions or gameplay.
    if (!uiState.gameStarted) return;
  };

  const handleSelectMode = useCallback((mode) => {
    setUiState(prev => ({ ...prev, mode }));
    startGame(); // For now both modes start the same gameplay
  }, []);

  const handleResume = useCallback(() => {
    isPausedRef.current = false;
    setUiState(prev => ({ ...prev, isPaused: false }));
  }, []);

  const handlePlayAgain = () => {
    startGame();
  };

  const handleMainMenu = () => {
    handleExitToMenu();
  };

  const handleContinueDeath = () => {
    // Calculate how long we were paused
    if (pauseStartRef.current > 0) {
      pausedTimeRef.current += Date.now() - pauseStartRef.current;
      pauseStartRef.current = 0;
    }
    
    // Hide overlay and unpause game
    setUiState(prev => ({ ...prev, showDeathOverlay: false }));
    deathSequenceActiveRef.current = false;
    
    // Create new ship with invulnerability
    shipRef.current = new Ship(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    shipRef.current.invulnerable = true;
    shipRef.current.invulnerableUntil = Date.now() + 3000; // 3 seconds
    
    // Reset death effect
    deathEffectRef.current.reset();
  };

  const handleExitToMenu = useCallback(() => {
    // Clear gameplay state and return to start menu
    isPausedRef.current = false;
    gameStartedRef.current = false;
    gameOverRef.current = false;
    deathSequenceActiveRef.current = false;
    stopTimer();
    bulletsRef.current = [];
    asteroidsRef.current = [];
    setBulletCount(0);
    // Stop active effects
    levelUpEffectRef.current.active = false;
    stageClearEffectRef.current.active = false;
    hyperSpaceJumpEffectRef.current.active = false;
    // Reset basic UI
    setUiState(prev => ({ ...prev, isPaused: false, gameStarted: false }));
  }, []);

  

  

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return; // jsdom/test environment safeguard
    const canvasWidth = canvasWidthRef.current || CANVAS_WIDTH;
    const canvasHeight = canvasHeightRef.current || CANVAS_HEIGHT;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const camera = cameraRef.current;

    // Draw parallax stars (background) - with hyperspace effect support
    if (hyperSpaceJumpEffectRef.current.active && 
        (hyperSpaceJumpEffectRef.current.phase === 'brighten' || 
         hyperSpaceJumpEffectRef.current.phase === 'streaking')) {
      hyperSpaceJumpEffectRef.current.drawStars(ctx, starsRef.current, camera, canvasWidth, canvasHeight);
    } else {
      starsRef.current.forEach((star) => {
        // Calculate parallax position
        const parallaxX = star.x - camera.x * star.parallax;
        const parallaxY = star.y - camera.y * star.parallax;
        
        const screenPos = camera.worldToScreen(parallaxX, parallaxY, canvasWidth, canvasHeight);
        
        // Only draw if visible (with margin for star wrapping)
        if (screenPos.x >= -50 && screenPos.x <= canvasWidth + 50 && 
            screenPos.y >= -50 && screenPos.y <= canvasHeight + 50) {
          ctx.save();
          // Boost perceived brightness ~20% while clamping to 1.0
          ctx.globalAlpha = Math.min(1, star.brightness * 1.2);
          ctx.fillStyle = 'white';
          ctx.fillRect(screenPos.x, screenPos.y, star.size / camera.zoom, star.size / camera.zoom);
          ctx.restore();
        }
      });
    }

    // Draw ship (with hyperspace fade support) - hide during death effect
    if (!deathEffectRef.current.active && shipRef.current && camera.isVisible(shipRef.current.x, shipRef.current.y, 50, canvasWidth, canvasHeight)) {
      const screenPos = camera.worldToScreen(shipRef.current.x, shipRef.current.y, canvasWidth, canvasHeight);
      ctx.save();
      
      // Apply hyperspace opacity if active
      if (hyperSpaceJumpEffectRef.current.active) {
        ctx.globalAlpha = hyperSpaceJumpEffectRef.current.getShipOpacity();
      }
      
      ctx.translate(screenPos.x, screenPos.y);
      ctx.scale(1/camera.zoom, 1/camera.zoom);
      ctx.translate(-shipRef.current.x, -shipRef.current.y);
      shipRef.current.draw(ctx);
      ctx.restore();
    }
    
    // Draw asteroids (with culling and hyperspace fade)
    asteroidsRef.current.forEach((asteroid) => {
      if (asteroid && camera.isVisible(asteroid.x, asteroid.y, asteroid.size, canvasWidth, canvasHeight)) {
        const screenPos = camera.worldToScreen(asteroid.x, asteroid.y, canvasWidth, canvasHeight);
        ctx.save();
        
        // Apply hyperspace opacity if active
        if (hyperSpaceJumpEffectRef.current.active) {
          ctx.globalAlpha = hyperSpaceJumpEffectRef.current.getAsteroidsOpacity();
        }
        ctx.translate(screenPos.x, screenPos.y);
        ctx.scale(1/camera.zoom, 1/camera.zoom);
        // Draw asteroid using its draw method
        ctx.translate(-asteroid.x, -asteroid.y);
        asteroid.draw(ctx);
        ctx.restore();
      }
    });
    
    // Draw bullets (with culling)
    bulletsRef.current.forEach((bullet) => {
      if (bullet && camera.isVisible(bullet.x, bullet.y, bullet.size, canvasWidth, canvasHeight)) {
        const screenPos = camera.worldToScreen(bullet.x, bullet.y, canvasWidth, canvasHeight);
        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);
        ctx.scale(1/camera.zoom, 1/camera.zoom);
        ctx.translate(-bullet.x, -bullet.y);
        bullet.draw(ctx);
        ctx.restore();
      }
    });

    // Draw crosshair at mouse position
    if (gameStartedRef.current) {
      const mousePos = mousePositionRef.current;
      const screenPos = camera.worldToScreen(mousePos.x, mousePos.y, canvasWidth, canvasHeight);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Horizontal line
      ctx.moveTo(screenPos.x - CROSSHAIR_SIZE, screenPos.y);
      ctx.lineTo(screenPos.x + CROSSHAIR_SIZE, screenPos.y);
      // Vertical line
      ctx.moveTo(screenPos.x, screenPos.y - CROSSHAIR_SIZE);
      ctx.lineTo(screenPos.x, screenPos.y + CROSSHAIR_SIZE);
      ctx.stroke();
    }

    // Render minimap separately
    const minimapCtx = minimapCanvasRef.current?.getContext('2d');
    if (minimapCtx) {
      renderMinimap(minimapCtx, shipRef.current, asteroidsRef.current, cameraRef.current);
    }

    // Render XP bar
    const xpBarCtx = xpBarCanvasRef.current?.getContext('2d');
    if (xpBarCtx) {
      renderXpBar(xpBarCtx, uiState.level, uiState.xp, xpNeededForNextLevel);
    }

    // Draw level-up effects (overlay)
    levelUpEffectRef.current.draw(ctx, camera, canvasWidth, canvasHeight);
    stageClearEffectRef.current.draw(ctx, camera, canvasWidth, canvasHeight);
    hyperSpaceJumpEffectRef.current.draw(ctx, camera, canvasWidth, canvasHeight);
    
    // Draw death effect (after all game objects)
    deathEffectRef.current.draw(ctx, camera, canvasWidth, canvasHeight);
  };


  useGameLoop(() => updateGame(deathEffectRef, livesRef, gameOverRef, stopTimer, setUiState, stageRef, levelRef, scoreRef, elapsedTimeRef, gameStartedRef, isPausedRef, deathSequenceActiveRef, cameraRef, keysRef, shipRef, canvasWidthRef, canvasHeightRef, mouseScreenRef, mousePositionRef, asteroidsRef, bulletsRef, setBulletCount, isMouseDownRef, lastShotTimeRef, addXp, updateAsteroidCounts, pauseStartRef, levelUpEffectRef, stageClearEffectRef, hyperSpaceJumpEffectRef, starsRef), render);

  useGameLayout(playAreaRef, canvasRef, minimapCanvasRef, xpBarCanvasRef, setLayout, setMetaLayout, canvasWidthRef, canvasHeightRef);

  return (
    <div className="app">
      <div className="play-area" ref={playAreaRef}>
        <canvas 
          ref={canvasRef} 
          width={1200} 
          height={900} 
          onClick={handleCanvasClick}
          className="game-canvas"
          role="img"
          aria-label="Asteroids play area"
        />
        {/* XP Bar above play area */}
        <canvas ref={xpBarCanvasRef} className="xpbar-canvas" />
        {uiState.gameStarted && !uiState.gameOver && (
          <div className="timer-display">{uiState.timeString}</div>
        )}
        {!uiState.gameStarted && (
          <StartOverlay onSelect={handleSelectMode} />
        )}
        {uiState.gameStarted && !uiState.gameOver && uiState.isPaused && (
          <PauseOverlay 
            xp={uiState.xp}
            lives={uiState.lives}
            largeCount={asteroidCountsRef.current.large}
            mediumCount={asteroidCountsRef.current.medium}
            smallCount={asteroidCountsRef.current.small}
            onResume={handleResume}
            onExit={handleExitToMenu}
          />
        )}
        {uiState.showDeathOverlay && (
          <DeathOverlay 
            mode={uiState.mode}
            wave={stageRef.current}
            level={uiState.level}
            timeString={uiState.timeString}
            livesRemaining={uiState.lives}
            onContinue={handleContinueDeath}
          />
        )}
        {uiState.gameOver && uiState.finalStats && (
          <GameOverOverlay 
            mode={uiState.mode}
            stats={uiState.finalStats}
            onPlayAgain={handlePlayAgain}
            onMainMenu={handleMainMenu}
          />
        )}
        <canvas 
          ref={minimapCanvasRef}
          className="minimap-canvas"
          style={{ bottom: `${layout.minimapBottom}px` }}
        />
        
        {/* Score/Lives under play area, 50px left of minimap */}
        <div style={{
          position: 'absolute',
          bottom: '-50px',
          left: `${metaLayout.leftHudX}px`,
          transform: 'translateX(-100%)',
          display: 'flex',
          gap: '24px',
          fontSize: '20px',
          fontWeight: 'bold',
          color: 'white'
        }}>
          <div>XP: {uiState.xp}/{xpNeededForNextLevel(uiState.level)}</div>
          <div>Lives: {uiState.lives}</div>
        </div>

        {/* Level indicator under play area, 50px right of minimap */}
        <div style={{
          position: 'absolute',
          bottom: '-50px',
          left: `${metaLayout.rightHudX}px`,
          fontSize: '20px',
          fontWeight: 'bold',
          color: 'white'
        }}>
          Level: {uiState.level}
        </div>
      <div data-testid="bullet-count" style={{ display: 'none' }}>{bulletCount}</div>
    </div>
    <div className="hud-container">
      <div className="hud-right">
        </div>
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

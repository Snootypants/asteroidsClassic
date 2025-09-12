import { useRef, useEffect, useState, useCallback } from 'react';
import { Ship } from './components/Ship.js';
import { Asteroid } from './components/Asteroid.js';
import { Bullet } from './components/Bullet.js';
import { checkCollision, wrapPosition } from './utils/collision.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, BULLET_FIRE_RATE, STAR_COUNT, STAR_MIN_BRIGHTNESS, STAR_MAX_BRIGHTNESS, INITIAL_ASTEROID_COUNT, MAX_BULLETS, CROSSHAIR_SIZE, MOUSE_OFFSET, SCORE_PER_ASTEROID, INITIAL_LIVES, STAR_LARGE_THRESHOLD, STAR_MEDIUM_THRESHOLD, WORLD_WIDTH, WORLD_HEIGHT, ZOOM_SPEED, SHIP_FRICTION, SHIP_DECELERATION, STAR_FIELD_MULTIPLIER, STAR_FIELD_SPREAD, MIN_PARALLAX, MAX_PARALLAX, XP_PER_ASTEROID, XP_LEVEL_BASE, XP_LEVEL_GROWTH, ASTEROID_SIZE_LARGE, ASTEROID_SIZE_MEDIUM, ASTEROID_SIZE_SMALL } from './utils/constants.js';
import { LevelUpEffect } from './effects/LevelUpEffect.js';
import { StageClearEffect } from './effects/StageClearEffect.js';
import { Camera } from './utils/camera.js';
import { Minimap } from './components/Minimap.js';
import PauseOverlay from './components/PauseOverlay.jsx';
import './App.css';

function App() {
  const canvasRef = useRef(null);
  const minimapCanvasRef = useRef(null);
  const xpBarCanvasRef = useRef(null);
  const playAreaRef = useRef(null);
  const shipRef = useRef(new Ship(WORLD_WIDTH / 2, WORLD_HEIGHT / 2));
  const cameraRef = useRef(new Camera());
  const asteroidsRef = useRef([]);
  const bulletsRef = useRef([]);
  const asteroidCountsRef = useRef({ large: 0, medium: 0, small: 0 });
  const stageClearedRef = useRef(false);
  const keysRef = useRef({});
  const scoreRef = useRef(0);
  const livesRef = useRef(INITIAL_LIVES);
  const xpRef = useRef(0);
  const levelRef = useRef(1);
  const levelUpEffectRef = useRef(new LevelUpEffect());
  const stageClearEffectRef = useRef(new StageClearEffect());
  const gameOverRef = useRef(false);
  const gameStartedRef = useRef(false);
  const requestRef = useRef();
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
    testingMode: false
  });
  // Layout state for responsive HUD placement
  const [layout, setLayout] = useState({ minimapBottom: -90 });
  const [metaLayout, setMetaLayout] = useState({ playWidth: CANVAS_WIDTH, minimapWidth: 160, leftHudX: 0, rightHudX: CANVAS_WIDTH - 80 });
  const [bulletCount, setBulletCount] = useState(0);

  // Generate stars with bell curve distribution
  const generateStarfield = useCallback(() => {
    const stars = [];
    for (let i = 0; i < STAR_COUNT * STAR_FIELD_MULTIPLIER; i++) { // More stars for bigger world
      // Box-Muller transform for normal distribution
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      
      // Convert to bell curve centered at 0.5 with std dev of 0.15
      let brightness = 0.5 + z0 * 0.15;
      // Clamp to valid range
      brightness = Math.max(STAR_MIN_BRIGHTNESS, Math.min(STAR_MAX_BRIGHTNESS, brightness));
      
      stars.push({
        x: Math.random() * WORLD_WIDTH * STAR_FIELD_SPREAD, // Spread beyond world boundaries
        y: Math.random() * WORLD_HEIGHT * STAR_FIELD_SPREAD,
        brightness: brightness,
        size: brightness > STAR_LARGE_THRESHOLD ? 2 : brightness > STAR_MEDIUM_THRESHOLD ? 1.5 : 1,
        parallax: MIN_PARALLAX + Math.random() * (MAX_PARALLAX - MIN_PARALLAX) // Random parallax speed
      });
    }
    starsRef.current = stars;
  }, []);

  // Reusable function to initialize asteroids
  const initializeAsteroids = useCallback(() => {
    const initialAsteroids = [];
    for (let i = 0; i < INITIAL_ASTEROID_COUNT; i++) {
      const x = Math.random() * WORLD_WIDTH;
      const y = Math.random() * WORLD_HEIGHT;
      initialAsteroids.push(new Asteroid(x, y));
    }
    asteroidsRef.current = initialAsteroids;
  }, []);

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

  const updateAsteroidCounts = useCallback(() => {
    const counts = { large: 0, medium: 0, small: 0 };
    asteroidsRef.current.forEach(asteroid => {
      if (asteroid.size === ASTEROID_SIZE_LARGE) counts.large++;
      else if (asteroid.size === ASTEROID_SIZE_MEDIUM) counts.medium++;
      else if (asteroid.size === ASTEROID_SIZE_SMALL) counts.small++;
    });
    asteroidCountsRef.current = counts;
    
    // Check for stage clear condition
    const totalAsteroids = counts.large + counts.medium + counts.small;
    if (totalAsteroids === 0 && gameStartedRef.current && !gameOverRef.current && !stageClearedRef.current) {
      stageClearedRef.current = true;
      stageClearEffectRef.current.trigger();
      // Reset flag after effect completes (about 2 seconds)
      setTimeout(() => {
        stageClearedRef.current = false;
      }, 2000);
    }
  }, []);

  // Initialize asteroids and stars
  useEffect(() => {
    initializeAsteroids();

    // Generate initial starfield
    generateStarfield();
  }, [generateStarfield, initializeAsteroids]);

  // Handle pointer lock and mouse/keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['KeyW', 'KeyS', 'Space', 'Escape', 'Tab', 'Digit1', 'Digit2'].includes(e.code)) {
        e.preventDefault();
      }

      keysRef.current[e.code] = true;
      
      // Handle pause toggle with ESC
      if (e.code === 'Escape' && gameStartedRef.current && !gameOverRef.current) {
        isPausedRef.current = !isPausedRef.current;
        setUiState(prev => ({ ...prev, isPaused: isPausedRef.current }));
      }
      
      // Toggle testing mode with Tab
      if (e.code === 'Tab') {
        testingModeRef.current = !testingModeRef.current;
        setUiState(prev => ({ ...prev, testingMode: testingModeRef.current }));
      }
      
      // Testing mode effect triggers
      if (testingModeRef.current && gameStartedRef.current) {
        if (e.code === 'Digit1') {
          triggerLevelUp(levelRef.current);
        }
        if (e.code === 'Digit2') {
          stageClearEffectRef.current.trigger();
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
    };
  }, [triggerLevelUp]);

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
    stageClearedRef.current = false;
    
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
  }, []);

  // Removed interval-based continuous shooting; handled in update()

  const handleCanvasClick = () => {
    if (!uiState.gameStarted) {
      startGame();
    }
  };

  const handleResume = useCallback(() => {
    isPausedRef.current = false;
    setUiState(prev => ({ ...prev, isPaused: false }));
  }, []);

  const update = useCallback(() => {
    if (gameOverRef.current || !gameStartedRef.current || isPausedRef.current) return;

    // Update camera zoom
    const camera = cameraRef.current;
    camera.updateZoom();

    // Update ship - aims at crosshair, moves with W/S
    const keys = keysRef.current;
    const ship = shipRef.current;
    
    // Reproject last known screen mouse into world space even if mouse is idle.
    // This prevents the crosshair from becoming stale when the camera moves.
    const canvasWidth = canvasWidthRef.current || CANVAS_WIDTH;
    const canvasHeight = canvasHeightRef.current || CANVAS_HEIGHT;
    const reproj = camera.screenToWorld(
      mouseScreenRef.current.x,
      mouseScreenRef.current.y,
      canvasWidth,
      canvasHeight
    );
    mousePositionRef.current.x = reproj.x;
    mousePositionRef.current.y = reproj.y;
    const mousePos = mousePositionRef.current;
    
    // Calculate angle to mouse crosshair
    const dx = mousePos.x - ship.x;
    const dy = mousePos.y - ship.y;
    ship.angle = Math.atan2(dy, dx);
    
    // W/S movement controls
    if (keys.KeyW) {
      ship.vx += Math.cos(ship.angle) * ship.speed;
      ship.vy += Math.sin(ship.angle) * ship.speed;
    }
    
    // Apply velocity and friction
    ship.x += ship.vx;
    ship.y += ship.vy;
    
    // S key brakes (slows down to zero, no reverse)
    if (keys.KeyS) {
      ship.vx *= SHIP_DECELERATION;
      ship.vy *= SHIP_DECELERATION;
    } else {
      ship.vx *= SHIP_FRICTION;
      ship.vy *= SHIP_FRICTION;
    }
    wrapPosition(ship); // World wrapping

    // Update camera to follow ship
    camera.followShip(ship.x, ship.y, canvasWidth, canvasHeight);

    // Update asteroids
    asteroidsRef.current.forEach((asteroid) => {
      asteroid.update();
      wrapPosition(asteroid); // World wrapping
    });

    // Update bullets
    bulletsRef.current.forEach((bullet) => {
      bullet.update();
      wrapPosition(bullet); // World wrapping
    });
    bulletsRef.current = bulletsRef.current.filter((bullet) => !bullet.isExpired());
    setBulletCount(bulletsRef.current.length);

    // Unified, smooth firing cadence for Space or LMB hold
    const currentTime = Date.now();
    const isFiring = keys.Space || isMouseDownRef.current;
    if (
      isFiring &&
      currentTime - lastShotTimeRef.current >= BULLET_FIRE_RATE &&
      bulletsRef.current.length < MAX_BULLETS
    ) {
      bulletsRef.current.push(new Bullet(ship.x, ship.y, ship.angle));
      lastShotTimeRef.current = currentTime;
      setBulletCount(bulletsRef.current.length);
    }

    // Collisions
    let asteroidsToRemove = [];
    let bulletsToRemove = [];
    let newAsteroids = [];

    bulletsRef.current.forEach((bullet, bi) => {
      asteroidsRef.current.forEach((asteroid, ai) => {
        if (checkCollision(bullet, asteroid)) {
          if (!bulletsToRemove.includes(bi)) bulletsToRemove.push(bi);
          if (!asteroidsToRemove.includes(ai)) asteroidsToRemove.push(ai);
          newAsteroids.push(...asteroid.split());
          scoreRef.current += SCORE_PER_ASTEROID;
          addXp(XP_PER_ASTEROID);
        }
      });
    });

    // Remove collided items (iterate backwards to avoid index issues)
    bulletsToRemove.sort((a, b) => b - a).forEach(index => {
      bulletsRef.current.splice(index, 1);
    });
    asteroidsToRemove.sort((a, b) => b - a).forEach(index => {
      asteroidsRef.current.splice(index, 1);
    });
    
    // Add new asteroids from splits
    asteroidsRef.current.push(...newAsteroids);

    // Ship collision
    let shipCollisionIndex = -1;
    asteroidsRef.current.forEach((asteroid, ai) => {
      if (checkCollision(shipRef.current, asteroid)) {
        livesRef.current -= 1;
        if (livesRef.current <= 0) gameOverRef.current = true;
        shipRef.current = new Ship(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
        shipCollisionIndex = ai;
      }
    });
    
    // Remove the asteroid that hit the ship
    if (shipCollisionIndex >= 0) {
      asteroidsRef.current.splice(shipCollisionIndex, 1);
    }

    // Level-up effect update
    levelUpEffectRef.current.update();
    stageClearEffectRef.current.update();
    
    // Update asteroid counts for active tracking
    updateAsteroidCounts();
  }, [updateAsteroidCounts]);

  const renderMinimap = useCallback(() => {
    const minimapCanvas = minimapCanvasRef.current;
    if (!minimapCanvas) return;
    const ctx = minimapCanvas.getContext('2d');
    if (!ctx) return; // jsdom/test environment safeguard
    Minimap.draw(ctx, shipRef.current, asteroidsRef.current, cameraRef.current);
  }, []);

  const renderXpBar = useCallback(() => {
    const canvas = xpBarCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    // Solid black box with golden border
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
    // Inner area (black) where progress fills
    const pad = 2;
    const innerW = w - pad * 2;
    const innerH = h - pad * 2;
    ctx.fillStyle = '#000';
    ctx.fillRect(pad, pad, innerW, innerH);
    // Progress
    const needed = xpNeededForNextLevel(uiState.level);
    const pct = Math.max(0, Math.min(1, uiState.xp / needed));
    ctx.fillStyle = '#172fe1';
    ctx.fillRect(pad, pad, Math.floor(innerW * pct), innerH);
    // Ticks at each 1/8
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < 8; i++) {
      const x = Math.floor(innerW * i / 8) + pad;
      ctx.moveTo(x + 0.5, pad);
      ctx.lineTo(x + 0.5, pad + innerH);
    }
    ctx.stroke();
  }, [uiState.level, uiState.xp, xpNeededForNextLevel]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return; // jsdom/test environment safeguard
    const canvasWidth = canvasWidthRef.current || CANVAS_WIDTH;
    const canvasHeight = canvasHeightRef.current || CANVAS_HEIGHT;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const camera = cameraRef.current;

    // Draw parallax stars first (background)
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

    // Draw ship
    if (shipRef.current && camera.isVisible(shipRef.current.x, shipRef.current.y, 50, canvasWidth, canvasHeight)) {
      const screenPos = camera.worldToScreen(shipRef.current.x, shipRef.current.y, canvasWidth, canvasHeight);
      ctx.save();
      ctx.translate(screenPos.x, screenPos.y);
      ctx.scale(1/camera.zoom, 1/camera.zoom);
      ctx.translate(-shipRef.current.x, -shipRef.current.y);
      shipRef.current.draw(ctx);
      ctx.restore();
    }
    
    // Draw asteroids (with culling)
    asteroidsRef.current.forEach((asteroid) => {
      if (asteroid && camera.isVisible(asteroid.x, asteroid.y, asteroid.size, canvasWidth, canvasHeight)) {
        const screenPos = camera.worldToScreen(asteroid.x, asteroid.y, canvasWidth, canvasHeight);
        ctx.save();
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
    renderMinimap();
    // Render XP bar
    renderXpBar();

    // Draw level-up effects (overlay)
    levelUpEffectRef.current.draw(ctx, camera, canvasWidth, canvasHeight);
    stageClearEffectRef.current.draw(ctx, camera, canvasWidth, canvasHeight);
  }, [renderMinimap, renderXpBar]);


  useEffect(() => {
    const loop = () => {
      update();
      render();
      
      // Throttle UI updates - only update when values actually change
      setUiState((prev) => ({
        ...prev,
        score: scoreRef.current,
        lives: livesRef.current,
        gameOver: gameOverRef.current,
        xp: xpRef.current,
        level: levelRef.current,
      }));
      
      requestRef.current = requestAnimationFrame(loop);
    };
    
    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [update, render]);

  // Dynamic layout system with fixed margins and locked aspect ratio
  useEffect(() => {
    const updateGameLayout = () => {
      // Fixed margins
      const MARGIN_LEFT = 100;
      const MARGIN_RIGHT = 100;
      const MARGIN_TOP = 100;
      const MARGIN_BOTTOM = 200;
      
      // Target aspect ratio 1349:817
      const ASPECT_RATIO = 1349 / 817; // ≈1.6514041591
      
      // Minimap sizing: width is a proportion of the play area,
      // height derived from the WORLD aspect ratio so the shape matches the world.
      const MINIMAP_WIDTH_RATIO = 0.3276501112; // keep visual width similar to before
      
      // Calculate available box
      const availableWidth = window.innerWidth - MARGIN_LEFT - MARGIN_RIGHT;
      const availableHeight = window.innerHeight - MARGIN_TOP - MARGIN_BOTTOM;
      
      // Calculate play area size maintaining aspect ratio
      let playWidth, playHeight;
      if (availableWidth / availableHeight > ASPECT_RATIO) {
        // Height-constrained
        playHeight = availableHeight;
        playWidth = Math.round(playHeight * ASPECT_RATIO);
      } else {
        // Width-constrained
        playWidth = availableWidth;
        playHeight = Math.round(playWidth / ASPECT_RATIO);
      }
      
      // Center play area within available box
      const playX = MARGIN_LEFT + Math.round((availableWidth - playWidth) / 2);
      const playY = MARGIN_TOP + Math.round((availableHeight - playHeight) / 2);
      
      // Calculate minimap dimensions using world aspect ratio
      const worldAspect = WORLD_HEIGHT / WORLD_WIDTH; // H/W
      let minimapWidth = Math.round(playWidth * MINIMAP_WIDTH_RATIO);
      let minimapHeight = Math.round(minimapWidth * worldAspect);
      // Guard: if height would exceed a reasonable portion of play area, cap by height and recompute width
      const MAX_MINIMAP_HEIGHT_RATIO = 0.2; // at most 20% of play height
      const maxMinimapHeight = Math.round(playHeight * MAX_MINIMAP_HEIGHT_RATIO);
      if (minimapHeight > maxMinimapHeight) {
        minimapHeight = maxMinimapHeight;
        minimapWidth = Math.round(minimapHeight / worldAspect);
      }
      
      // Apply styles to play area via ref
      const playArea = playAreaRef.current;
      if (playArea) {
        playArea.style.left = `${playX}px`;
        playArea.style.top = `${playY}px`;
        playArea.style.width = `${playWidth}px`;
        playArea.style.height = `${playHeight}px`;
      }
      
      // Update canvas dimensions
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = playWidth - 4; // Account for 2px border on each side
        canvas.height = playHeight - 4;
      }
      
      // Update minimap dimensions and ensure it's positioned within play area
      const minimapCanvas = minimapCanvasRef.current;
      if (minimapCanvas) {
        minimapCanvas.width = minimapWidth;
        minimapCanvas.height = minimapHeight;
        minimapCanvas.style.width = `${minimapWidth}px`;
        minimapCanvas.style.height = `${minimapHeight}px`;
        if (import.meta.env.DEV) {
          console.log('Minimap dimensions set:', minimapWidth, minimapHeight);
        }
      }

      // Keep minimap and stats vertically aligned regardless of window size
      const minimapBottom = -Math.round(minimapHeight * 0.75); // show top 1/4 overlapping play area
      setLayout(prev => ({ ...prev, minimapBottom }));

      // Compute HUD anchor X positions around minimap and expose play/minimap sizes
      const leftHudX = Math.round((playWidth - minimapWidth) / 2 - 50);
      const rightHudX = Math.round((playWidth + minimapWidth) / 2 + 50);
      setMetaLayout({ playWidth, minimapWidth, leftHudX, rightHudX });

      // Size and position XP bar: slightly narrower than play area
      const xpbar = xpBarCanvasRef.current;
      if (xpbar) {
        const xpW = Math.max(100, playWidth - 60);
        const xpH = 15;
        xpbar.width = xpW;
        xpbar.height = xpH;
        xpbar.style.width = `${xpW}px`;
        xpbar.style.height = `${xpH}px`;
        // center horizontally; 1px above play area (handled by CSS top:-16)
        const leftPx = Math.round((playWidth - xpW) / 2);
        xpbar.style.left = `${leftPx}px`;
      }

      // Update constants to match current canvas size for proper rendering
      const updatedCanvasWidth = playWidth - 4;
      const updatedCanvasHeight = playHeight - 4;
      
      // Store current canvas dimensions for use in rendering
      canvasWidthRef.current = updatedCanvasWidth;
      canvasHeightRef.current = updatedCanvasHeight;
      
      // Debug logging
      if (import.meta.env.DEV) {
        console.log('Layout calc:', {
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight,
          availableWidth,
          availableHeight,
          playWidth,
          playHeight,
          playX,
          playY,
          minimapWidth,
          minimapHeight
        });
      }
    };

    // Perform initial layout calculation and set up listeners
    updateGameLayout();

    window.addEventListener('resize', updateGameLayout);
    window.addEventListener('orientationchange', updateGameLayout);

    return () => {
      window.removeEventListener('resize', updateGameLayout);
      window.removeEventListener('orientationchange', updateGameLayout);
    };
  }, []);

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
        {!uiState.gameStarted && (
          <div className="title-overlay">
            <div className="title-text">ASTEROIDS</div>
            <div className="start-instruction">Click to start</div>
          </div>
        )}
        {uiState.gameStarted && !uiState.gameOver && uiState.isPaused && (
          <PauseOverlay 
            xp={uiState.xp}
            lives={uiState.lives}
            largeCount={asteroidCountsRef.current.large}
            mediumCount={asteroidCountsRef.current.medium}
            smallCount={asteroidCountsRef.current.small}
            onResume={handleResume}
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
          {uiState.gameOver && <div className="game-over">Game Over</div>}
          {uiState.gameStarted && uiState.gameOver && (
            <button onClick={startGame} className="game-button">New Game</button>
          )}
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

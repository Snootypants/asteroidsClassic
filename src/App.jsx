import { useRef, useEffect, useState, useCallback } from 'react';
import { Ship } from './components/Ship.js';
import { Asteroid } from './components/Asteroid.js';
import { Bullet } from './components/Bullet.js';
import { checkCollision, wrapPosition } from './utils/collision.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, BULLET_FIRE_RATE, STAR_COUNT, STAR_MIN_BRIGHTNESS, STAR_MAX_BRIGHTNESS, INITIAL_ASTEROID_COUNT, MAX_BULLETS, CONTINUOUS_FIRE_RATE, CROSSHAIR_SIZE, MOUSE_OFFSET, SCORE_PER_ASTEROID, INITIAL_LIVES, STAR_LARGE_THRESHOLD, STAR_MEDIUM_THRESHOLD, WORLD_WIDTH, WORLD_HEIGHT, ZOOM_SPEED, MINIMAP_WIDTH, MINIMAP_HEIGHT, SHIP_FRICTION, SHIP_DECELERATION, STAR_FIELD_MULTIPLIER, STAR_FIELD_SPREAD, MIN_PARALLAX, MAX_PARALLAX } from './utils/constants.js';
import { Camera } from './utils/camera.js';
import { Minimap } from './components/Minimap.js';
import './App.css';

function App() {
  const canvasRef = useRef(null);
  const minimapCanvasRef = useRef(null);
  const shipRef = useRef(new Ship(WORLD_WIDTH / 2, WORLD_HEIGHT / 2));
  const cameraRef = useRef(new Camera());
  const asteroidsRef = useRef([]);
  const bulletsRef = useRef([]);
  const keysRef = useRef({});
  const scoreRef = useRef(0);
  const livesRef = useRef(INITIAL_LIVES);
  const gameOverRef = useRef(false);
  const gameStartedRef = useRef(false);
  const requestRef = useRef();
  const lastShotTimeRef = useRef(0);
  const starsRef = useRef([]);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const isMouseDownRef = useRef(false);
  // Simplified firing: handled in the main update loop via a single timer
  const [uiState, setUiState] = useState({
    score: 0,
    lives: INITIAL_LIVES,
    gameOver: false,
    gameStarted: false
  });
  // Layout state for responsive HUD placement
  const [layout, setLayout] = useState({ minimapBottom: -90 });

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

  // Initialize asteroids and stars
  useEffect(() => {
    initializeAsteroids();

    // Generate initial starfield
    generateStarfield();
  }, [generateStarfield, initializeAsteroids]);

  // Handle pointer lock and mouse/keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['KeyA', 'KeyD', 'KeyW', 'KeyS', 'Space', 'Escape'].includes(e.code)) {
        e.preventDefault();
      }
      
      
      keysRef.current[e.code] = true;
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
    document.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const startGame = () => {
    gameStartedRef.current = true;
    setUiState(prev => ({ ...prev, gameStarted: true, gameOver: false }));
    scoreRef.current = 0;
    livesRef.current = INITIAL_LIVES;
    gameOverRef.current = false;
    lastShotTimeRef.current = 0;
    shipRef.current = new Ship(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    bulletsRef.current = [];
    
    // Reset camera
    const camera = cameraRef.current;
    camera.x = WORLD_WIDTH / 2;
    camera.y = WORLD_HEIGHT / 2;
    camera.zoom = 1;
    camera.targetZoom = 1;
    
    // Initialize mouse position ahead of ship based on initial angle (0)
    mousePositionRef.current = { 
      x: WORLD_WIDTH / 2 + MOUSE_OFFSET, 
      y: WORLD_HEIGHT / 2 
    };
    
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
      }
    }
  }, []);

  // Removed interval-based continuous shooting; handled in update()

  const handleCanvasClick = () => {
    if (!uiState.gameStarted) {
      startGame();
    }
  };

  const update = useCallback(() => {
    if (gameOverRef.current || !gameStartedRef.current) return;

    // Update camera zoom
    const camera = cameraRef.current;
    camera.updateZoom();

    // Update ship - aims at crosshair, moves with W/S
    const keys = keysRef.current;
    const ship = shipRef.current;
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
    const canvasWidth = window.currentCanvasWidth || CANVAS_WIDTH;
    const canvasHeight = window.currentCanvasHeight || CANVAS_HEIGHT;
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

    // Unified, smooth firing cadence for Space or LMB hold
    const currentTime = Date.now();
    const isFiring = keys.Space || isMouseDownRef.current;
    if (isFiring && currentTime - lastShotTimeRef.current >= BULLET_FIRE_RATE) {
      bulletsRef.current.push(new Bullet(ship.x, ship.y, ship.angle));
      lastShotTimeRef.current = currentTime;
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
  }, []);

  const renderMinimap = useCallback(() => {
    const minimapCanvas = minimapCanvasRef.current;
    if (!minimapCanvas) return;
    const ctx = minimapCanvas.getContext('2d');
    Minimap.draw(ctx, shipRef.current, asteroidsRef.current, cameraRef.current);
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const canvasWidth = window.currentCanvasWidth || CANVAS_WIDTH;
    const canvasHeight = window.currentCanvasHeight || CANVAS_HEIGHT;
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
        ctx.globalAlpha = star.brightness;
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
      ctx.rotate(shipRef.current.angle);
      // Draw ship triangle
      const size = shipRef.current.size;
      ctx.beginPath();
      ctx.moveTo(size, 0);
      ctx.lineTo(-size / 2, -size / 2);
      ctx.lineTo(-size / 2, size / 2);
      ctx.closePath();
      ctx.strokeStyle = 'white';
      ctx.stroke();
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
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, bullet.size / camera.zoom, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
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
  }, [renderMinimap]);


  useEffect(() => {
    const loop = () => {
      update();
      render();
      
      // Throttle UI updates - only update when values actually change
      setUiState((prev) => {
        const newScore = scoreRef.current;
        const newLives = livesRef.current;
        const newGameOver = gameOverRef.current;
        
        if (prev.score !== newScore || prev.lives !== newLives || prev.gameOver !== newGameOver) {
          return {
            ...prev,
            score: newScore,
            lives: newLives,
            gameOver: newGameOver
          };
        }
        return prev; // No changes, return previous state to prevent re-render
      });
      
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
      
      // Apply styles to play area
      const playArea = document.querySelector('.play-area');
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
        console.log('Minimap dimensions set:', minimapWidth, minimapHeight);
      }

      // Keep minimap and stats vertically aligned regardless of window size
      const minimapBottom = -Math.round(minimapHeight * 0.75); // show top 1/4 overlapping play area
      setLayout(prev => ({ ...prev, minimapBottom }));
      
      // Update constants to match current canvas size for proper rendering
      const updatedCanvasWidth = playWidth - 4;
      const updatedCanvasHeight = playHeight - 4;
      
      // Store current canvas dimensions for use in rendering
      window.currentCanvasWidth = updatedCanvasWidth;
      window.currentCanvasHeight = updatedCanvasHeight;
      
      // Debug logging
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
    };

    // Initial layout calculation with a small delay to ensure DOM is ready
    const timeoutId = setTimeout(updateGameLayout, 10);
    updateGameLayout();
    
    window.addEventListener('resize', updateGameLayout);
    window.addEventListener('orientationchange', updateGameLayout);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateGameLayout);
      window.removeEventListener('orientationchange', updateGameLayout);
    };
  }, []);

  return (
    <div className="app">
      <div className="play-area">
        <canvas 
          ref={canvasRef} 
          width={1200} 
          height={900} 
          onClick={handleCanvasClick}
          className="game-canvas"
        />
        {!uiState.gameStarted && (
          <div className="title-overlay">
            <div className="title-text">ASTEROIDS</div>
            <div className="start-instruction">Click to start</div>
          </div>
        )}
        <canvas 
          ref={minimapCanvasRef}
          className="minimap-canvas"
          style={{ bottom: `${layout.minimapBottom}px` }}
        />
        
        {/* Score/Lives positioned under play area, left of minimap */}
        <div style={{
          position: 'absolute',
          bottom: `${layout.minimapBottom}px`, // track minimap position
          left: '0',       // anchor to left edge of play area
          transform: 'none',
          paddingLeft: '24px',
          display: 'flex',
          gap: '32px',
          fontSize: '20px',
          fontWeight: 'bold',
          color: 'white'
        }}>
          <div>Score: {uiState.score}</div>
          <div>Lives: {uiState.lives}</div>
        </div>
      </div>
      <div className="hud-container">
        <div className="hud-right">
          {uiState.gameOver && <div className="game-over">Game Over</div>}
          {uiState.gameStarted && uiState.gameOver && (
            <button onClick={startGame} className="game-button">New Game</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

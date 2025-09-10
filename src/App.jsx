import { useRef, useEffect, useState, useCallback } from 'react';
import { Ship } from './components/Ship.js';
import { Asteroid } from './components/Asteroid.js';
import { Bullet } from './components/Bullet.js';
import { checkCollision, wrapPosition } from './utils/collision.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, BULLET_FIRE_RATE, STAR_COUNT, STAR_MIN_BRIGHTNESS, STAR_MAX_BRIGHTNESS, INITIAL_ASTEROID_COUNT, MAX_BULLETS, CONTINUOUS_FIRE_RATE, CROSSHAIR_SIZE, MOUSE_OFFSET, SCORE_PER_ASTEROID, INITIAL_LIVES, STAR_LARGE_THRESHOLD, STAR_MEDIUM_THRESHOLD, WORLD_WIDTH, WORLD_HEIGHT, ZOOM_SPEED, MAX_ZOOM_OUT, MIN_ZOOM, MINIMAP_WIDTH, MINIMAP_HEIGHT } from './utils/constants.js';
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
  const livesRef = useRef(3);
  const gameOverRef = useRef(false);
  const gameStartedRef = useRef(false);
  const requestRef = useRef();
  const lastShotTimeRef = useRef(0);
  const starsRef = useRef([]);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const isPointerLockedRef = useRef(false);
  const isMouseDownRef = useRef(false);
  const continuousShootingRef = useRef(null);
  const continuousShootingTimeoutRef = useRef(null);
  const isPausedRef = useRef(false);
  const [uiState, setUiState] = useState({
    score: 0,
    lives: INITIAL_LIVES,
    gameOver: false,
    gameStarted: false,
    isPaused: false,
    isPointerLocked: false
  });

  // Generate stars with bell curve distribution
  const generateStarfield = useCallback(() => {
    const stars = [];
    for (let i = 0; i < STAR_COUNT * 3; i++) { // More stars for bigger world
      // Box-Muller transform for normal distribution
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      
      // Convert to bell curve centered at 0.5 with std dev of 0.15
      let brightness = 0.5 + z0 * 0.15;
      // Clamp to valid range
      brightness = Math.max(STAR_MIN_BRIGHTNESS, Math.min(STAR_MAX_BRIGHTNESS, brightness));
      
      stars.push({
        x: Math.random() * WORLD_WIDTH * 1.5, // Spread beyond world boundaries
        y: Math.random() * WORLD_HEIGHT * 1.5,
        brightness: brightness,
        size: brightness > STAR_LARGE_THRESHOLD ? 2 : brightness > STAR_MEDIUM_THRESHOLD ? 1.5 : 1,
        parallax: 0.3 + Math.random() * 0.4 // Random parallax speed (0.3-0.7)
      });
    }
    starsRef.current = stars;
  }, []);

  // Initialize asteroids and stars
  useEffect(() => {
    const initialAsteroids = [];
    for (let i = 0; i < INITIAL_ASTEROID_COUNT; i++) {
      const x = Math.random() * WORLD_WIDTH;
      const y = Math.random() * WORLD_HEIGHT;
      initialAsteroids.push(new Asteroid(x, y));
    }
    asteroidsRef.current = initialAsteroids;

    // Generate initial starfield
    generateStarfield();
  }, [generateStarfield]);

  // Handle pointer lock and mouse/keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['KeyA', 'KeyD', 'KeyW', 'KeyS', 'Space', 'Escape'].includes(e.code)) {
        e.preventDefault();
      }
      
      // ESC key pauses and releases pointer lock
      if (e.code === 'Escape') {
        document.exitPointerLock();
        return;
      }
      
      keysRef.current[e.code] = true;
    };
    
    const handleKeyUp = (e) => {
      keysRef.current[e.code] = false;
    };

    const handlePointerLockChange = () => {
      const isLocked = document.pointerLockElement === canvasRef.current;
      isPointerLockedRef.current = isLocked;
      const paused = !isLocked && gameStartedRef.current;
      isPausedRef.current = paused;
      setUiState((prev) => ({ 
        ...prev, 
        isPaused: paused,
        isPointerLocked: isLocked
      }));
    };

    const handleMouseMove = (e) => {
      if (isPointerLockedRef.current && canvasRef.current) {
        const camera = cameraRef.current;
        const sensitivity = camera.zoom; // Movement scales with zoom
        
        mousePositionRef.current.x += e.movementX * sensitivity;
        mousePositionRef.current.y += e.movementY * sensitivity;
        
        // Keep mouse position within world bounds
        mousePositionRef.current.x = Math.max(0, Math.min(WORLD_WIDTH, mousePositionRef.current.x));
        mousePositionRef.current.y = Math.max(0, Math.min(WORLD_HEIGHT, mousePositionRef.current.y));
      }
    };

    const handleMouseDown = (e) => {
      if (e.button === 0 && isPointerLockedRef.current && gameStartedRef.current && !gameOverRef.current) {
        isMouseDownRef.current = true;
        // Immediate shot on click - no bullet limit
        shootBullet(true);
        // Start continuous shooting after a delay
        const timeoutId = setTimeout(() => {
          if (isMouseDownRef.current) {
            startContinuousShooting();
          }
        }, CONTINUOUS_FIRE_RATE);
        // Store timeout ID for cleanup
        continuousShootingTimeoutRef.current = timeoutId;
      }
    };

    const handleMouseUp = (e) => {
      if (e.button === 0) {
        isMouseDownRef.current = false;
        // Clear the timeout to prevent continuous shooting from starting
        if (continuousShootingTimeoutRef.current) {
          clearTimeout(continuousShootingTimeoutRef.current);
          continuousShootingTimeoutRef.current = null;
        }
        stopContinuousShooting();
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
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('wheel', handleWheel);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('wheel', handleWheel);
      stopContinuousShooting();
      if (continuousShootingTimeoutRef.current) {
        clearTimeout(continuousShootingTimeoutRef.current);
      }
    };
  }, []);

  const startGame = () => {
    gameStartedRef.current = true;
    setUiState(prev => ({ ...prev, gameStarted: true, gameOver: false, isPaused: false }));
    scoreRef.current = 0;
    livesRef.current = INITIAL_LIVES;
    gameOverRef.current = false;
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
    const initialAsteroids = [];
    for (let i = 0; i < INITIAL_ASTEROID_COUNT; i++) {
      const x = Math.random() * WORLD_WIDTH;
      const y = Math.random() * WORLD_HEIGHT;
      initialAsteroids.push(new Asteroid(x, y));
    }
    asteroidsRef.current = initialAsteroids;
    
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

  const startContinuousShooting = useCallback(() => {
    if (continuousShootingRef.current) return;
    continuousShootingRef.current = setInterval(() => {
      shootBullet(false); // Apply bullet limit for continuous shooting
    }, CONTINUOUS_FIRE_RATE); // 4 shots per second
  }, [shootBullet]);

  const stopContinuousShooting = useCallback(() => {
    if (continuousShootingRef.current) {
      clearInterval(continuousShootingRef.current);
      continuousShootingRef.current = null;
    }
  }, []);

  const handleCanvasClick = () => {
    if (!uiState.gameStarted) {
      startGame();
    } else if (canvasRef.current) {
      canvasRef.current.requestPointerLock();
    }
  };

  const update = useCallback(() => {
    if (gameOverRef.current || !gameStartedRef.current || isPausedRef.current) return;

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
      ship.vx *= 0.92;
      ship.vy *= 0.92;
    } else {
      ship.vx *= 0.99;
      ship.vy *= 0.99;
    }
    wrapPosition(ship); // World wrapping

    // Update camera to follow ship
    camera.followShip(ship.x, ship.y);

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

    // Shooting with rate limiting
    if (keys.Space && bulletsRef.current.length < MAX_BULLETS) {
      const currentTime = Date.now();
      if (currentTime - lastShotTimeRef.current >= BULLET_FIRE_RATE) {
        bulletsRef.current.push(new Bullet(ship.x, ship.y, ship.angle));
        lastShotTimeRef.current = currentTime;
      }
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
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const camera = cameraRef.current;

    // Draw parallax stars first (background)
    starsRef.current.forEach((star) => {
      // Calculate parallax position
      const parallaxX = star.x - camera.x * star.parallax;
      const parallaxY = star.y - camera.y * star.parallax;
      
      const screenPos = camera.worldToScreen(parallaxX, parallaxY);
      
      // Only draw if visible (with margin for star wrapping)
      if (screenPos.x >= -50 && screenPos.x <= CANVAS_WIDTH + 50 && 
          screenPos.y >= -50 && screenPos.y <= CANVAS_HEIGHT + 50) {
        ctx.save();
        ctx.globalAlpha = star.brightness;
        ctx.fillStyle = 'white';
        ctx.fillRect(screenPos.x, screenPos.y, star.size / camera.zoom, star.size / camera.zoom);
        ctx.restore();
      }
    });

    // Draw ship
    if (shipRef.current && camera.isVisible(shipRef.current.x, shipRef.current.y)) {
      const screenPos = camera.worldToScreen(shipRef.current.x, shipRef.current.y);
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
      if (asteroid && camera.isVisible(asteroid.x, asteroid.y, asteroid.size)) {
        const screenPos = camera.worldToScreen(asteroid.x, asteroid.y);
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
      if (bullet && camera.isVisible(bullet.x, bullet.y, bullet.size)) {
        const screenPos = camera.worldToScreen(bullet.x, bullet.y);
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, bullet.size / camera.zoom, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
      }
    });

    // Draw crosshair at mouse position when pointer is locked
    if (isPointerLockedRef.current && gameStartedRef.current && !uiState.isPaused) {
      const mousePos = mousePositionRef.current;
      const screenPos = camera.worldToScreen(mousePos.x, mousePos.y);
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
      setUiState((prev) => ({
        ...prev,
        score: scoreRef.current,
        lives: livesRef.current,
        gameOver: gameOverRef.current
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

  return (
    <div className="app">
      <div className="game-container">
        <canvas 
          ref={canvasRef} 
          width={CANVAS_WIDTH} 
          height={CANVAS_HEIGHT} 
          onClick={handleCanvasClick}
          className={`${uiState.isPaused ? 'paused' : ''} ${uiState.isPointerLocked ? 'pointer-locked' : ''}`.trim()}
        />
        {!uiState.gameStarted && (
          <div className="title-overlay">
            <div className="title-text">ASTEROIDS</div>
            <div className="start-instruction">Click to start</div>
          </div>
        )}
        {uiState.isPaused && uiState.gameStarted && (
          <div className="pause-overlay">
            <div className="pause-text">PAUSED</div>
            <div className="pause-instruction">Click to resume</div>
          </div>
        )}
        <canvas 
          ref={minimapCanvasRef}
          width={MINIMAP_WIDTH}
          height={MINIMAP_HEIGHT}
          className="minimap-canvas"
        />
      </div>
      <div className="bottom-ui">
        <div className="ui-left">
          <div>Score: {uiState.score}</div>
          <div>Lives: {uiState.lives}</div>
          {uiState.gameOver && <div className="game-over">Game Over</div>}
        </div>
        <div className="ui-right">
          {uiState.gameStarted && uiState.gameOver && (
            <button onClick={startGame} className="game-button">New Game</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

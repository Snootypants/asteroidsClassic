import { useRef, useEffect, useState, useCallback } from 'react';
import { Ship } from './components/Ship.js';
import { Asteroid } from './components/Asteroid.js';
import { Bullet } from './components/Bullet.js';
import { checkCollision, wrapPosition } from './utils/collision.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, BULLET_FIRE_RATE, INITIAL_ASTEROID_COUNT, MAX_BULLETS, MOUSE_OFFSET, SCORE_PER_ASTEROID, INITIAL_LIVES, WORLD_WIDTH, WORLD_HEIGHT, ZOOM_SPEED, SHIP_FRICTION, SHIP_DECELERATION } from './utils/constants.js';
import { Camera } from './utils/camera.js';
import './App.css';
import { useStarfield } from './hooks/useStarfield.js';
import { useResponsiveLayout } from './hooks/useResponsiveLayout.js';
import { useRendering } from './hooks/useRendering.js';

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
  const { starsRef, generateStarfield } = useStarfield();
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

  useResponsiveLayout(canvasRef, minimapCanvasRef, setLayout);

  const { render } = useRendering({
    canvasRef,
    minimapCanvasRef,
    starsRef,
    shipRef,
    cameraRef,
    asteroidsRef,
    bulletsRef,
    mousePositionRef,
    gameStartedRef
  });

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
    document.addEventListener('wheel', handleWheel, { passive: true });
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('wheel', handleWheel);
    };
  }, [shootBullet]);

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

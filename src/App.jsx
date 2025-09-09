import { useRef, useEffect, useState, useCallback } from 'react';
import { Ship } from './components/Ship.js';
import { Asteroid } from './components/Asteroid.js';
import { Bullet } from './components/Bullet.js';
import { checkCollision, wrapPosition } from './utils/collision.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, BULLET_FIRE_RATE, STAR_COUNT, STAR_MIN_BRIGHTNESS, STAR_MAX_BRIGHTNESS, INITIAL_ASTEROID_COUNT, MAX_BULLETS, CONTINUOUS_FIRE_RATE, CROSSHAIR_SIZE, MOUSE_OFFSET, SCORE_PER_ASTEROID, INITIAL_LIVES, STAR_LARGE_THRESHOLD, STAR_MEDIUM_THRESHOLD } from './utils/constants.js';
import './App.css';

function App() {
  const canvasRef = useRef(null);
  const shipRef = useRef(new Ship(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2));
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

  // Initialize asteroids and stars
  useEffect(() => {
    const initialAsteroids = [];
    for (let i = 0; i < INITIAL_ASTEROID_COUNT; i++) {
      const x = Math.random() * CANVAS_WIDTH;
      const y = Math.random() * CANVAS_HEIGHT;
      initialAsteroids.push(new Asteroid(x, y));
    }
    asteroidsRef.current = initialAsteroids;

    // Generate stars
    const stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      const brightness = STAR_MIN_BRIGHTNESS + Math.random() * (STAR_MAX_BRIGHTNESS - STAR_MIN_BRIGHTNESS);
      stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        brightness: brightness,
        size: brightness > STAR_LARGE_THRESHOLD ? 2 : brightness > STAR_MEDIUM_THRESHOLD ? 1.5 : 1
      });
    }
    starsRef.current = stars;
  }, []);

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
        mousePositionRef.current.x += e.movementX;
        mousePositionRef.current.y += e.movementY;
        
        // Keep mouse position within canvas bounds
        mousePositionRef.current.x = Math.max(0, Math.min(CANVAS_WIDTH, mousePositionRef.current.x));
        mousePositionRef.current.y = Math.max(0, Math.min(CANVAS_HEIGHT, mousePositionRef.current.y));
      }
    };

    const handleMouseDown = (e) => {
      if (e.button === 0 && isPointerLockedRef.current && gameStartedRef.current && !gameOverRef.current) {
        isMouseDownRef.current = true;
        // Immediate shot on click
        shootBullet();
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

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
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
    shipRef.current = new Ship(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    bulletsRef.current = [];
    
    // Initialize mouse position ahead of ship based on initial angle (0)
    mousePositionRef.current = { 
      x: CANVAS_WIDTH / 2 + MOUSE_OFFSET, 
      y: CANVAS_HEIGHT / 2 
    };
    
    // Re-initialize asteroids
    const initialAsteroids = [];
    for (let i = 0; i < INITIAL_ASTEROID_COUNT; i++) {
      const x = Math.random() * CANVAS_WIDTH;
      const y = Math.random() * CANVAS_HEIGHT;
      initialAsteroids.push(new Asteroid(x, y));
    }
    asteroidsRef.current = initialAsteroids;
  };

  const shootBullet = useCallback(() => {
    const ship = shipRef.current;
    if (ship && gameStartedRef.current && !gameOverRef.current) {
      bulletsRef.current.push(new Bullet(ship.x, ship.y, ship.angle));
    }
  }, []);

  const startContinuousShooting = useCallback(() => {
    if (continuousShootingRef.current) return;
    continuousShootingRef.current = setInterval(() => {
      shootBullet();
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
    wrapPosition(ship, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Update asteroids
    asteroidsRef.current.forEach((asteroid) => {
      asteroid.update();
      wrapPosition(asteroid, CANVAS_WIDTH, CANVAS_HEIGHT);
    });

    // Update bullets
    bulletsRef.current.forEach((bullet) => {
      bullet.update();
      wrapPosition(bullet, CANVAS_WIDTH, CANVAS_HEIGHT);
    });
    bulletsRef.current = bulletsRef.current.filter((bullet) => !bullet.isExpired());

    // Shooting with rate limiting
    if (keys.Space && bulletsRef.current.length < 5) {
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
        shipRef.current = new Ship(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        shipCollisionIndex = ai;
      }
    });
    
    // Remove the asteroid that hit the ship
    if (shipCollisionIndex >= 0) {
      asteroidsRef.current.splice(shipCollisionIndex, 1);
    }
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw stars first (background)
    starsRef.current.forEach((star) => {
      ctx.save();
      ctx.globalAlpha = star.brightness;
      ctx.fillStyle = 'white';
      ctx.fillRect(star.x, star.y, star.size, star.size);
      ctx.restore();
    });

    if (shipRef.current) {
      shipRef.current.draw(ctx);
    }
    
    asteroidsRef.current.forEach((asteroid) => {
      if (asteroid) {
        asteroid.draw(ctx);
      }
    });
    
    bulletsRef.current.forEach((bullet) => {
      if (bullet) {
        bullet.draw(ctx);
      }
    });

    // Draw crosshair at mouse position when pointer is locked
    if (isPointerLockedRef.current && gameStartedRef.current && !uiState.isPaused) {
      const mousePos = mousePositionRef.current;
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Horizontal line
      ctx.moveTo(mousePos.x - CROSSHAIR_SIZE, mousePos.y);
      ctx.lineTo(mousePos.x + CROSSHAIR_SIZE, mousePos.y);
      // Vertical line
      ctx.moveTo(mousePos.x, mousePos.y - CROSSHAIR_SIZE);
      ctx.lineTo(mousePos.x, mousePos.y + CROSSHAIR_SIZE);
      ctx.stroke();
    }
  }, []);


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
  }, []);

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
      </div>
      <div className="ui">
        <div>Score: {uiState.score}</div>
        <div>Lives: {uiState.lives}</div>
        {uiState.gameOver && <div className="game-over">Game Over</div>}
      </div>
      <div className="buttons">
        {uiState.gameStarted && uiState.gameOver && (
          <button onClick={startGame} className="game-button">New Game</button>
        )}
      </div>
    </div>
  );
}

export default App;

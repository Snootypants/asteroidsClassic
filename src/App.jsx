import { useRef, useEffect, useState, useCallback } from 'react';
import { Ship } from './components/Ship.js';
import { Asteroid } from './components/Asteroid.js';
import { Bullet } from './components/Bullet.js';
import { checkCollision, wrapPosition } from './utils/collision.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './utils/constants.js';
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
  const requestRef = useRef();
  const [uiState, setUiState] = useState({
    score: 0,
    lives: 3,
    gameOver: false,
    frameCount: 0,
    keys: {}
  });

  // Initialize asteroids
  useEffect(() => {
    const initialAsteroids = [];
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * CANVAS_WIDTH;
      const y = Math.random() * CANVAS_HEIGHT;
      initialAsteroids.push(new Asteroid(x, y));
    }
    asteroidsRef.current = initialAsteroids;
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['KeyA', 'KeyD', 'KeyW', 'KeyS', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      keysRef.current[e.code] = true;
      setUiState((prev) => ({ ...prev, keys: { ...keysRef.current } }));
    };
    const handleKeyUp = (e) => {
      keysRef.current[e.code] = false;
      setUiState((prev) => ({ ...prev, keys: { ...keysRef.current } }));
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const update = useCallback(() => {
    if (gameOverRef.current) return;

    // Update ship
    const keys = keysRef.current;
    const ship = shipRef.current;
    if (keys.KeyA) ship.angle -= ship.rotationSpeed;
    if (keys.KeyD) ship.angle += ship.rotationSpeed;
    if (keys.KeyW) {
      ship.vx += Math.cos(ship.angle) * ship.speed;
      ship.vy += Math.sin(ship.angle) * ship.speed;
    }
    if (keys.KeyS) {
      ship.vx *= 0.9;
      ship.vy *= 0.9;
    }
    ship.x += ship.vx;
    ship.y += ship.vy;
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    shipRef.current = wrapPosition(ship, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Update asteroids
    asteroidsRef.current.forEach((asteroid) => {
      asteroid.update();
      const wrapped = wrapPosition(asteroid, CANVAS_WIDTH, CANVAS_HEIGHT);
      asteroid.x = wrapped.x;
      asteroid.y = wrapped.y;
    });

    // Update bullets
    bulletsRef.current.forEach((bullet) => {
      bullet.update();
      const wrapped = wrapPosition(bullet, CANVAS_WIDTH, CANVAS_HEIGHT);
      bullet.x = wrapped.x;
      bullet.y = wrapped.y;
    });
    bulletsRef.current = bulletsRef.current.filter((bullet) => !bullet.isExpired());

    // Shooting
    if (keys.Space && bulletsRef.current.length < 5) {
      bulletsRef.current.push(new Bullet(ship.x, ship.y, ship.angle));
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
          scoreRef.current += 10;
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
  }, []);

  const gameLoop = useCallback(() => {
    update();
    render();
    setUiState((prev) => ({
      ...prev,
      score: scoreRef.current,
      lives: livesRef.current,
      gameOver: gameOverRef.current,
      frameCount: prev.frameCount + 1,
      keys: { ...keysRef.current }
    }));
    requestRef.current = requestAnimationFrame(gameLoop);
  }, []);

  useEffect(() => {
    const loop = () => {
      update();
      render();
      setUiState((prev) => ({
        ...prev,
        score: scoreRef.current,
        lives: livesRef.current,
        gameOver: gameOverRef.current,
        frameCount: prev.frameCount + 1,
        keys: { ...keysRef.current }
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
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
      <div className="ui">
        <div>Score: {uiState.score}</div>
        <div>Lives: {uiState.lives}</div>
        <div>Frame: {uiState.frameCount}</div>
        <div>Keys: {JSON.stringify(uiState.keys)}</div>
        {uiState.gameOver && <div className="game-over">Game Over</div>}
      </div>
    </div>
  );
}

export default App;

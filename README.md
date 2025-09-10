# Asteroids Game

A modern recreation of the classic Asteroids arcade game built with React and HTML5 Canvas.

## Features

- **Mouse + Keyboard Controls**: Ship aims at mouse cursor, W/S keys for forward/backward thrust
- **Crosshair Aiming**: Visible crosshair shows exact aiming point
- **Dual Shooting Modes**: Single click for individual shots, hold for continuous firing (4 shots/sec)
- **Classic Physics**: Momentum-based movement with smooth friction
- **Dynamic Asteroid Splitting**: Large asteroids break into smaller pieces when shot
- **Starfield Background**: Randomly generated stars with varying brightness
- **Pointer Lock Integration**: Click the canvas to lock the pointer for smooth aiming; press ESC to release the lock and pause
- **Professional UI**: Clean title screen, pause overlay, score tracking

## Controls

- **Mouse**: Aim the ship by moving the cursor
- **Click Canvas**: Capture mouse pointer and start/resume game  
- **Left Click**: Shoot (single shot or hold for continuous)
- **W Key**: Forward thrust
- **S Key**: Brake (slow down)
- **ESC Key**: Release pointer lock and pause game

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Development

The game is built using:
- **React** with hooks for state management
- **HTML5 Canvas** for rendering
- **Vite** for fast development and building
- **Modular Architecture** with separate classes for game objects

All game configuration values are centralized in `src/utils/constants.js` for easy tuning.

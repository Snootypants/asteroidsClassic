# Recurring Issues (RI.md)

This document tracks recurring issues in the Asteroids game and their solutions to prevent future occurrences.

## Issue #1: Black Screen Rendering Problem

### Status: ✅ RESOLVED (2025-09-10)

### Frequency
Occurred 4 times during development:
1. First occurrence during initial layout changes
2. Second occurrence after rollback attempts  
3. Third occurrence after layout update
4. Fourth occurrence after layout restructuring (missing imports)

### Description
Game loads but displays only a black screen. The canvas element is present and properly sized, but no game content (ship, asteroids, stars, UI overlays) is visible.

### Root Causes

#### 1. Camera Initialization at Wrong Position
**Problem**: Camera constructor initializes at position (0, 0) instead of world center
```javascript
// PROBLEMATIC CODE:
constructor() {
  this.x = 0;  // Should be WORLD_WIDTH / 2
  this.y = 0;  // Should be WORLD_HEIGHT / 2
}
```

**Why it breaks**: 
- Ship spawns at world center (2000, 1500)
- Camera looks at corner (0, 0) where nothing exists
- All game elements are outside camera's view

#### 2. Game Loop Stale Closures
**Problem**: Game loop useEffect has empty dependencies `[]`
```javascript
// PROBLEMATIC CODE:
useEffect(() => {
  const loop = () => {
    update();  // Stale reference
    render();  // Stale reference
  };
  // ...
}, []); // Empty dependencies cause stale closures
```

**Why it breaks**:
- `update` and `render` functions become stale references
- Changes to these functions don't get picked up by the loop
- Game logic and rendering stop executing properly

#### 3. Missing Import References (Latest Issue - 2025-09-10)
**Problem**: Constants used in JSX not imported in App.jsx
```javascript
// PROBLEMATIC CODE:
// App.jsx line 6 missing MINIMAP_WIDTH, MINIMAP_HEIGHT in imports
// Line 490-491:
<canvas 
  width={MINIMAP_WIDTH}  // ReferenceError: MINIMAP_WIDTH is not defined
  height={MINIMAP_HEIGHT}  // ReferenceError: MINIMAP_HEIGHT is not defined
/>
```

**Why it breaks**:
- React fails to render due to ReferenceError during component execution
- Black screen appears because render function throws before painting
- Browser console shows "MINIMAP_WIDTH is not defined" error

### Solution

#### Fix 1: Initialize Camera at World Center
```javascript
// CORRECT CODE in src/utils/camera.js:
export class Camera {
  constructor(x = WORLD_WIDTH / 2, y = WORLD_HEIGHT / 2) {
    this.x = x;  // Now defaults to 2000
    this.y = y;  // Now defaults to 1500
    this.zoom = 1;
    this.targetZoom = 1;
  }
}
```

#### Fix 2: Add Proper Dependencies to Game Loop
```javascript
// CORRECT CODE in src/App.jsx:
useEffect(() => {
  const loop = () => {
    update();
    render();
    setUiState(prev => ({
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
}, [update, render]); // Include dependencies!
```

#### Fix 3: Add Missing Imports ✅ APPLIED (2025-09-10)
```javascript
// CORRECT CODE in src/App.jsx line 6:
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, BULLET_FIRE_RATE, STAR_COUNT, 
  STAR_MIN_BRIGHTNESS, STAR_MAX_BRIGHTNESS, INITIAL_ASTEROID_COUNT, 
  MAX_BULLETS, CONTINUOUS_FIRE_RATE, CROSSHAIR_SIZE, MOUSE_OFFSET, 
  SCORE_PER_ASTEROID, INITIAL_LIVES, STAR_LARGE_THRESHOLD, 
  STAR_MEDIUM_THRESHOLD, WORLD_WIDTH, WORLD_HEIGHT, ZOOM_SPEED, 
  MAX_ZOOM_OUT, MIN_ZOOM, MINIMAP_WIDTH, MINIMAP_HEIGHT  // Added these!
} from './utils/constants.js';
```

### Prevention Guidelines

1. **Always verify camera position after major changes**
   - Camera should start at world center, not (0,0)
   - Ship position should be visible within camera view

2. **Check useEffect dependencies**
   - Never use empty `[]` for game loop if it references functions
   - Include all function dependencies that could change

3. **Check all imports after layout changes**
   - Any new constants used in JSX must be imported
   - Check browser console for ReferenceError messages
   - Verify all constants are exported from constants.js

4. **Test rendering after rollbacks**
   - Git rollbacks might revert critical fixes
   - Always test game startup after any rollback operation

5. **Debugging steps for black screen**:
   ```javascript
   // Add temporary logging to verify:
   if (import.meta.env.DEV) {
     console.log('Camera position:', camera.x, camera.y);
     console.log('Ship position:', ship.x, ship.y);
     console.log('World bounds:', WORLD_WIDTH, WORLD_HEIGHT);
   }
   ```
   
6. **Check browser console immediately**
   - ReferenceError messages indicate missing imports
   - TypeError messages may indicate stale references

### Files to Check When This Occurs
- `src/utils/camera.js` - Camera constructor initialization
- `src/App.jsx` - Game loop useEffect dependencies (around line 455) + imports (line 6)
- `src/utils/constants.js` - Verify WORLD_WIDTH/HEIGHT values + all exports

### Quick Fix Commands
```bash
# If this issue occurs again:
# 1. Open browser console - look for ReferenceError messages
# 2. Check camera.js line 4-6 (constructor defaults)
# 3. Check App.jsx line 6 (missing imports)
# 4. Check App.jsx around line 455 (useEffect dependencies)
# 5. Test immediately after each fix
```

### Resolution Log
- **2025-09-10**: Missing imports issue resolved ✅
  - Added MINIMAP_WIDTH, MINIMAP_HEIGHT to imports
  - Fixed hardcoded bullet limit (5 → MAX_BULLETS)
  - Added bullet limit check to shootBullet function
  - Game now runs successfully with all features working

**Current Status**: All known black screen causes have been identified and resolved. The game is stable and functional.
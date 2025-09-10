# Recurring Issues (RI.md)

This document tracks recurring issues in the Asteroids game and their solutions to prevent future occurrences.

## Issue #1: Black Screen Rendering Problem

### Frequency
Occurred 3 times during development:
1. First occurrence during initial layout changes
2. Second occurrence after rollback attempts  
3. Third occurrence after layout update (current)

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

### Prevention Guidelines

1. **Always verify camera position after major changes**
   - Camera should start at world center, not (0,0)
   - Ship position should be visible within camera view

2. **Check useEffect dependencies**
   - Never use empty `[]` for game loop if it references functions
   - Include all function dependencies that could change

3. **Test rendering after rollbacks**
   - Git rollbacks might revert critical fixes
   - Always test game startup after any rollback operation

4. **Debugging steps for black screen**:
   ```javascript
   // Add temporary logging to verify:
   console.log('Camera position:', camera.x, camera.y);
   console.log('Ship position:', ship.x, ship.y);
   console.log('World bounds:', WORLD_WIDTH, WORLD_HEIGHT);
   ```

### Files to Check When This Occurs
- `src/utils/camera.js` - Camera constructor initialization
- `src/App.jsx` - Game loop useEffect dependencies (around line 455)
- `src/utils/constants.js` - Verify WORLD_WIDTH/HEIGHT values

### Quick Fix Commands
```bash
# If this issue occurs again:
# 1. Check camera.js line 4-6
# 2. Check App.jsx around line 455
# 3. Apply the two fixes above
# 4. Test immediately
```

This issue is now documented to prevent future occurrences and enable faster resolution.
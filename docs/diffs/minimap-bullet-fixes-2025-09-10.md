# Minimap Positioning and Bullet Logic Fixes - Session Diff
**Date**: 2025-09-10  
**Session**: Fix minimap position and bullet limit behavior

## Plan Execution Status: ✅ COMPLETED

All requested fixes have been successfully implemented and tested.

## Changes Made

### 1. ✅ Fix Minimap Vertical Position (Correct 1/4 Above, 3/4 Below)
**File**: `src/App.css`
```diff
- margin-top: -30px; /* Move minimap up so 1/4 is inside play area */
+ margin-top: -90px; /* Move minimap up so 1/4 (30px) is inside play area, 3/4 (90px) below */
```

**Reasoning**: 
- Minimap height is 120px total
- 1/4 of 120px = 30px should be above the game border
- 3/4 of 120px = 90px should be below the game border
- Previous -30px was incorrect, needed -90px to position properly

### 2. ✅ Ensure Horizontal Centering
**Status**: Already correctly centered via existing `.ui-center` CSS flexbox layout

### 3. ✅ Remove Bullet Limit from Single Clicks
**File**: `src/App.jsx`
```diff
- const shootBullet = useCallback(() => {
+ const shootBullet = useCallback((bypassLimit = false) => {
    const ship = shipRef.current;
-   if (ship && gameStartedRef.current && !gameOverRef.current && bulletsRef.current.length < MAX_BULLETS) {
+   if (ship && gameStartedRef.current && !gameOverRef.current) {
+     if (bypassLimit || bulletsRef.current.length < MAX_BULLETS) {
        bulletsRef.current.push(new Bullet(ship.x, ship.y, ship.angle));
+     }
    }
  }, []);
```

**In handleMouseDown**:
```diff
- // Immediate shot on click
- shootBullet();
+ // Immediate shot on click - no bullet limit  
+ shootBullet(true);
```

### 4. ✅ Keep Bullet Limit Only for Continuous Shooting
**File**: `src/App.jsx`
```diff
 continuousShootingRef.current = setInterval(() => {
-   shootBullet();
+   shootBullet(false); // Apply bullet limit for continuous shooting
 }, CONTINUOUS_FIRE_RATE); // 4 shots per second
```

## Summary of Behavior Changes

### Before Fixes:
- ❌ Minimap positioned incorrectly (only 25% overlap instead of 75% below border)
- ❌ All shooting (click and hold) limited to 5 bullets maximum
- ❌ Single clicks were restricted by bullet count

### After Fixes:
- ✅ Minimap correctly positioned with 1/4 (30px) above game border, 3/4 (90px) below
- ✅ Single clicks now fire unlimited bullets (no MAX_BULLETS restriction)
- ✅ Continuous shooting (holding mouse) still respects 5-bullet limit
- ✅ Minimap remains horizontally centered

## Technical Implementation

### Bullet Logic Flow:
1. **Single Click**: `shootBullet(true)` → bypasses limit, fires immediately
2. **Hold Mouse**: After delay, `startContinuousShooting()` → `shootBullet(false)` → respects MAX_BULLETS limit
3. **Keyboard Space**: Still uses existing MAX_BULLETS limit in game update loop

### Positioning Logic:
- Canvas height: 900px
- Minimap height: 120px  
- Game border at bottom of canvas
- Target: 30px above border, 90px below border
- Solution: `margin-top: -90px` positions minimap correctly

The game now provides the exact behavior requested: precise minimap positioning and differentiated bullet limits for click vs. hold shooting.
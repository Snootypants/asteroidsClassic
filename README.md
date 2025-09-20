# Asteroids Game

A modern, mouse-driven take on the classic arcade shooter built with React and an HTML5 canvas renderer. The project now ships with a polished HUD, selectable modes, and a responsive layout that keeps the playfield and UI locked together on any screen size.

## Key Features

- **Dual game modes**: Start on a refreshed title overlay and pick _Waves_ or _Survival_. Pause, life-loss, and game-over overlays share the same visual language.
- **Mouse-first controls**: Aim with the cursor, shoot instantly with Space or left click, and keep a consistent fire cadence governed by a single `BULLET_FIRE_RATE` constant.
- **XP bar + HUD alignment**: Level, lives, currency, minimap, wave, and timer live inside framed panels beneath the playfield. Shared CSS custom properties (`--layout-gutter`, `--hud-stack-gap`, etc.) keep every gap synced.
- **Loot drops**: Every asteroid break spawns XP orbs and a chance for currency shards that drift briefly, then magnetize to the ship. Currency replaces score on the HUD and feeds the end-run summary.
- **Responsive playfield**: `useResponsiveLayout` dynamically sizes the canvas and updates the HUD padding variables so the frame, XP bar, and panels line up perfectly across breakpoints.
- **Large world + minimap**: 6000×5500 world with a parallax starfield, asteroid count tracking, and an aspect-correct minimap that highlights the viewport and asteroid positions.
- **Robust game loop**: Ship, bullets, asteroids, and effects (level-up, stage clear, hyperspace jump, death explosion) are managed through dedicated hooks for clarity.
- **Automated coverage**: Vitest suites exercise asteroid splitting, collision math, and bullet limits; GitHub Actions runs `npm test` and `npm run build` on every push to `main`.

## Controls

- Mouse: aim the ship
- Left click or Space: fire (click once for a single shot, hold for continuous fire)
- W: thrust forward
- S: brake (no reverse)
- Escape: toggle pause
- Tab: toggle testing mode (dev helper)

Pointer lock is not required—the game continuously reprojects the last screen position into world coordinates.

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev

# Run the test suite
npm test

# Create a production build
npm run build
```

## Layout & Styling Tweaks

Key spacing variables live in `src/styles/theme.css`:

- `--layout-gutter` / `--layout-top-gap` — horizontal and top margins shared by the playfield frame and HUD.
- `--hud-stack-gap` / `--hud-panel-gap` — spacing between the XP bar and the HUD panels (and between the panels themselves).
- `--hud-actual-height` — vertical space the responsive hook reserves under the play area.

`useResponsiveLayout` reads these values, computes the current playfield size, and writes the resolved padding back to CSS so everything stays in sync. Adjust the variables and the layout will respond without touching JavaScript.

## Gameplay Tuning (`src/utils/constants.js`)

- `BULLET_FIRE_RATE` — cadence for Space/LMB hold (default 250 ms).
- `BULLET_SPEED` — projectile velocity (default 20).
- `SHIP_SPEED`, `SHIP_FRICTION`, `SHIP_DECELERATION` — thrust feel.
- `WORLD_WIDTH` / `WORLD_HEIGHT` — game-space dimensions (default 6000×5500).
- `STAR_COUNT`, `STAR_FIELD_MULTIPLIER`, `STAR_FIELD_SPREAD` — starfield density and distribution.
- `INITIAL_ASTEROID_COUNT`, `XP_LEVEL_BASE`, `XP_LEVEL_GROWTH` — mode progression knobs.

Refresh the browser after editing constants; Vite hot reload handles the rest.

## Project Structure

- `src/App.jsx` — orchestrates canvas rendering, input, game loop, overlays, and layout.
- `src/hooks/` — domain-specific hooks (`useGameWorld`, `useGameControls`, `useGameLogic`, `useResponsiveLayout`, timers, sessions).
- `src/components/` — ship, asteroid, bullet classes, minimap renderer, overlays, and HUD (with `src/components/ui` for React UI shells).
- `src/styles/` — theme variables (`theme.css`) and HUD/overlay styling (`ui.css`).
- `src/utils/` — shared constants, camera helpers, collision math.
- `src/**/*.test.*` — Vitest suites (run with `npm test`).
- `asteroids-game/` — a preserved earlier iteration used for historical reference and CI compatibility.

## Testing & CI

- **Vitest** (`npm test`): exercises collision detection, asteroid splitting, and bullet firing limits (`src/App.test.jsx`).
- **ESLint** (`npm run lint`): optional check for code style.
- **GitHub Actions**: `.github/workflows/ci.yml` installs dependencies with Node 20, runs the test suite, and builds on every push or PR targeting `main`.

## Assets

Runtime assets live in `public/assets/`. Use the Vite base URL helper to reference them:

```jsx
const shipUrl = `${import.meta.env.BASE_URL}assets/ship/ship1.png`;
<img src={shipUrl} alt="Ship" />
```

Directory structures (e.g., `assets/ship/`, `assets/boss/`) are preserved so you can address sprites predictably.

## Additional Notes

- The minimap canvas mirrors the world aspect ratio and renders asteroids as red dots plus a dimmed viewport rectangle.
- The crosshair stays responsive because the last mouse position is reprojection into world space every frame, even when the cursor is idle.
- `IMPROVEMENTS.md` documents historical refactors and serves as a changelog for major polish passes.

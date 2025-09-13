# Asteroids Game

A modern, responsive take on the classic Asteroids built with React + HTML5 Canvas.

## Highlights (v0.1.0 – stable base)

- Smooth aiming without pointer lock: last screen mouse position is re‑projected to world every frame (no crosshair drift).
- Even firing cadence: single fire‑rate constant; click = instant shot, hold/Space = steady cadence capped by `MAX_BULLETS`.
- Tuned speeds: faster bullets, slightly slower ship for clear projectile lead.
- Big world: 6000×5500 with an aspect‑correct minimap (one clean border). Asteroids are visible red dots; viewport box is softly dimmed.
- HUD: Score/Lives aligned under the play area, to the left of the minimap; layout remains aligned across resizes.
- Starfield: dense (~2000) with parallax and +20% perceived brightness.
- Tests: 7/7 passing (collision, asteroid behavior, bullet firing limits). Vite prod build succeeds.

## Controls

- Mouse: aim the ship by moving the cursor
- Left click: fire (click = single, hold = continuous)
- W: thrust forward
- S: brake (no reverse)
- ESC: pause

Pointer lock is not required and is disabled by default.

## Getting Started

```bash
# Install dependencies (use your preferred package manager)
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Tuning (src/utils/constants.js)

- `FIRE_RATE_MS` — fire cadence for Space/LMB hold (default: 250ms)
- `BULLET_SPEED` — bullet velocity (default: 20)
- `SHIP_SPEED` — ship acceleration per tick (default: 0.12)
- `WORLD_WIDTH` / `WORLD_HEIGHT` — world size (default: 6000×5500)
- `STAR_COUNT` — base star density (default: 2000)
- `MINIMAP_*` — sizing is computed by world aspect; border is CSS

After changing constants, just refresh — no rebuild needed in dev.

## Assets

Static assets live under `public/assets/` and are served at `${import.meta.env.BASE_URL}assets/...`.

Examples:

```jsx
// In a React component
const shipUrl = `${import.meta.env.BASE_URL}assets/ship/ship1.png`;
<img src={shipUrl} alt="Ship" />
```

Folders are preserved (e.g., `assets/ship/`, `assets/boss/`) so you can address them predictably.

## Project Structure

- `src/App.jsx` — main loop, input, rendering, layout, UI
- `src/components/` — `Ship`, `Asteroid`, `Bullet`, `Minimap`
- `src/utils/` — physics, camera, constants
- `src/*.test.*` — unit / interaction tests (Vitest + JSDOM)

## Versioning

- Stable baseline tag: `v0.1.0`
- Changelog lives in the tag annotation and `IMPROVEMENTS.md`.

## CI & Deploy

- CI: GitHub Actions runs tests and build on every PR and push to `main` (`.github/workflows/ci.yml`).
- GitHub Pages: pushes to `main` (and Releases) build and publish `dist/` to Pages (`.github/workflows/pages.yml`).
  - Vite is configured with `base: './'` so assets load when served at `/REPO/`.
  - Manual trigger is available via “Run workflow”.

## Notes

- The minimap uses the world aspect ratio and canvas dimensions; it draws asteroids as red dots and a softly dimmed viewport rectangle.
- The crosshair and aiming are recomputed every frame based on the last screen mouse position to avoid edge/idle issues.

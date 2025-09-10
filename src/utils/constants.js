// Game constants for easy tuning and expansion
export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 900;
export const SHIP_SIZE = 10;
export const SHIP_SPEED = 0.12; // reduced for lower max ship speed
// One place to configure firing cadence (also used for hold fire)
export const FIRE_RATE_MS = 250; // 4 shots per second
export const BULLET_FIRE_RATE = FIRE_RATE_MS; // backwards compatibility
export const BULLET_SPEED = 20; // slightly faster bullets
export const BULLET_LIFETIME = 100; // frames
export const ASTEROID_SPEED = 2;
export const ASTEROID_SIZE_LARGE = 40;
export const ASTEROID_SIZE_MEDIUM = 20;
export const ASTEROID_SIZE_SMALL = 10;
export const STAR_COUNT = 2000; // Increased star density
export const STAR_MIN_BRIGHTNESS = 0.2;
export const STAR_MAX_BRIGHTNESS = 1.0;

// Game configuration constants
export const INITIAL_ASTEROID_COUNT = 5;
export const MAX_BULLETS = 5;
export const CONTINUOUS_FIRE_RATE = FIRE_RATE_MS; // keep in sync with single source of truth
export const CROSSHAIR_SIZE = 10;
export const MOUSE_OFFSET = 50;
export const SCORE_PER_ASTEROID = 10;
export const INITIAL_LIVES = 3;
export const BULLET_SIZE = 2;

// Star brightness thresholds
export const STAR_LARGE_THRESHOLD = 0.7;
export const STAR_MEDIUM_THRESHOLD = 0.4;

// Phase 2: Big Map constants
// Large world; shape is authoritative for the minimap
export const VIEWPORT_WIDTH = CANVAS_WIDTH;
export const VIEWPORT_HEIGHT = CANVAS_HEIGHT;
export const WORLD_WIDTH = 6000; // requested width
export const WORLD_HEIGHT = 5500; // requested height

// Zoom system
export const MAX_ZOOM_OUT = 3;
export const MIN_ZOOM = 1;
export const ZOOM_SPEED = 0.1;

// Bullet range (twice viewport width)
export const BULLET_RANGE = VIEWPORT_WIDTH * 2;

// Minimap
export const MINIMAP_WIDTH = 160;
export const MINIMAP_HEIGHT = 120;
export const MAX_MINIMAP_HEIGHT_RATIO = 0.2; // at most 20% of play height

// Ship physics constants
export const SHIP_FRICTION = 0.99;
export const SHIP_DECELERATION = 0.92;

// Camera constants
export const ZOOM_INTERPOLATION = 0.1;

// Starfield generation constants
export const STAR_FIELD_MULTIPLIER = 3;
export const STAR_FIELD_SPREAD = 1.5;
export const MIN_PARALLAX = 0.3;
export const MAX_PARALLAX = 0.7;

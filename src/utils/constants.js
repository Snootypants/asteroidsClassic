// Game constants for easy tuning and expansion
export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 900;
export const SHIP_SIZE = 10;
export const SHIP_SPEED = 0.2;
export const BULLET_FIRE_RATE = 333; // milliseconds between shots (3 shots per second)
export const BULLET_SPEED = 6.7;
export const BULLET_LIFETIME = 100; // frames
export const ASTEROID_SPEED = 2;
export const ASTEROID_SIZE_LARGE = 40;
export const ASTEROID_SIZE_MEDIUM = 20;
export const ASTEROID_SIZE_SMALL = 10;
export const STAR_COUNT = 180;
export const STAR_MIN_BRIGHTNESS = 0.2;
export const STAR_MAX_BRIGHTNESS = 1.0;

// Game configuration constants
export const INITIAL_ASTEROID_COUNT = 5;
export const MAX_BULLETS = 5;
export const CONTINUOUS_FIRE_RATE = 250; // milliseconds (4 shots per second)
export const CROSSHAIR_SIZE = 10;
export const MOUSE_OFFSET = 50;
export const SCORE_PER_ASTEROID = 10;
export const INITIAL_LIVES = 3;
export const BULLET_SIZE = 2;

// Star brightness thresholds
export const STAR_LARGE_THRESHOLD = 0.7;
export const STAR_MEDIUM_THRESHOLD = 0.4;

// Phase 2: Big Map constants
export const WORLD_WIDTH = 4000; // Fixed world size - 5x original 800px viewport
export const WORLD_HEIGHT = 3000; // Fixed world size - 5x original 600px viewport
export const VIEWPORT_WIDTH = CANVAS_WIDTH;
export const VIEWPORT_HEIGHT = CANVAS_HEIGHT;

// Zoom system
export const MAX_ZOOM_OUT = 3;
export const MIN_ZOOM = 1;
export const ZOOM_SPEED = 0.1;

// Bullet range (twice viewport width)
export const BULLET_RANGE = VIEWPORT_WIDTH * 2;

// Minimap
export const MINIMAP_WIDTH = 160;
export const MINIMAP_HEIGHT = 120;
export const MINIMAP_SCALE = MINIMAP_WIDTH / WORLD_WIDTH;

// Game constants for easy tuning and expansion
export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 900;
export const SHIP_SIZE = 10;
export const SHIP_SPEED = 0.12; // reduced for lower max ship speed
// One place to configure firing cadence (also used for hold fire)
const FIRE_RATE_MS = 250; // 4 shots per second
export const BULLET_FIRE_RATE = FIRE_RATE_MS; // backwards compatibility
export const BULLET_SPEED = 20; // slightly faster bullets
export const BULLET_LIFETIME = 100; // frames
export const ASTEROID_SPEED = 2;
export const ASTEROID_SIZE_LARGE = 40;
export const ASTEROID_SIZE_MEDIUM = 20;
export const ASTEROID_SIZE_SMALL = 10;
export const ASTEROID_SPLIT_SPEED_VARIANCE = 0.4; // speed scaling range when splitting
export const ASTEROID_ROTATION_VARIANCE = 0.1; // rotation speed range
export const ASTEROID_POINT_RANGE = 4; // additional points added to base shape (8-11)
export const STAR_COUNT = 2000; // Increased star density
export const STAR_MIN_BRIGHTNESS = 0.2;
export const STAR_MAX_BRIGHTNESS = 1.0;

// Game configuration constants
export const INITIAL_ASTEROID_COUNT = 5;
export const MAX_BULLETS = 5;
export const CROSSHAIR_SIZE = 10;
export const MOUSE_OFFSET = 50;
export const INITIAL_LIVES = 3;
export const BULLET_SIZE = 2;

// Loot & progression
export const XP_PICKUP_VALUE = 5;           // XP granted per pickup orb
export const CURRENCY_DROP_CHANCE = 0.4;    // Chance an asteroid drops currency
export const XP_DROP_WEIGHTS = [            // Bell-curve weights for XP orb count
  { amount: 1, weight: 0.1 },
  { amount: 2, weight: 0.25 },
  { amount: 3, weight: 0.3 },
  { amount: 4, weight: 0.25 },
  { amount: 5, weight: 0.1 },
];
export const CURRENCY_DROP_WEIGHTS = [      // Bell-curve weights for 1-5 currency
  { amount: 1, weight: 0.1 },
  { amount: 2, weight: 0.25 },
  { amount: 3, weight: 0.3 },
  { amount: 4, weight: 0.25 },
  { amount: 5, weight: 0.1 },
];
export const PICKUP_POP_SPEED = 1.4;        // Initial burst speed when spawned
export const PICKUP_DRAG = 0.92;            // Damping per frame while floating
export const PICKUP_ATTRACT_RADIUS = 220;   // Distance where pickups home to ship
export const PICKUP_COLLECT_RADIUS = 26;    // Distance to actually collect
export const PICKUP_MAX_SPEED = 6;          // Cap attraction velocity
export const PICKUP_LIFETIME_FRAMES = 60 * 15; // 15 seconds before fading
export const XP_LEVEL_BASE = 300;           // XP needed for level 1→2
export const XP_LEVEL_GROWTH = 1.25;        // Each level requires 25% more XP than previous
export const HYPER_JUMP_COUNTDOWN_MS = 5000; // Grace period before waves hyperspace

// Level-up effects
export const LEVELUP_PARTICLES = 225;       // +50% bigger burst
export const LEVELUP_PARTICLE_SPEED = 12;   // +50% faster particles
export const LEVELUP_PARTICLE_LIFE = 40;    // frames
export const LEVELUP_FLASH_DECAY = 0.02;    // alpha per frame (after hold)
export const LEVELUP_FLASH_HOLD = 12;       // frames to keep flash at full intensity
export const LEVELUP_TEXT_TIME = 120;       // frames to show text (~2s)

// Stage Clear effect timings (in frames)
export const STAGE_CLEAR_SLIDE_TIME = 30;   // Time to slide in from left
export const STAGE_CLEAR_POP_TIME = 15;     // Time for pop animation
export const STAGE_CLEAR_HOLD_TIME = 45;    // Time to hold at center
export const STAGE_CLEAR_FADE_TIME = 20;    // Time to fade out

// HyperSpace Jump effect timings (in frames)  
export const HYPERSPACE_STREAK_TIME = 60;    // Time for stars to streak
export const HYPERSPACE_FADE_TIME = 30;      // Time to fade to black
export const HYPERSPACE_TEXT_TIME = 30;      // Time for text animation
export const HYPERSPACE_BRIGHTEN_TIME = 20;  // Time to brighten stars
export const HYPERSPACE_FLASH_TIME = 8;      // Time for white flash

// Star brightness thresholds
export const STAR_LARGE_THRESHOLD = 0.7;
export const STAR_MEDIUM_THRESHOLD = 0.4;

// Phase 2: Big Map constants
// Large world; shape is authoritative for the minimap
export const VIEWPORT_WIDTH = CANVAS_WIDTH;
export const VIEWPORT_HEIGHT = CANVAS_HEIGHT;
export const WORLD_WIDTH = 8000; // requested width
export const WORLD_HEIGHT = 5500; // requested height

// Zoom system
export const MAX_ZOOM_OUT = 3;
export const MIN_ZOOM = 1;
export const ZOOM_SPEED = 0.1;

// Bullet range (twice viewport width)
export const BULLET_RANGE = VIEWPORT_WIDTH * 2;

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

// Ship invulnerability and death pause
export const SHIP_INVULNERABILITY_MS = 2000; // 2 seconds
export const DEATH_PAUSE_MS = 1000;          // 1 second

// HUD positioning
export const HUD_GUTTER_PX = 24;

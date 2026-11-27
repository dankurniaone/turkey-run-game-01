// Gobble Dash — every tuning number and colour in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720, groundY: 620 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** Pixels of scrolling per metre of distance the turkey covers. */
export const PX_PER_M = 12;

/** Reach the woods at this distance and the turkey escapes: the run is won. */
export const GOAL_DISTANCE = 1000;

export const PLAYER = {
  x: 260,
  width: 60,
  height: 54,
  slideHeight: 34,
  gravity: 2600,
  jumpVelocity: 1100,
  /** Seconds of flashing protection after a hit. */
  invulnerable: 1.2,
};

export const LIVES = 3;

export const FARMER = {
  width: 66,
  height: 92,
  /** Gap in pixels between farmer and turkey when the run starts. */
  startGap: 230,
  /** Gap lost on every hit. */
  hitPush: 95,
  /** Gap regained per second after 3 clean seconds. */
  recoverRate: 26,
  recoverDelay: 3,
};

/** Base scroll speed in px/s, and how much faster the run gets per metre. */
export const SPEED = { base: 380, perMetre: 0.3, max: 660 };

/** Spawn pacing in seconds between obstacle patterns, per level. */
export const SPAWN = { base: 1.05, perLevel: 0.09, min: 0.62, jitter: 0.25 };

export const SCORE = { corn: 10, feather: 100, dodge: 5 };

/** Kinds of obstacle, with their box sizes. Knives fly; the rest sit on the ground. */
export const OBSTACLE = {
  hay: { width: 70, height: 64 },
  fence: { width: 46, height: 92 },
  oven: { width: 96, height: 104 },
  knifeHigh: { width: 96, height: 26, flyY: 430, extraSpeed: 210 },
  knifeLow: { width: 96, height: 26, flyY: 580, extraSpeed: 210 },
};

export const BEST_KEY = 'gobble-dash-best';

/** Dusk autumn palette for the farm at golden hour. */
export const PALETTE = {
  skyTop: '#f2a65a',
  skyMid: '#e76f51',
  skyLow: '#7b2d26',
  sun: '#ffd97a',
  hillFar: '#6d4c41',
  hillNear: '#4e342e',
  barn: '#5d2e1e',
  barnRoof: '#3e1f14',
  ground: '#6b4226',
  grass: '#7a9a3f',
  grassDark: '#5d7a2e',
};

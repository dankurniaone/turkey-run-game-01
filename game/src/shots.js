// The screenshot scenes behind ?shot=start|play|end|win. Each one plays the real
// rules forward from a fresh world for a fixed time, steered by a simple autopilot,
// so the frame is what a short game really looks like and the same seed always
// gives the same frame. The play pilot looks well ahead and survives; the end
// pilot looks only a moment ahead, so it is caught out once the pace rises, as a
// hurried player is; the win pilot looks far ahead and runs the whole 1000 m.
import { PLAYER, STEP } from './config.js';
import { EVENT_OVER } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 16;
const END_LIMIT_SECONDS = 600;
const WIN_LIMIT_SECONDS = 900;
const HORIZON_PLAY = 0.85;
const HORIZON_END = 0.18;
const HORIZON_WIN = 1.0;
const SAMPLE = 1 / 30;
const GROUND_KINDS = new Set(['hay', 'fence', 'oven', 'knifeLow']);

/** The nearest obstacle ahead of the turkey, if any. */
function nearestObstacle(state) {
  let nearest = null;
  for (const obstacle of state.obstacles) {
    if (obstacle.x + obstacle.width < PLAYER.x) continue;
    if (nearest === null || obstacle.x < nearest.x) nearest = obstacle;
  }
  return nearest;
}

/** Jump for ground obstacles and low knives; slide under high knives.
 * The jump fires when the obstacle is close enough that the turkey is still
 * airborne over its far edge, and not so early that it lands on it: the jump
 * carries the turkey about 0.8 s, so the window is roughly a quarter of a
 * second of travel ahead. `jumpLead` is that window in seconds of travel: a
 * good pilot uses 0.28, a hurried one 0.08 and jumps far too late. */
function autopilot(state, horizon, jumpLead, slideLead) {
  const player = state.player;
  const obstacle = nearestObstacle(state);
  if (obstacle === null) return { jump: false, slide: false };
  const gap = obstacle.x - PLAYER.x;
  const reach = state.speed * horizon;
  if (gap > reach + 120) return { jump: false, slide: false };
  if (obstacle.kind === 'knifeHigh') {
    // Slide under it on the ground; drop fast out of the air onto the ground.
    return { jump: false, slide: gap < reach * slideLead };
  }
  if (GROUND_KINDS.has(obstacle.kind)) {
    return { jump: player.grounded && gap < state.speed * jumpLead && gap > state.speed * 0.05, slide: false };
  }
  return { jump: false, slide: false };
}

/**
 * Set `world` to the named scene (start, play, end, win; any other name is start)
 * and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'end' && name !== 'win') {
    for (let index = 0; index < START_SECONDS / STEP; index += 1) world.step(STEP, { jump: false, slide: false }, true);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  const limit = name === 'end' ? END_LIMIT_SECONDS : name === 'win' ? WIN_LIMIT_SECONDS : PLAY_SECONDS;
  const horizon = name === 'end' ? HORIZON_END : name === 'win' ? HORIZON_WIN : HORIZON_PLAY;
  const jumpLead = name === 'end' ? 0.08 : 0.28;
  const slideLead = name === 'end' ? 0.2 : 0.6;
  for (let index = 0; index < limit / STEP; index += 1) {
    const events = world.step(STEP, autopilot(world.state, horizon, jumpLead, slideLead), false);
    if (events & EVENT_OVER) break;
  }
  // Round the clock to a whole second so the blinking "run again" line is lit
  // in a staged end frame, not caught in its dark half.
  world.state.time = Math.round(world.state.time);
  if (world.state.escaped) return { screen: SCREEN_WIN, best: world.state.score };
  if (world.state.over) return { screen: SCREEN_OVER, best: world.state.score };
  return { screen: SCREEN_PLAY, best: world.state.score };
}

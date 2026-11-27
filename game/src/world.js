// The run itself: a side-scrolling farmyard the turkey crosses from left to right.
// The turkey auto-runs; the player jumps and slides. A farmer chases from the left
// and closes in on every hit; three hits and he makes the catch. Reach 1000 m and
// the turkey slips into the woods and escapes.
import {
  FIELD,
  STEP,
  PX_PER_M,
  GOAL_DISTANCE,
  PLAYER,
  LIVES,
  FARMER,
  SPEED,
  SPAWN,
  SCORE,
  OBSTACLE,
} from './config.js';
import { pickWeighted } from './random.js';

export const EVENT_HIT = 1;
export const EVENT_OVER = 2;
export const EVENT_ESCAPED = 4;
export const EVENT_CORN = 8;
export const EVENT_FEATHER = 16;
export const EVENT_LEVEL = 32;
export const EVENT_LAND = 64;

/** Patterns the spawner can lay down, gated by level. [weight, name] */
function patternTable(level) {
  const table = [
    [3, 'hay'],
    [3, 'fence'],
    [2, 'cornLine'],
    [2, 'hayFence'],
  ];
  if (level >= 2) table.push([2, 'oven'], [2, 'knifeHigh'], [2, 'knifeLow'], [2, 'cornArc']);
  if (level >= 3) table.push([2, 'ovenKnife'], [2, 'fenceKnife'], [1, 'feather']);
  if (level >= 4) table.push([2, 'hayHayOven']);
  return table;
}

export function createWorld(random) {
  const state = {
    time: 0,
    distance: 0,
    score: 0,
    bonus: 0,
    lives: LIVES,
    level: 1,
    speed: SPEED.base,
    scrollX: 0,
    player: {
      y: FIELD.groundY - PLAYER.height,
      vy: 0,
      grounded: true,
      sliding: false,
      slideT: 0,
      invulnT: 0,
      runCycle: 0,
    },
    farmerGap: FARMER.startGap,
    lastHitAt: -99,
    obstacles: [],
    pickups: [],
    particles: [],
    leaves: [],
    spawnIn: 420,
    dustT: 0,
    over: false,
    escaped: false,
    cause: '',
    cornCollected: 0,
    dodged: 0,
    toast: null,
  };

  for (let index = 0; index < 14; index += 1) {
    state.leaves.push({
      x: random() * FIELD.width,
      y: random() * 420,
      vx: 20 + random() * 30,
      vy: 12 + random() * 22,
      rot: random() * Math.PI * 2,
      vr: (random() - 0.5) * 2,
      size: 5 + random() * 7,
      color: ['#c96f2e', '#d9a441', '#a34d1f', '#e0b34c'][Math.floor(random() * 4)],
    });
  }

  function reset() {
    state.time = 0;
    state.distance = 0;
    state.score = 0;
    state.bonus = 0;
    state.lives = LIVES;
    state.level = 1;
    state.speed = SPEED.base;
    state.player.y = FIELD.groundY - PLAYER.height;
    state.player.vy = 0;
    state.player.grounded = true;
    state.player.sliding = false;
    state.player.slideT = 0;
    state.player.invulnT = 0;
    state.farmerGap = FARMER.startGap;
    state.lastHitAt = -99;
    state.obstacles = [];
    state.pickups = [];
    state.particles = [];
    state.spawnIn = 420;
    state.over = false;
    state.escaped = false;
    state.cause = '';
    state.cornCollected = 0;
    state.dodged = 0;
    state.toast = null;
  }

  function addObstacle(kind, x) {
    const spec = OBSTACLE[kind];
    const y = kind === 'knifeHigh' || kind === 'knifeLow' ? spec.flyY : FIELD.groundY - spec.height;
    state.obstacles.push({ kind, x, y, width: spec.width, height: spec.height, scored: false, seed: random() });
  }

  function addCorn(x, y) {
    state.pickups.push({ kind: 'corn', x, y, width: 30, height: 44, taken: false, bob: random() * Math.PI * 2 });
  }

  function addFeather(x, y) {
    state.pickups.push({ kind: 'feather', x, y, width: 34, height: 40, taken: false, bob: random() * Math.PI * 2 });
  }

  /** Lay one pattern at the right edge; return its length in pixels. */
  function spawnPattern() {
    const level = state.level;
    const name = pickWeighted(random, patternTable(level));
    const x = FIELD.width + 60;
    let length = 160;
    if (name === 'hay') {
      addObstacle('hay', x);
      length = 70;
    } else if (name === 'fence') {
      addObstacle('fence', x);
      length = 46;
    } else if (name === 'oven') {
      addObstacle('oven', x);
      length = 104;
    } else if (name === 'knifeHigh') {
      // A high knife never follows a ground obstacle closely: it is placed
      // 500 px further out, so the turkey has landed from any jump before it
      // arrives. Jumping for the obstacle before it would mean eating the
      // knife mid-air.
      addObstacle('knifeHigh', x + 500);
      length = 596;
    } else if (name === 'knifeLow') {
      addObstacle('knifeLow', x);
      length = 96;
    } else if (name === 'cornLine') {
      for (let index = 0; index < 4; index += 1) addCorn(x + index * 52, FIELD.groundY - 46);
      length = 210;
    } else if (name === 'cornArc') {
      addObstacle('hay', x + 90);
      const heights = [62, 128, 168, 128, 62];
      for (let index = 0; index < 5; index += 1) {
        addCorn(x + index * 46, FIELD.groundY - heights[index] - 20);
      }
      length = 250;
    } else if (name === 'hayFence') {
      // One jump clears both: they sit close together.
      addObstacle('hay', x);
      addObstacle('fence', x + 100);
      length = 146;
    } else if (name === 'hayHayOven') {
      // Two hays in one jump, then a long breath, then the oven.
      addObstacle('hay', x);
      addObstacle('hay', x + 100);
      addObstacle('oven', x + 680);
      length = 776;
    } else if (name === 'ovenKnife') {
      addObstacle('oven', x);
      addObstacle('knifeHigh', x + 620);
      length = 716;
    } else if (name === 'fenceKnife') {
      addObstacle('fence', x);
      addObstacle('knifeLow', x + 620);
      length = 716;
    } else if (name === 'feather') {
      addObstacle('fence', x);
      addFeather(x + 170, FIELD.groundY - 210);
      length = 220;
    }
    return length;
  }

  function burst(x, y, color, count, speed) {
    for (let index = 0; index < count; index += 1) {
      const angle = random() * Math.PI * 2;
      const velocity = speed * (0.4 + random() * 0.8);
      state.particles.push({
        x, y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 40,
        life: 0.5 + random() * 0.4,
        maxLife: 0.9,
        size: 3 + random() * 5,
        color,
      });
    }
  }

  function hit() {
    state.lives -= 1;
    state.player.invulnT = PLAYER.invulnerable;
    state.farmerGap -= FARMER.hitPush;
    state.lastHitAt = state.time;
    burst(PLAYER.x + 30, state.player.y + 20, '#f5e6c8', 14, 260);
    burst(PLAYER.x + 30, state.player.y + 20, '#8b5a2b', 8, 180);
    if (state.lives <= 0) {
      state.over = true;
      state.cause = 'caught';
      return EVENT_HIT | EVENT_OVER;
    }
    return EVENT_HIT;
  }

  function boxesOverlap(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  /**
   * Advance the world one fixed step. `action` is { jump, slide } for this step.
   * In attract mode the background scrolls and the turkey runs in place with no
   * obstacles, no farmer pressure and no score: the title screen's living backdrop.
   */
  function step(dt, action, attract) {
    void STEP;
    state.time += dt;
    const player = state.player;
    player.runCycle += dt * (attract ? 9 : state.speed / 42);
    state.scrollX += state.speed * dt * (attract ? 0.4 : 1);

    for (const leaf of state.leaves) {
      leaf.x -= (leaf.vx + state.speed * 0.12) * dt;
      leaf.y += leaf.vy * dt;
      leaf.rot += leaf.vr * dt;
      if (leaf.x < -20) {
        leaf.x = FIELD.width + 10;
        leaf.y = random() * 380;
      }
      if (leaf.y > FIELD.groundY + 10) leaf.y = -10;
    }

    if (attract) return 0;

    state.speed = Math.min(SPEED.max, SPEED.base + state.distance * SPEED.perMetre);
    state.distance += (state.speed * dt) / PX_PER_M;
    const level = Math.min(5, Math.floor(state.distance / 250) + 1);
    let events = 0;
    if (level !== state.level) {
      state.level = level;
      state.toast = { text: `LEVEL ${level} — FASTER!`, t: 2 };
      events |= EVENT_LEVEL;
    }
    if (state.toast) {
      state.toast.t -= dt;
      if (state.toast.t <= 0) state.toast = null;
    }

    // The farmer falls back after a few clean seconds.
    if (state.time - state.lastHitAt > FARMER.recoverDelay) {
      state.farmerGap = Math.min(FARMER.startGap, state.farmerGap + FARMER.recoverRate * dt);
    }

    // Player vertical motion: jump on the edge, slide drops fast from the air.
    if (action.jump && player.grounded) {
      player.vy = -PLAYER.jumpVelocity;
      player.grounded = false;
      player.sliding = false;
      player.slideT = 0;
    }
    if (action.slide && !player.grounded) player.vy += 1800 * dt;
    if (action.slide && player.grounded) {
      player.sliding = true;
      player.slideT = 0.55;
    }
    if (player.slideT > 0) {
      player.slideT -= dt;
      if (player.slideT <= 0) player.sliding = false;
    }
    player.vy += PLAYER.gravity * dt;
    player.y += player.vy * dt;
    if (player.y >= FIELD.groundY - PLAYER.height) {
      if (!player.grounded && player.vy > 300) events |= EVENT_LAND;
      player.y = FIELD.groundY - PLAYER.height;
      player.vy = 0;
      player.grounded = true;
    } else {
      player.grounded = false;
    }
    if (player.invulnT > 0) player.invulnT -= dt;

    // Running dust at the turkey's feet.
    state.dustT -= dt;
    if (player.grounded && state.dustT <= 0) {
      state.dustT = 0.07;
      state.particles.push({
        x: PLAYER.x + 8, y: FIELD.groundY - 4,
        vx: -60 - random() * 40, vy: -20 - random() * 30,
        life: 0.4, maxLife: 0.4, size: 4 + random() * 4, color: '#c9a06a',
      });
    }

    // Spawn the next pattern once the last one has room behind it. The room is
    // time-based, not distance-based: after the turkey lands from the last jump
    // of one pattern (about 0.6 s after it passes), the next pattern must still
    // be a full jump-lead away, or the turkey lands on top of it.
    state.spawnIn -= state.speed * dt;
    if (state.spawnIn <= 0) {
      const length = spawnPattern();
      state.spawnIn = length + state.speed * 0.9;
    }

    // A forgiving hitbox: the turkey's box is inset so a graze of a few pixels
    // on a landing never counts as a hit.
    const turkeyBox = {
      x: PLAYER.x + 10,
      y: player.y + 6,
      width: PLAYER.width - 20,
      height: (player.sliding ? PLAYER.slideHeight : PLAYER.height) - 8,
    };
    if (player.sliding) turkeyBox.y = FIELD.groundY - PLAYER.slideHeight + 2;

    // Obstacles scroll in, knives fly faster than the ground moves.
    for (const obstacle of state.obstacles) {
      const extra = obstacle.kind === 'knifeHigh' || obstacle.kind === 'knifeLow' ? OBSTACLE[obstacle.kind].extraSpeed : 0;
      obstacle.x -= (state.speed + extra) * dt;
      if (!obstacle.scored && obstacle.x + obstacle.width < PLAYER.x) {
        obstacle.scored = true;
        state.bonus += SCORE.dodge;
        state.dodged += 1;
      }
      if (obstacle.kind === 'oven' && random() < 0.25) {
        state.particles.push({
          x: obstacle.x + 20 + random() * 60, y: obstacle.y + 6,
          vx: (random() - 0.5) * 20, vy: -50 - random() * 40,
          life: 0.7, maxLife: 0.7, size: 5 + random() * 6, color: '#8d8d8d',
        });
      }
    }
    state.obstacles = state.obstacles.filter((obstacle) => obstacle.x > -220);

    // Pickups drift with the world and bob gently.
    for (const pickup of state.pickups) {
      pickup.x -= state.speed * dt;
      pickup.bob += dt * 3;
    }
    state.pickups = state.pickups.filter((pickup) => pickup.x > -80);

    // Collisions, skipped while flashing after a hit.
    if (player.invulnT <= 0) {
      for (const obstacle of state.obstacles) {
        const box = { x: obstacle.x + 6, y: obstacle.y + 6, width: obstacle.width - 12, height: obstacle.height - 12 };
        if (boxesOverlap(turkeyBox, box)) {
          events |= hit();
          break;
        }
      }
    }
    if (!state.over) {
      for (const pickup of state.pickups) {
        if (pickup.taken) continue;
        const box = { x: pickup.x, y: pickup.y + Math.sin(pickup.bob) * 4, width: pickup.width, height: pickup.height };
        if (boxesOverlap(turkeyBox, box)) {
          pickup.taken = true;
          if (pickup.kind === 'corn') {
            state.bonus += SCORE.corn;
            state.cornCollected += 1;
            events |= EVENT_CORN;
            burst(pickup.x + 15, pickup.y + 20, '#ffd94d', 8, 140);
          } else {
            state.bonus += SCORE.feather;
            events |= EVENT_FEATHER;
            burst(pickup.x + 17, pickup.y + 20, '#ffcf3f', 16, 220);
          }
        }
      }
    }
    state.pickups = state.pickups.filter((pickup) => !pickup.taken);

    // Particles fade and fall.
    for (const particle of state.particles) {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 300 * dt;
    }
    state.particles = state.particles.filter((particle) => particle.life > 0);

    state.score = Math.floor(state.distance) + state.bonus;

    if (state.distance >= GOAL_DISTANCE) {
      state.over = true;
      state.escaped = true;
      state.cause = 'escaped';
      return events | EVENT_ESCAPED | EVENT_OVER;
    }
    if (state.farmerGap <= 0) {
      state.over = true;
      state.cause = 'caught';
      return events | EVENT_OVER;
    }
    return events;
  }

  return { state, reset, step };
}

// A small seeded random number generator: the same seed gives the same run, which
// is what makes the screenshot scenes repeatable and the game fair to test.
export function createRandom(seed) {
  let state = seed >>> 0;
  if (state === 0) state = 0x9e3779b9;
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick one entry from a weighted table: [[weight, value], ...]. */
export function pickWeighted(random, table) {
  let total = 0;
  for (const [weight] of table) total += weight;
  let roll = random() * total;
  for (const [weight, value] of table) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return table[table.length - 1][1];
}

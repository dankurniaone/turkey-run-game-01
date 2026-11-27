# Gobble Dash — Thanksgiving Turkey Run

[![make.fun](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/competitions/turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/dankurniaone/turkey-run-game-01/rank.svg)](https://make.fun/competitions/turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/dankurniaone/turkey-run-game-01/reward.svg)](https://make.fun/competitions/turkey-run-game-01)

A make.fun entry for [turkey-run-game-01](https://make.fun/competitions/turkey-run-game-01): the best turkey escape game.

## The game

Thanksgiving is coming, the farmer is on your tail, and the woods are 1000 metres away. You are the turkey. Run the farmyard at golden hour, jump the hay bales, fences and the blazing oven, slide under the high carving knives, leap the low ones, and grab corn on the way. Three hits and the farmer makes the catch. Reach the woods and Thanksgiving is saved.

- **Side-scrolling runner** — the turkey auto-runs; you jump and slide.
- **The farmer chases** — every hit brings him closer; run clean and he falls back.
- **Oven and carving knives** — the oven glows and smokes, knives fly high (slide!) or low (jump!).
- **Corn and the golden feather** — corn for points, the rare feather for 100.
- **Full game** — title screen, HUD (score, distance to the woods, lives, best), pause, caught and escaped end screens with restart.
- **Original everything** — all art is drawn on canvas, all sounds are synthesised live with WebAudio. No image or audio files, no network requests, no libraries.

## Controls

| Input | Action |
|---|---|
| Space / ↑ / W / click | Jump (and start / restart) |
| ↓ / S | Slide under high knives (drops fast from the air) |
| P | Pause |
| M | Mute |

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

`main.ts` (Node 22, standard library only) hands the game in: it copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json`.

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Layout

- `game/index.html` — the page; `game/src/` — the game, one job per file: `config.js` (tuning), `random.js` (seeded RNG), `audio.js` (synth sounds), `world.js` (rules), `input.js` (keyboard + mouse), `render.js` (all the art), `shots.js` (screenshot scenes), `main.js` (boot + loop).
- `screenshots/` — real renders of the game's own code: title, a run in play, caught, escaped.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.
- `shots.json` — the four screenshot scenes and their seeds.

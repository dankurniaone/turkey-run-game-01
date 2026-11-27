// Everything the eye sees: a dusk farm at golden hour, drawn on one canvas. The
// renderer scales the fixed 1280x720 field to the window and paints the world, the
// HUD and the screens. All art is drawn here — no image files, no network.
import { FIELD, PLAYER, FARMER, GOAL_DISTANCE, PALETTE } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

function hash(index) {
  const value = Math.sin(index * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let view = { scale: 1, offsetX: 0, offsetY: 0, dpr: 1 };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const scale = Math.min(width / FIELD.width, height / FIELD.height);
    view = { scale, offsetX: (width - FIELD.width * scale) / 2, offsetY: (height - FIELD.height * scale) / 2, dpr };
  }
  resize();
  window.addEventListener('resize', resize);

  function frame() {
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.fillStyle = '#241018';
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.setTransform(view.dpr * view.scale, 0, 0, view.dpr * view.scale, view.dpr * view.offsetX, view.dpr * view.offsetY);
  }

  function roundRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }

  function drawSky(state) {
    const gradient = ctx.createLinearGradient(0, 0, 0, FIELD.groundY);
    gradient.addColorStop(0, PALETTE.skyTop);
    gradient.addColorStop(0.55, PALETTE.skyMid);
    gradient.addColorStop(1, PALETTE.skyLow);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, FIELD.width, FIELD.groundY);
    // Low sun, glowing over the farm.
    const sunX = 1060;
    const sunY = 150;
    const glow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 180);
    glow.addColorStop(0, 'rgba(255, 217, 122, 0.9)');
    glow.addColorStop(1, 'rgba(255, 217, 122, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(sunX - 180, sunY - 180, 360, 360);
    ctx.fillStyle = PALETTE.sun;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 52, 0, Math.PI * 2);
    ctx.fill();
    // Slow clouds drifting with the wind.
    ctx.fillStyle = 'rgba(255, 235, 205, 0.75)';
    for (let index = 0; index < 5; index += 1) {
      const cx = ((index * 340 - state.scrollX * 0.06) % 1500 + 1500) % 1500 - 110;
      const cy = 70 + index * 46;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 74, 20, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 44, cy + 8, 52, 16, 0, 0, Math.PI * 2);
      ctx.ellipse(cx - 48, cy + 9, 46, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawHills(state) {
    ctx.fillStyle = PALETTE.hillFar;
    ctx.beginPath();
    ctx.moveTo(0, FIELD.groundY);
    for (let x = 0; x <= FIELD.width; x += 40) {
      const wx = x + state.scrollX * 0.2;
      ctx.lineTo(x, FIELD.groundY - 150 - Math.sin(wx * 0.004) * 55 - Math.sin(wx * 0.0013) * 40);
    }
    ctx.lineTo(FIELD.width, FIELD.groundY);
    ctx.closePath();
    ctx.fill();
    // Far tree line.
    ctx.fillStyle = PALETTE.hillNear;
    for (let index = 0; index < 26; index += 1) {
      const wx = index * 130 - ((state.scrollX * 0.25) % 130);
      const treeX = wx - 130;
      const treeH = 60 + hash(index) * 50;
      ctx.beginPath();
      ctx.moveTo(treeX, FIELD.groundY - 96);
      ctx.lineTo(treeX + 26, FIELD.groundY - 96 - treeH);
      ctx.lineTo(treeX + 52, FIELD.groundY - 96);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawBarn(state) {
    const spacing = 1500;
    const offset = -((state.scrollX * 0.4) % spacing);
    for (let base = offset - spacing; base < FIELD.width + spacing; base += spacing) {
      const bx = base + 180;
      const by = FIELD.groundY - 96;
      // Silo.
      ctx.fillStyle = PALETTE.barnRoof;
      ctx.fillRect(bx + 210, by - 150, 64, 150);
      ctx.beginPath();
      ctx.arc(bx + 242, by - 150, 32, Math.PI, 0);
      ctx.fill();
      // Barn body and gambrel roof.
      ctx.fillStyle = PALETTE.barn;
      ctx.fillRect(bx, by - 110, 190, 110);
      ctx.fillStyle = PALETTE.barnRoof;
      ctx.beginPath();
      ctx.moveTo(bx - 12, by - 110);
      ctx.lineTo(bx + 40, by - 168);
      ctx.lineTo(bx + 150, by - 168);
      ctx.lineTo(bx + 202, by - 110);
      ctx.closePath();
      ctx.fill();
      // Door cross and hayloft window.
      ctx.strokeStyle = '#d9a441';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(bx + 75, by - 84);
      ctx.lineTo(bx + 115, by - 24);
      ctx.moveTo(bx + 115, by - 84);
      ctx.lineTo(bx + 75, by - 24);
      ctx.stroke();
      ctx.fillStyle = '#ffd97a';
      ctx.fillRect(bx + 82, by - 148, 26, 22);
    }
  }

  function drawFence(state) {
    const spacing = 96;
    const offset = -((state.scrollX * 0.7) % spacing);
    ctx.strokeStyle = '#4a2c17';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, FIELD.groundY - 62);
    ctx.lineTo(FIELD.width, FIELD.groundY - 62);
    ctx.moveTo(0, FIELD.groundY - 34);
    ctx.lineTo(FIELD.width, FIELD.groundY - 34);
    ctx.stroke();
    ctx.fillStyle = '#5d3a20';
    for (let x = offset; x < FIELD.width + spacing; x += spacing) {
      ctx.fillRect(x, FIELD.groundY - 84, 12, 84);
    }
  }

  function drawGround(state) {
    ctx.fillStyle = PALETTE.ground;
    ctx.fillRect(0, FIELD.groundY, FIELD.width, FIELD.height - FIELD.groundY);
    ctx.fillStyle = PALETTE.grass;
    ctx.fillRect(0, FIELD.groundY, FIELD.width, 12);
    ctx.fillStyle = PALETTE.grassDark;
    for (let index = 0; index < 40; index += 1) {
      const wx = index * 64 - ((state.scrollX) % 64);
      const tuftX = wx - 64;
      const lean = (hash(index) - 0.5) * 14;
      const height = 10 + hash(index + 50) * 12;
      ctx.beginPath();
      ctx.moveTo(tuftX, FIELD.groundY + 12);
      ctx.lineTo(tuftX + lean, FIELD.groundY + 12 - height);
      ctx.lineTo(tuftX + 8, FIELD.groundY + 12);
      ctx.closePath();
      ctx.fill();
    }
    // Fallen leaves resting on the dirt.
    for (let index = 0; index < 24; index += 1) {
      const wx = index * 110 - ((state.scrollX) % 110);
      const leafX = wx - 110;
      ctx.fillStyle = index % 3 === 0 ? '#c96f2e' : '#d9a441';
      ctx.beginPath();
      ctx.ellipse(leafX, FIELD.groundY + 34 + hash(index + 9) * 50, 7, 3, hash(index) * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawTurkey(state, screen) {
    const player = state.player;
    const x = PLAYER.x;
    const top = player.y;
    // Flash while invulnerable after a hit.
    if (player.invulnT > 0 && Math.floor(state.time * 12) % 2 === 0) return;
    const cycle = player.runCycle;
    const legSwing = player.grounded ? Math.sin(cycle) * 12 : 0;
    const bodyY = top + 22 + (player.grounded ? Math.abs(Math.sin(cycle)) * -3 : 0);
    ctx.save();
    ctx.translate(x, 0);
    if (player.sliding) {
      // Low and stretched: beak forward, tail back, legs tucked.
      ctx.translate(0, FIELD.groundY - PLAYER.slideHeight);
      ctx.fillStyle = '#6b4423';
      ctx.beginPath();
      ctx.ellipse(30, 20, 34, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8b5a2b';
      ctx.beginPath();
      ctx.ellipse(28, 16, 30, 14, -0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#a06835';
      ctx.beginPath();
      ctx.arc(56, 10, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f08c1e';
      ctx.beginPath();
      ctx.moveTo(66, 8);
      ctx.lineTo(80, 12);
      ctx.lineTo(66, 16);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#d9382b';
      ctx.beginPath();
      ctx.arc(60, 20, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2b2b2b';
      ctx.beginPath();
      ctx.arc(59, 7, 2.4, 0, Math.PI * 2);
      ctx.fill();
      // Tail streaming behind.
      ctx.strokeStyle = '#5d3a1a';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(0, 22);
      ctx.lineTo(-26, 12);
      ctx.moveTo(2, 26);
      ctx.lineTo(-24, 24);
      ctx.stroke();
      ctx.restore();
      return;
    }
    // Tail fan, swaying with the run.
    const sway = Math.sin(cycle * 0.7) * 0.06;
    for (let index = -2; index <= 2; index += 1) {
      const angle = -Math.PI / 2 + index * 0.32 + sway;
      const featherX = 8 + Math.cos(angle) * 34;
      const featherY = bodyY - 6 + Math.sin(angle) * 34;
      ctx.fillStyle = index === 0 ? '#7a4a22' : '#8b5a2b';
      ctx.beginPath();
      ctx.ellipse(featherX, featherY, 9, 20, angle + Math.PI / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c98a3f';
      ctx.beginPath();
      ctx.ellipse(featherX + Math.cos(angle) * 8, featherY + Math.sin(angle) * 8, 4, 9, angle + Math.PI / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Legs: two orange legs scissoring while running, tucked while airborne.
    ctx.strokeStyle = '#f08c1e';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    const hipY = bodyY + 18;
    if (player.grounded) {
      ctx.beginPath();
      ctx.moveTo(18, hipY);
      ctx.lineTo(18 + legSwing, FIELD.groundY);
      ctx.moveTo(38, hipY);
      ctx.lineTo(38 - legSwing, FIELD.groundY);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(18, hipY);
      ctx.lineTo(26, FIELD.groundY - 8);
      ctx.moveTo(38, hipY);
      ctx.lineTo(44, FIELD.groundY - 6);
      ctx.stroke();
    }
    // Body.
    ctx.fillStyle = '#8b5a2b';
    ctx.beginPath();
    ctx.ellipse(28, bodyY, 30, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a06835';
    ctx.beginPath();
    ctx.ellipse(34, bodyY + 6, 20, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wing, flapping wide in the air.
    const wingAngle = player.grounded ? Math.sin(cycle) * 0.25 : -0.9;
    ctx.save();
    ctx.translate(24, bodyY - 2);
    ctx.rotate(wingAngle);
    ctx.fillStyle = '#6b4423';
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Head, beak, wattle, eye.
    ctx.fillStyle = '#a06835';
    ctx.beginPath();
    ctx.arc(54, bodyY - 16, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f08c1e';
    ctx.beginPath();
    ctx.moveTo(64, bodyY - 18);
    ctx.lineTo(80, bodyY - 13);
    ctx.lineTo(64, bodyY - 9);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d9382b';
    ctx.beginPath();
    ctx.ellipse(58, bodyY - 4, 4, 7, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2b2b2b';
    ctx.beginPath();
    ctx.arc(57, bodyY - 19, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    void screen;
  }

  function drawFarmer(state) {
    const cycle = state.player.runCycle;
    const gap = state.farmerGap;
    const x = PLAYER.x - gap - FARMER.width;
    const top = FIELD.groundY - FARMER.height;
    const swing = Math.sin(cycle) * 14;
    // Straw hat.
    ctx.fillStyle = '#e0b34c';
    ctx.beginPath();
    ctx.ellipse(x + 33, top + 8, 34, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 33, top + 2, 20, 9, 0, Math.PI, 0);
    ctx.fill();
    // Face and moustache.
    ctx.fillStyle = '#e8b88a';
    ctx.beginPath();
    ctx.arc(x + 33, top + 22, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5d3a1a';
    ctx.fillRect(x + 24, top + 28, 18, 5);
    ctx.fillStyle = '#2b2b2b';
    ctx.beginPath();
    ctx.arc(x + 39, top + 20, 2.4, 0, Math.PI * 2);
    ctx.fill();
    // Red shirt, blue overalls.
    ctx.fillStyle = '#b3372e';
    ctx.fillRect(x + 14, top + 38, 38, 26);
    ctx.fillStyle = '#2e4a7a';
    ctx.fillRect(x + 16, top + 58, 34, 34);
    ctx.fillRect(x + 16, top + 38, 8, 24);
    ctx.fillRect(x + 42, top + 38, 8, 24);
    // Legs running.
    ctx.strokeStyle = '#2e4a7a';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 24, top + 88);
    ctx.lineTo(x + 24 + swing, FIELD.groundY);
    ctx.moveTo(x + 42, top + 88);
    ctx.lineTo(x + 42 - swing, FIELD.groundY);
    ctx.stroke();
    // Pitchfork held high, prongs glinting.
    ctx.strokeStyle = '#7a5a34';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 52, top + 44);
    ctx.lineTo(x + 66, top - 6);
    ctx.stroke();
    ctx.strokeStyle = '#c8c8c8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 66, top - 6);
    ctx.lineTo(x + 60, top - 20);
    ctx.moveTo(x + 66, top - 6);
    ctx.lineTo(x + 66, top - 21);
    ctx.moveTo(x + 66, top - 6);
    ctx.lineTo(x + 72, top - 20);
    ctx.stroke();
  }

  function drawObstacle(obstacle, state) {
    const { kind, x, y, width, height } = obstacle;
    if (kind === 'hay') {
      ctx.fillStyle = '#d9a441';
      roundRect(x, y, width, height, 10);
      ctx.fill();
      ctx.strokeStyle = '#a87c22';
      ctx.lineWidth = 3;
      for (let index = 0; index < 4; index += 1) {
        ctx.beginPath();
        ctx.moveTo(x + 8, y + 12 + index * 14);
        ctx.lineTo(x + width - 8, y + 10 + index * 14);
        ctx.stroke();
      }
      ctx.fillStyle = '#e8c268';
      ctx.beginPath();
      ctx.ellipse(x + width / 2, y + 10, width / 2 - 6, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === 'fence') {
      ctx.fillStyle = '#6b4423';
      ctx.fillRect(x, y, 10, height);
      ctx.fillRect(x + width - 10, y, 10, height);
      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(x - 4, y + 16, width + 8, 10);
      ctx.fillRect(x - 4, y + 52, width + 8, 10);
      ctx.fillStyle = '#a06835';
      ctx.beginPath();
      ctx.moveTo(x + 5, y - 6);
      ctx.lineTo(x + 5, y);
      ctx.lineTo(x + width - 5, y);
      ctx.lineTo(x + width - 5, y - 6);
      ctx.closePath();
      ctx.fill();
    } else if (kind === 'oven') {
      const flicker = Math.sin(state.time * 14 + obstacle.seed * 20) * 0.5 + 0.5;
      const glow = ctx.createRadialGradient(x + width / 2, y + height - 20, 6, x + width / 2, y + height - 20, 90);
      glow.addColorStop(0, `rgba(255, 140, 40, ${0.35 + flicker * 0.25})`);
      glow.addColorStop(1, 'rgba(255, 140, 40, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x - 50, y - 60, width + 100, height + 80);
      ctx.fillStyle = '#7a3b22';
      ctx.fillRect(x, y, width, height);
      ctx.fillStyle = '#8d4a2c';
      ctx.fillRect(x, y, width, 10);
      // Brick courses.
      ctx.strokeStyle = '#5d2a18';
      ctx.lineWidth = 2;
      for (let row = 0; row < 4; row += 1) {
        ctx.beginPath();
        ctx.moveTo(x, y + 28 + row * 24);
        ctx.lineTo(x + width, y + 28 + row * 24);
        ctx.stroke();
      }
      // Arched mouth with fire.
      ctx.fillStyle = '#1d0f08';
      ctx.beginPath();
      ctx.moveTo(x + 22, y + height);
      ctx.lineTo(x + 22, y + height - 46);
      ctx.arc(x + width / 2, y + height - 46, 30, Math.PI, 0);
      ctx.lineTo(x + width - 22, y + height);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ff8c28';
      ctx.beginPath();
      ctx.moveTo(x + 30, y + height);
      ctx.quadraticCurveTo(x + width / 2, y + height - 44 - flicker * 10, x + width - 30, y + height);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffd94d';
      ctx.beginPath();
      ctx.moveTo(x + 38, y + height);
      ctx.quadraticCurveTo(x + width / 2, y + height - 26 - flicker * 8, x + width - 38, y + height);
      ctx.closePath();
      ctx.fill();
      // Chimney.
      ctx.fillStyle = '#5d2a18';
      ctx.fillRect(x + width - 30, y - 26, 22, 26);
    } else if (kind === 'knifeHigh' || kind === 'knifeLow') {
      const wobble = Math.sin(state.time * 6 + obstacle.seed * 9) * 0.12;
      ctx.save();
      ctx.translate(x + width / 2, y + height / 2);
      ctx.rotate(wobble);
      // Blade.
      ctx.fillStyle = '#d7dde2';
      ctx.beginPath();
      ctx.moveTo(-48, -8);
      ctx.lineTo(28, -11);
      ctx.lineTo(48, 0);
      ctx.lineTo(28, 11);
      ctx.lineTo(-48, 8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#8a939c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-44, 0);
      ctx.lineTo(30, 0);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-30, -6);
      ctx.lineTo(10, -8);
      ctx.stroke();
      // Handle.
      ctx.fillStyle = '#5d3a1a';
      roundRect(-48 - 2, -9, 26, 18, 5);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawPickup(pickup) {
    const bobY = Math.sin(pickup.bob) * 4;
    const x = pickup.x;
    const y = pickup.y + bobY;
    if (pickup.kind === 'corn') {
      ctx.fillStyle = '#3f7a2e';
      ctx.beginPath();
      ctx.ellipse(x + 4, y + 34, 7, 14, -0.5, 0, Math.PI * 2);
      ctx.ellipse(x + 26, y + 34, 7, 14, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd94d';
      ctx.beginPath();
      ctx.ellipse(x + 15, y + 20, 11, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e8b83a';
      for (let row = 0; row < 4; row += 1) {
        for (let col = 0; col < 3; col += 1) {
          ctx.beginPath();
          ctx.arc(x + 8 + col * 7, y + 8 + row * 9, 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else {
      const glow = ctx.createRadialGradient(x + 17, y + 20, 4, x + 17, y + 20, 42);
      glow.addColorStop(0, 'rgba(255, 207, 63, 0.7)');
      glow.addColorStop(1, 'rgba(255, 207, 63, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x - 25, y - 22, 84, 84);
      ctx.fillStyle = '#ffcf3f';
      ctx.beginPath();
      ctx.moveTo(x + 17, y);
      ctx.quadraticCurveTo(x + 34, y + 16, x + 20, y + 38);
      ctx.quadraticCurveTo(x + 8, y + 22, x + 17, y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#b8860b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 17, y + 2);
      ctx.lineTo(x + 19, y + 36);
      ctx.stroke();
    }
  }

  function drawParticles(state) {
    for (const particle of state.particles) {
      const alpha = Math.max(0, particle.life / particle.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const leaf of state.leaves) {
      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      ctx.rotate(leaf.rot);
      ctx.fillStyle = leaf.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, leaf.size, leaf.size * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawHeart(x, y, size, filled) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 16, size / 16);
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.bezierCurveTo(-9, -3, -15, 3, -8, 10);
    ctx.bezierCurveTo(-4, 14, 0, 16, 0, 16);
    ctx.bezierCurveTo(0, 16, 4, 14, 8, 10);
    ctx.bezierCurveTo(15, 3, 9, -3, 0, 5);
    ctx.closePath();
    if (filled) {
      ctx.fillStyle = '#e63946';
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawHUD(state, screen, best) {
    ctx.textBaseline = 'alphabetic';
    // Score, top left.
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff8e7';
    ctx.font = '800 34px system-ui, sans-serif';
    ctx.fillText(`SCORE ${state.score}`, 24, 48);
    ctx.fillStyle = 'rgba(255, 248, 231, 0.75)';
    ctx.font = '700 18px system-ui, sans-serif';
    ctx.fillText(`BEST ${Math.max(best, state.score)}`, 24, 76);
    // Distance bar, top centre: the run to the woods.
    const barX = FIELD.width / 2 - 210;
    const barY = 26;
    const barW = 420;
    const progress = Math.min(1, state.distance / GOAL_DISTANCE);
    ctx.fillStyle = 'rgba(20, 10, 8, 0.55)';
    roundRect(barX - 8, barY - 8, barW + 16, 44, 12);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 248, 231, 0.25)';
    roundRect(barX, barY, barW, 16, 8);
    ctx.fill();
    ctx.fillStyle = '#7a9a3f';
    if (progress > 0) {
      roundRect(barX, barY, Math.max(16, barW * progress), 16, 8);
      ctx.fill();
    }
    // Little woods at the end of the bar.
    ctx.fillStyle = '#2e5d23';
    ctx.beginPath();
    ctx.moveTo(barX + barW + 2, barY + 16);
    ctx.lineTo(barX + barW + 10, barY - 8);
    ctx.lineTo(barX + barW + 18, barY + 16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff8e7';
    ctx.font = '800 17px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(state.distance)} m / ${GOAL_DISTANCE} m`, FIELD.width / 2, barY + 32);
    // Lives, top right.
    for (let index = 0; index < 3; index += 1) {
      drawHeart(FIELD.width - 40 - index * 40, 34, 30, index < state.lives);
    }
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255, 248, 231, 0.75)';
    ctx.font = '700 16px system-ui, sans-serif';
    ctx.fillText(`LEVEL ${state.level}`, FIELD.width - 24, 76);
    // Level-up toast: only while playing, never over an end screen.
    if (state.toast && (screen === SCREEN_PLAY || screen === SCREEN_PAUSED)) {
      ctx.globalAlpha = Math.min(1, state.toast.t);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd97a';
      ctx.font = '800 40px system-ui, sans-serif';
      ctx.fillText(state.toast.text, FIELD.width / 2, 170);
      ctx.globalAlpha = 1;
    }
  }

  function dimScreen(alpha) {
    ctx.fillStyle = `rgba(24, 10, 6, ${alpha})`;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }

  function panel(x, y, width, height) {
    ctx.fillStyle = 'rgba(28, 14, 8, 0.82)';
    roundRect(x, y, width, height, 18);
    ctx.fill();
    ctx.strokeStyle = '#d9a441';
    ctx.lineWidth = 3;
    roundRect(x, y, width, height, 18);
    ctx.stroke();
  }

  function drawTitle(state, best) {
    dimScreen(0.42);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd97a';
    ctx.font = '900 84px system-ui, sans-serif';
    ctx.fillText('GOBBLE DASH', FIELD.width / 2, 150);
    ctx.fillStyle = '#fff8e7';
    ctx.font = '700 30px system-ui, sans-serif';
    ctx.fillText('A Thanksgiving Turkey Run', FIELD.width / 2, 196);
    ctx.fillStyle = 'rgba(255, 248, 231, 0.85)';
    ctx.font = '600 21px system-ui, sans-serif';
    ctx.fillText('The farmer is coming. The oven is hot. The woods are 1000 m away.', FIELD.width / 2, 240);
    panel(FIELD.width / 2 - 330, 300, 660, 150);
    ctx.fillStyle = '#fff8e7';
    ctx.font = '700 22px system-ui, sans-serif';
    ctx.fillText('SPACE or CLICK  —  jump', FIELD.width / 2, 342);
    ctx.fillText('DOWN or S  —  slide under high knives', FIELD.width / 2, 378);
    ctx.fillText('P  —  pause      M  —  mute', FIELD.width / 2, 414);
    if (Math.floor(state.time * 2) % 2 === 0) {
      ctx.fillStyle = '#ffd97a';
      ctx.font = '800 30px system-ui, sans-serif';
      ctx.fillText('PRESS SPACE OR CLICK TO RUN', FIELD.width / 2, 520);
    }
    if (best > 0) {
      ctx.fillStyle = 'rgba(255, 248, 231, 0.8)';
      ctx.font = '700 20px system-ui, sans-serif';
      ctx.fillText(`BEST SCORE ${best}`, FIELD.width / 2, 566);
    }
  }

  function drawEnd(state, best, won) {
    dimScreen(0.5);
    ctx.textAlign = 'center';
    if (won) {
      ctx.fillStyle = '#8fd14f';
      ctx.font = '900 76px system-ui, sans-serif';
      ctx.fillText('ESCAPED!', FIELD.width / 2, 170);
      ctx.fillStyle = '#fff8e7';
      ctx.font = '700 26px system-ui, sans-serif';
      ctx.fillText('You made it to the woods. Thanksgiving is saved!', FIELD.width / 2, 216);
    } else {
      ctx.fillStyle = '#ff6b5e';
      ctx.font = '900 76px system-ui, sans-serif';
      ctx.fillText('CAUGHT!', FIELD.width / 2, 170);
      ctx.fillStyle = '#fff8e7';
      ctx.font = '700 26px system-ui, sans-serif';
      ctx.fillText('The farmer got you. Dinner is served...', FIELD.width / 2, 216);
    }
    panel(FIELD.width / 2 - 260, 260, 520, 190);
    ctx.fillStyle = '#fff8e7';
    ctx.font = '700 24px system-ui, sans-serif';
    ctx.fillText(`SCORE  ${state.score}`, FIELD.width / 2, 308);
    ctx.fillText(`DISTANCE  ${Math.floor(state.distance)} m`, FIELD.width / 2, 346);
    ctx.fillText(`CORN  ${state.cornCollected}      BEST  ${Math.max(best, state.score)}`, FIELD.width / 2, 384);
    if (Math.floor(state.time * 2) % 2 === 0) {
      ctx.fillStyle = '#ffd97a';
      ctx.font = '800 28px system-ui, sans-serif';
      ctx.fillText('PRESS SPACE OR CLICK TO RUN AGAIN', FIELD.width / 2, 520);
    }
  }

  function drawPaused() {
    dimScreen(0.55);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff8e7';
    ctx.font = '900 64px system-ui, sans-serif';
    ctx.fillText('PAUSED', FIELD.width / 2, 330);
    ctx.fillStyle = 'rgba(255, 248, 231, 0.85)';
    ctx.font = '700 24px system-ui, sans-serif';
    ctx.fillText('Press P or click to keep running', FIELD.width / 2, 380);
  }

  function draw(state, screen, best) {
    frame();
    drawSky(state);
    drawHills(state);
    drawBarn(state);
    drawFence(state);
    drawGround(state);
    for (const obstacle of state.obstacles) drawObstacle(obstacle, state);
    for (const pickup of state.pickups) drawPickup(pickup);
    drawFarmer(state);
    drawTurkey(state, screen);
    drawParticles(state);
    if (screen === SCREEN_TITLE) {
      drawTitle(state, best);
    } else if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) {
      drawHUD(state, screen, best);
      if (screen === SCREEN_PAUSED) drawPaused();
    } else if (screen === SCREEN_OVER) {
      drawHUD(state, screen, best);
      drawEnd(state, best, false);
    } else if (screen === SCREEN_WIN) {
      drawHUD(state, screen, best);
      drawEnd(state, best, true);
    }
  }

  return { draw, resize };
}

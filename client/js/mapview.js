// Dibuja el mapa estático una sola vez en un canvas aparte.

import { MAP, ROOMS, DOORS, OBSTACLES, DECOR, STATIONS } from './map.js';
import { PALETTE, FLOORS } from './palette.js';
import { drawObstacle, drawStation } from './furniture.js';

const WALL = 22; // grosor de pared visto desde arriba
const FACE = 16; // altura de la cara de ladrillo
const LABEL_FONT = '600 34px Fredoka, sans-serif';

function shapePath(ctx, s, grow = 0) {
  if (s.circle) {
    const [cx, cy, r] = s.circle;
    ctx.moveTo(cx + r + grow, cy);
    ctx.arc(cx, cy, r + grow, 0, Math.PI * 2);
  } else {
    const [x, y, w, h] = s.rect;
    ctx.rect(x - grow, y - grow, w + grow * 2, h + grow * 2);
  }
}

// Todas las formas de suelo (salas + puertas).
const FLOOR_SHAPES = [...ROOMS, ...DOORS.map((rect) => ({ rect }))];

function floorsPath(ctx, grow = 0) {
  ctx.beginPath();
  for (const s of FLOOR_SHAPES) shapePath(ctx, s, grow);
}

function tile(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  return c;
}

// Patrón de baldosas / tablas según el estilo de suelo.
function floorPattern(ctx, style) {
  const f = FLOORS[style];
  const t = tile(f.size * 2, (g, s) => {
    g.fillStyle = f.base;
    g.fillRect(0, 0, s, s);
    const h = s / 2;
    if (f.checker) {
      g.fillStyle = f.checker;
      g.fillRect(0, 0, h, h);
      g.fillRect(h, h, h, h);
    }
    if (f.speckle) {
      g.fillStyle = f.speckle;
      for (let i = 0; i < 14; i++) g.fillRect((i * 37) % s, (i * 53) % s, 2, 2);
    }
    g.strokeStyle = f.line;
    g.lineWidth = 2;
    g.beginPath();
    if (f.planks) {
      for (let y = 0; y <= s; y += h) g.moveTo(0, y), g.lineTo(s, y);
      g.moveTo(h * 0.6, 0), g.lineTo(h * 0.6, h);
      g.moveTo(h * 1.5, h), g.lineTo(h * 1.5, s);
    } else {
      g.moveTo(0, 0), g.lineTo(s, 0), g.moveTo(0, h), g.lineTo(s, h);
      g.moveTo(0, 0), g.lineTo(0, s), g.moveTo(h, 0), g.lineTo(h, s);
    }
    g.stroke();
  });
  return ctx.createPattern(t, 'repeat');
}

function brickPattern(ctx) {
  const t = tile(32, (g) => {
    g.fillStyle = PALETTE.brickMortar;
    g.fillRect(0, 0, 32, 32);
    g.fillStyle = PALETTE.brick;
    g.fillRect(1, 1, 30, 6);
    g.fillRect(-15, 9, 30, 6), g.fillRect(17, 9, 30, 6);
    g.fillRect(1, 17, 30, 6);
    g.fillRect(-15, 25, 30, 6), g.fillRect(17, 25, 30, 6);
  });
  return ctx.createPattern(t, 'repeat');
}

function drawExterior(ctx) {
  ctx.fillStyle = PALETTE.exterior;
  ctx.fillRect(0, 0, MAP.width, MAP.height);
  ctx.fillStyle = PALETTE.exteriorDot;
  for (let y = 10; y < MAP.height; y += 28) {
    for (let x = (y / 28) % 2 ? 24 : 10; x < MAP.width; x += 28) ctx.fillRect(x, y, 3, 3);
  }
}

function drawWallTops(ctx) {
  floorsPath(ctx, WALL + 2);
  ctx.fillStyle = PALETTE.wallTopEdge;
  ctx.fill();
  floorsPath(ctx, WALL);
  ctx.fillStyle = PALETTE.wallTop;
  ctx.fill();
}

function drawFloors(ctx) {
  // Primero las puertas y luego las salas, para que cada sala conserve su suelo.
  ctx.fillStyle = floorPattern(ctx, 'baldosa');
  ctx.beginPath();
  DOORS.forEach((rect) => shapePath(ctx, { rect }));
  ctx.fill();
  for (const room of ROOMS) {
    ctx.fillStyle = floorPattern(ctx, room.floor);
    ctx.beginPath();
    shapePath(ctx, room);
    ctx.fill();
  }
}

// Cara de ladrillo y sombra: la pared desplazada hacia abajo sobre el suelo.
function drawWallFaces(ctx, scale) {
  const mask = document.createElement('canvas');
  mask.width = ctx.canvas.width;
  mask.height = ctx.canvas.height;
  const m = mask.getContext('2d');
  m.scale(scale, scale);
  m.fillStyle = brickPattern(m);
  floorsPath(m, WALL);
  m.fill();
  m.globalCompositeOperation = 'destination-out';
  floorsPath(m);
  m.fill();

  ctx.save();
  floorsPath(ctx);
  ctx.clip();
  ctx.shadowColor = PALETTE.shadow;
  ctx.shadowOffsetY = 10 * scale;
  ctx.shadowBlur = 8 * scale;
  ctx.drawImage(mask, 0, FACE, MAP.width, MAP.height);
  ctx.restore();
}

function drawLabel(ctx, room) {
  const [x, y] = room.label || labelPos(room);
  const width = room.rect ? room.rect[2] * 0.8 : room.circle[2];
  ctx.font = LABEL_FONT;
  const text = room.name.toUpperCase();
  const size = Math.min(1, width / ctx.measureText(text).width);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  ctx.fillStyle = PALETTE.label;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function labelPos(room) {
  if (room.circle) return [room.circle[0], room.circle[1]];
  const [x, y, w, h] = room.rect;
  return [x + w / 2, y + h / 2];
}

export function buildMapCanvas(scale) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(MAP.width * scale);
  canvas.height = Math.round(MAP.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  drawExterior(ctx);
  drawWallTops(ctx);
  DECOR.forEach((d) => drawObstacle(ctx, d));
  drawFloors(ctx);
  ROOMS.forEach((room) => drawLabel(ctx, room));
  drawWallFaces(ctx, scale);
  OBSTACLES.forEach((o) => drawObstacle(ctx, o));
  Object.values(STATIONS).forEach((pos) => drawStation(ctx, pos));
  return canvas;
}

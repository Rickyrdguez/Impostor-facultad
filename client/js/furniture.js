// Dibujo de muebles y decoración (con sombra y brillo superior).

import { PALETTE, FURNITURE } from './palette.js';

const SHADOW_X = 4;
const SHADOW_Y = 7;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
}

function drawBox(ctx, [x, y, w, h], [body, dark, light]) {
  ctx.fillStyle = PALETTE.shadow;
  roundRect(ctx, x + SHADOW_X, y + SHADOW_Y, w, h, 6);
  ctx.fill();
  // Cara frontal (más oscura) y tapa
  ctx.fillStyle = dark;
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.fillStyle = body;
  roundRect(ctx, x, y, w, h - Math.min(8, h * 0.25), 6);
  ctx.fill();
  // Brillo superior
  ctx.fillStyle = light;
  roundRect(ctx, x + 4, y + 3, w - 8, 3, 2);
  ctx.fill();
}

function drawRound(ctx, [cx, cy, r], [body, dark, light]) {
  ctx.fillStyle = PALETTE.shadow;
  ctx.beginPath();
  ctx.ellipse(cx + SHADOW_X, cy + SHADOW_Y, r, r * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.arc(cx, cy + 3, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = light;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.75, Math.PI * 1.1, Math.PI * 1.6);
  ctx.stroke();
}

// Lucernario: cúpula de cristal con nervios.
function drawSkylight(ctx, [cx, cy, r]) {
  drawRound(ctx, [cx, cy, r], FURNITURE.lucernario);
  ctx.strokeStyle = PALETTE.blue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.moveTo(cx + Math.cos(a) * 18, cy + Math.sin(a) * 18);
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.moveTo(cx + r * 0.6, cy);
  ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
  ctx.stroke();
}

function drawPlant(ctx, [cx, cy, r]) {
  drawRound(ctx, [cx, cy, r], [PALETTE.woodDark, '#6e4220', PALETTE.wood]);
  ctx.fillStyle = PALETTE.plant;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * r * 0.5, cy - 4 + Math.sin(a) * r * 0.5, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#86b56f';
  ctx.beginPath();
  ctx.arc(cx - 3, cy - 8, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

// Patio central: césped, lucernario alargado y plantas.
function drawPatio(ctx, [x, y, w, h]) {
  ctx.fillStyle = PALETTE.plantDark;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = PALETTE.plant;
  for (let i = 0; i < 40; i++) {
    ctx.fillRect(x + ((i * 97) % (w - 10)), y + ((i * 61) % (h - 10)), 6, 3);
  }
  const sx = x + w * 0.35;
  const sw = w * 0.3;
  drawBox(ctx, [sx, y + 30, sw, h - 70], FURNITURE.lucernario);
  ctx.strokeStyle = PALETTE.blue;
  ctx.lineWidth = 2;
  for (let ly = y + 60; ly < y + h - 50; ly += 30) {
    ctx.beginPath();
    ctx.moveTo(sx + 4, ly);
    ctx.lineTo(sx + sw - 4, ly);
    ctx.stroke();
  }
  drawPlant(ctx, [x + 50, y + 60, 22]);
  drawPlant(ctx, [x + w - 50, y + h - 70, 22]);
  drawPlant(ctx, [x + 60, y + h - 80, 18]);
}

// Estación de tarea: un pequeño panel con pantalla azul en el suelo.
export function drawStation(ctx, [x, y]) {
  drawBox(ctx, [x - 13, y - 11, 26, 22], [PALETTE.metal, PALETTE.metalDark, '#e4e6e8']);
  ctx.fillStyle = PALETTE.blueLight;
  ctx.fillRect(x - 8, y - 6, 16, 8);
  ctx.fillStyle = '#e8f4ff';
  ctx.fillRect(x - 6, y - 4, 5, 2);
}

// Punto de arreglo de sabotajes: caja metálica con franjas de aviso.
export function drawFixPoint(ctx, x, y) {
  drawBox(ctx, [x - 15, y - 15, 30, 30], [PALETTE.metal, PALETTE.metalDark, '#e4e6e8']);
  ctx.fillStyle = PALETTE.tassel;
  ctx.fillRect(x - 11, y - 10, 22, 6);
  ctx.fillStyle = PALETTE.brick;
  for (let i = -11; i < 11; i += 6) ctx.fillRect(x + i, y - 10, 3, 6);
  ctx.fillStyle = '#e53935';
  ctx.beginPath();
  ctx.arc(x, y + 4, 4, 0, Math.PI * 2);
  ctx.fill();
}

// Trampilla: rejilla metálica en el suelo.
export function drawVent(ctx, x, y) {
  drawBox(ctx, [x - 20, y - 14, 40, 28], [PALETTE.metalDark, '#5f6368', PALETTE.metal]);
  ctx.strokeStyle = '#4a4e53';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = -12; i <= 12; i += 8) {
    ctx.moveTo(x + i, y - 9);
    ctx.lineTo(x + i, y + 5);
  }
  ctx.stroke();
}

// Mesa redonda con el gran botón rojo de emergencia.
function drawEmergency(ctx, [cx, cy, r]) {
  drawRound(ctx, [cx, cy, r], FURNITURE.mesa);
  drawRound(ctx, [cx, cy - 3, r * 0.55], [PALETTE.brick, '#7a3826', '#e38a6e']);
}

export function drawObstacle(ctx, o) {
  if (o.kind === 'patio') return drawPatio(ctx, o.rect);
  if (o.kind === 'lucernario') return drawSkylight(ctx, o.circle);
  if (o.kind === 'maceta') return drawPlant(ctx, o.circle);
  if (o.kind === 'emergencia') return drawEmergency(ctx, o.circle);
  const colors = FURNITURE[o.kind] || FURNITURE.mesa;
  if (o.circle) drawRound(ctx, o.circle, colors);
  else drawBox(ctx, o.rect, colors);
}

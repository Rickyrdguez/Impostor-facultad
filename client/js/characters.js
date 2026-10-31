// Personajes: círculo con birrete e insignia del lenguaje (dibujado por código).

import { PLAYER_RADIUS, languageById } from '../../shared/constants.js';
import { PALETTE } from './palette.js';

const R = PLAYER_RADIUS;
const BOUNCE = 5; // altura del rebote al andar
const GHOST_FLOAT = 4; // los fantasmas suben y bajan
const GHOST_FLOAT_MS = 700;

function drawShadow(ctx, x, y, lift) {
  const k = 1 - lift / (BOUNCE * 3);
  ctx.fillStyle = PALETTE.shadow;
  ctx.beginPath();
  ctx.ellipse(x, y + R - 2, R * 0.9 * k, R * 0.35 * k, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawBody(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, y, R, 0, Math.PI * 2);
  ctx.fill();
  // Sombreado inferior y brillo superior para dar volumen
  ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
  ctx.beginPath();
  ctx.arc(x, y, R, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.beginPath();
  ctx.ellipse(x - 7, y - 8, 5, 3, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, R, 0, Math.PI * 2);
  ctx.stroke();
}

// Ojos que miran hacia donde camina el personaje.
function drawEyes(ctx, x, y, fx, fy) {
  for (const side of [-1, 1]) {
    const ex = x + side * 6 + fx * 4;
    const ey = y - 3 + fy * 3;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(ex, ey, 4.5, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1d1d24';
    ctx.beginPath();
    ctx.arc(ex + fx * 1.6, ey + fy * 1.8, 2.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Insignia en el pecho: color del lenguaje y sus letras.
function drawBadge(ctx, x, y, lang) {
  const by = y + 9;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, by, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = lang.color;
  ctx.beginPath();
  ctx.arc(x, by, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = lang.ink;
  ctx.font = `700 ${lang.short.length > 2 ? 5.5 : 7}px Fredoka, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(lang.short, x, by + 0.5);
}

// Birrete de graduación con borla.
function drawCap(ctx, x, y, fx) {
  const top = y - R + 1;
  ctx.fillStyle = PALETTE.cap;
  ctx.beginPath();
  ctx.ellipse(x, top + 3, 11, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Tapa en forma de rombo (vista en perspectiva)
  ctx.beginPath();
  ctx.moveTo(x - 18, top - 2);
  ctx.lineTo(x, top - 9);
  ctx.lineTo(x + 18, top - 2);
  ctx.lineTo(x, top + 5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Borla hacia el lado contrario al que mira
  const side = fx > 0.2 ? -1 : 1;
  ctx.strokeStyle = PALETTE.tassel;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x, top - 2);
  ctx.lineTo(x + side * 13, top);
  ctx.lineTo(x + side * 13, top + 9);
  ctx.stroke();
  ctx.fillStyle = PALETTE.tassel;
  ctx.beginPath();
  ctx.arc(x + side * 13, top + 10, 2, 0, Math.PI * 2);
  ctx.fill();
}

export function drawName(ctx, x, y, name) {
  ctx.font = '600 13px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.lineWidth = 3.5;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = PALETTE.nameStroke;
  ctx.strokeText(name, x, y);
  ctx.fillStyle = PALETTE.nameFill;
  ctx.fillText(name, x, y);
}

// p: { x, y, lang, name, fx, fy, moving, walk, ghost }
export function drawCharacter(ctx, p) {
  const lang = languageById(p.lang);
  const float = p.ghost ? (Math.sin(performance.now() / GHOST_FLOAT_MS) + 1) * GHOST_FLOAT : 0;
  const lift = (p.moving ? Math.abs(Math.sin(p.walk)) * BOUNCE : 0) + float;
  const y = p.y - lift;
  ctx.save();
  if (p.ghost) ctx.globalAlpha = 0.5;
  else drawShadow(ctx, p.x, p.y, lift);
  drawBody(ctx, p.x, y, lang.color);
  drawBadge(ctx, p.x, y, lang);
  drawEyes(ctx, p.x, y, p.fx, p.fy);
  drawCap(ctx, p.x, y, p.fx);
  drawName(ctx, p.x, y - R - 12, p.name);
  ctx.restore();
}

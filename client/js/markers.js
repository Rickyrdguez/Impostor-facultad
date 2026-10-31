// Marcas dinámicas sobre el mapa: tareas pendientes, anillo de progreso y cuerpos.

import { PALETTE } from './palette.js';
import { PLAYER_RADIUS, languageById } from '../../shared/constants.js';

const PULSE_MS = 900;

// Aro amarillo que late sobre las estaciones de mis tareas pendientes.
export function drawTaskMarker(ctx, x, y, now) {
  const pulse = (Math.sin((now / PULSE_MS) * Math.PI * 2) + 1) / 2;
  ctx.save();
  ctx.strokeStyle = PALETTE.tassel;
  ctx.globalAlpha = 0.5 + pulse * 0.5;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 20 + pulse * 6, 0, Math.PI * 2);
  ctx.stroke();
  // Flecha encima
  ctx.fillStyle = PALETTE.tassel;
  ctx.beginPath();
  const top = y - 34 - pulse * 4;
  ctx.moveTo(x - 8, top - 10);
  ctx.lineTo(x + 8, top - 10);
  ctx.lineTo(x, top);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Anillo de progreso alrededor del jugador mientras mantiene E.
export function drawTaskRing(ctx, x, y, progress) {
  const r = PLAYER_RADIUS + 12;
  ctx.save();
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#6fc27b';
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// Cuerpo: el personaje tumbado, con ojos en X y el birrete caído al lado.
export function drawCorpse(ctx, body, langId) {
  const lang = languageById(langId);
  const { x, y } = body;
  ctx.save();
  ctx.fillStyle = PALETTE.shadow;
  ctx.beginPath();
  ctx.ellipse(x + 3, y + 8, PLAYER_RADIUS * 1.2, PLAYER_RADIUS * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = lang.color;
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(x, y, PLAYER_RADIUS * 1.1, PLAYER_RADIUS * 0.7, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Ojos en X
  ctx.strokeStyle = '#1d1d24';
  ctx.lineWidth = 2;
  for (const ex of [x - 7, x + 3]) {
    ctx.beginPath();
    ctx.moveTo(ex - 3, y - 6);
    ctx.lineTo(ex + 3, y);
    ctx.moveTo(ex + 3, y - 6);
    ctx.lineTo(ex - 3, y);
    ctx.stroke();
  }
  // Birrete en el suelo
  ctx.fillStyle = PALETTE.cap;
  ctx.beginPath();
  ctx.moveTo(x + 18, y - 16);
  ctx.lineTo(x + 32, y - 21);
  ctx.lineTo(x + 44, y - 15);
  ctx.lineTo(x + 30, y - 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

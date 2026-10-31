// Marcas dinámicas sobre el mapa: tareas pendientes, sabotajes y cuerpos.

import { PALETTE } from './palette.js';
import { PLAYER_RADIUS, languageById } from '../../shared/constants.js';

const PULSE_MS = 900;

// Aro amarillo que late sobre las estaciones de mis tareas pendientes.
export function drawTaskMarker(ctx, x, y, now, color = PALETTE.tassel) {
  const pulse = (Math.sin((now / PULSE_MS) * Math.PI * 2) + 1) / 2;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.5 + pulse * 0.5;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 20 + pulse * 6, 0, Math.PI * 2);
  ctx.stroke();
  // Flecha encima
  ctx.fillStyle = color;
  ctx.beginPath();
  const top = y - 34 - pulse * 4;
  ctx.moveTo(x - 8, top - 10);
  ctx.lineTo(x + 8, top - 10);
  ctx.lineTo(x, top);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

const CORPSE_SCALE = 1.35; // los cuerpos algo más grandes para que se vean bien
const EDGE_MARGIN = 34; // separación de las flechas respecto al borde (px)
const EDGE_SIZE = 18;

// Cuerpo: el personaje tumbado, con ojos en X, su insignia y el birrete caído al lado.
export function drawCorpse(ctx, body, langId) {
  const lang = languageById(langId);
  const r = PLAYER_RADIUS;
  ctx.save();
  ctx.translate(body.x, body.y);
  ctx.scale(CORPSE_SCALE, CORPSE_SCALE);
  ctx.fillStyle = PALETTE.shadow;
  ctx.beginPath();
  ctx.ellipse(3, 8, r * 1.2, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = lang.color;
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.1, r * 0.7, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Ojos en X
  ctx.strokeStyle = '#1d1d24';
  ctx.lineWidth = 2;
  for (const ex of [-9, 1]) {
    ctx.beginPath();
    ctx.moveTo(ex - 3, -7);
    ctx.lineTo(ex + 3, -1);
    ctx.moveTo(ex + 3, -7);
    ctx.lineTo(ex - 3, -1);
    ctx.stroke();
  }
  // Insignia con las letras del lenguaje
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(11, 4, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = lang.ink === '#ffffff' ? lang.color : '#1d1d24';
  ctx.font = `700 ${lang.short.length > 2 ? 4.5 : 6}px Fredoka, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(lang.short, 11, 4.5);
  // Birrete en el suelo
  ctx.fillStyle = PALETTE.cap;
  ctx.beginPath();
  ctx.moveTo(18, -16);
  ctx.lineTo(32, -21);
  ctx.lineTo(44, -15);
  ctx.lineTo(30, -10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Flecha en el borde de la pantalla que apunta a algo que queda fuera de ella.
// (sx, sy): posición del objetivo en píxeles de pantalla; w, h: tamaño de la pantalla.
export function drawEdgeArrow(ctx, sx, sy, w, h, color, scale = 1) {
  const m = EDGE_MARGIN * scale;
  if (sx > m && sx < w - m && sy > m && sy < h - m) return; // ya se ve
  const cx = w / 2;
  const cy = h / 2;
  const angle = Math.atan2(sy - cy, sx - cx);
  // Punto donde la línea centro -> objetivo corta el rectángulo interior.
  const k = Math.min(Math.abs((cx - m) / Math.cos(angle)), Math.abs((cy - m) / Math.sin(angle)));
  const size = EDGE_SIZE * scale;
  ctx.save();
  ctx.translate(cx + Math.cos(angle) * k, cy + Math.sin(angle) * k);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.lineWidth = 2 * scale;
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size * 0.7, size * 0.75);
  ctx.lineTo(-size * 0.7, -size * 0.75);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

const VENT_ARROW_COLOR = '#8e5cc8';
const VENT_ARROW_SIZE = 22;
const VENT_LABEL_GAP = 40; // distancia del nombre de la sala a la punta de la flecha

// Flecha dentro de una trampilla: apunta a otra trampilla y lleva el nombre de su sala.
export function drawVentArrow(ctx, arrow, now) {
  const pulse = 1 + Math.sin(now / 250) * 0.08;
  const size = VENT_ARROW_SIZE * pulse;
  ctx.save();
  ctx.translate(arrow.x, arrow.y);
  ctx.rotate(arrow.angle);
  ctx.fillStyle = VENT_ARROW_COLOR;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size * 0.8, size * 0.85);
  ctx.lineTo(-size * 0.35, 0);
  ctx.lineTo(-size * 0.8, -size * 0.85);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
  ctx.restore();
  // Nombre de la sala, un poco más allá de la flecha
  const lx = arrow.x + Math.cos(arrow.angle) * VENT_LABEL_GAP;
  const ly = arrow.y + Math.sin(arrow.angle) * VENT_LABEL_GAP;
  ctx.font = '700 15px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(25, 20, 15, 0.85)';
  ctx.strokeText(arrow.room, lx, ly);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(arrow.room, lx, ly);
}

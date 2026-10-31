// Dibujo del mundo: cámara, mapa, personajes y oscuridad.

import { MAP } from './map.js';
import { buildMapCanvas } from './mapview.js';
import { drawCharacter } from './characters.js';
import { PALETTE } from './palette.js';
import { PLAYER_RADIUS } from '../../shared/constants.js';

const VIEW_SIZE = 620; // unidades del mundo visibles en el lado corto de la pantalla
const MAX_DPR = 2;
const MAP_PIXEL_BUDGET = 12e6; // límite de píxeles del mapa pre-dibujado
const VISION_FADE = 0.55; // parte del radio que se ve sin oscurecer

let canvas;
let ctx;
let mapCanvas = null;
let dpr = 1;

export function initRender(el) {
  canvas = el;
  ctx = canvas.getContext('2d');
  resize();
  addEventListener('resize', resize);
}

function resize() {
  dpr = Math.min(devicePixelRatio || 1, MAX_DPR);
  canvas.width = Math.round(innerWidth * dpr);
  canvas.height = Math.round(innerHeight * dpr);
}

// Escala de la cámara en píxeles del canvas por unidad del mundo.
function cameraScale() {
  return (Math.min(innerWidth, innerHeight) / VIEW_SIZE) * dpr;
}

// El mapa se pre-dibuja una vez, con la resolución que pide la pantalla.
export function prepareMap() {
  const wanted = Math.max(1, cameraScale());
  const maxScale = Math.sqrt(MAP_PIXEL_BUDGET / (MAP.width * MAP.height));
  mapCanvas = buildMapCanvas(Math.min(wanted, maxScale));
}

function drawDarkness(cx, cy, radius) {
  const g = ctx.createRadialGradient(cx, cy, radius * VISION_FADE, cx, cy, radius);
  g.addColorStop(0, 'rgba(0, 0, 0, 0)');
  g.addColorStop(1, PALETTE.darkness);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// view: { cx, cy, vision (radio o Infinity), characters: [...] }
export function render(view) {
  const s = cameraScale();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = PALETTE.exterior;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const ox = canvas.width / 2 - view.cx * s;
  const oy = canvas.height / 2 - view.cy * s;
  ctx.setTransform(s, 0, 0, s, ox, oy);
  if (mapCanvas) ctx.drawImage(mapCanvas, 0, 0, MAP.width, MAP.height);

  const limit = view.vision + PLAYER_RADIUS;
  const visible = view.characters
    .filter((c) => Math.hypot(c.x - view.cx, c.y - view.cy) < limit)
    .sort((a, b) => a.y - b.y);
  for (const c of visible) drawCharacter(ctx, c);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (Number.isFinite(view.vision)) {
    drawDarkness(canvas.width / 2, canvas.height / 2, view.vision * s);
  }
}

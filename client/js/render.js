// Dibujo del mundo: cámara, mapa, personajes y niebla de visión.

import { MAP } from './map.js';
import { buildMapCanvas } from './mapview.js';
import { drawCharacter } from './characters.js';
import { drawCorpse, drawTaskMarker } from './markers.js';
import { PALETTE } from './palette.js';
import { buildVisionGrid, visibilityPolygon, canSee } from './vision.js';
import { PLAYER_RADIUS } from '../../shared/constants.js';

const VIEW_SIZE = 620; // unidades del mundo visibles en el lado corto de la pantalla
const MAX_DPR = 2;
const MAP_PIXEL_BUDGET = 12e6; // límite de píxeles del mapa pre-dibujado
const ALERT_COLOR = '#ff5a45'; // puntos donde arreglar un sabotaje
const VISION_FADE = 0.8; // parte del radio que se ve con luz plena
const FOG_SCALE = 0.35; // la niebla se dibuja a menos resolución: borde suave y barato

let canvas;
let ctx;
let fog; // canvas de la niebla (mismo tamaño que la pantalla)
let fogCtx;
let mapCanvas = null;
let dpr = 1;

export function initRender(el) {
  canvas = el;
  ctx = canvas.getContext('2d');
  fog = document.createElement('canvas');
  fogCtx = fog.getContext('2d');
  resize();
  addEventListener('resize', resize);
}

function resize() {
  dpr = Math.min(devicePixelRatio || 1, MAX_DPR);
  canvas.width = Math.round(innerWidth * dpr);
  canvas.height = Math.round(innerHeight * dpr);
  fog.width = Math.round(canvas.width * FOG_SCALE);
  fog.height = Math.round(canvas.height * FOG_SCALE);
}

// Escala de la cámara en píxeles del canvas por unidad del mundo.
function cameraScale() {
  return (Math.min(innerWidth, innerHeight) / VIEW_SIZE) * dpr;
}

// Canvas con el mapa pre-dibujado (lo reutiliza el mapa de la tecla M).
export function getMapCanvas() {
  return mapCanvas;
}

// El mapa y la rejilla de visión se preparan una vez al cargar.
export function prepareMap() {
  const wanted = Math.max(1, cameraScale());
  const maxScale = Math.sqrt(MAP_PIXEL_BUDGET / (MAP.width * MAP.height));
  mapCanvas = buildMapCanvas(Math.min(wanted, maxScale));
  buildVisionGrid();
}

// Niebla: todo oscuro salvo el polígono visible, que se recorta con degradado.
function drawFog(view, transform) {
  fogCtx.setTransform(1, 0, 0, 1, 0, 0);
  fogCtx.globalCompositeOperation = 'source-over';
  fogCtx.clearRect(0, 0, fog.width, fog.height);
  fogCtx.fillStyle = PALETTE.darkness;
  fogCtx.fillRect(0, 0, fog.width, fog.height);

  fogCtx.globalCompositeOperation = 'destination-out';
  fogCtx.setTransform(...transform.map((v) => v * FOG_SCALE));
  const { cx, cy, vision } = view;
  const g = fogCtx.createRadialGradient(cx, cy, vision * VISION_FADE, cx, cy, vision);
  g.addColorStop(0, 'rgba(0, 0, 0, 1)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');
  fogCtx.fillStyle = g;
  const poly = visibilityPolygon(cx, cy, vision);
  fogCtx.beginPath();
  fogCtx.moveTo(poly[0], poly[1]);
  for (let i = 2; i < poly.length; i += 2) fogCtx.lineTo(poly[i], poly[i + 1]);
  fogCtx.closePath();
  fogCtx.fill();

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(fog, 0, 0, canvas.width, canvas.height);
}

// ¿Se ve a este personaje? Basta con ver su centro o uno de sus lados.
function isVisible(c, view) {
  if (!Number.isFinite(view.vision)) return true;
  if (Math.hypot(c.x - view.cx, c.y - view.cy) > view.vision + PLAYER_RADIUS) return false;
  if (c.x === view.cx && c.y === view.cy) return true;
  return [0, -PLAYER_RADIUS, PLAYER_RADIUS].some((off) =>
    canSee(view.cx, view.cy, c.x + off, c.y - Math.abs(off) * 0.5),
  );
}

// view: {
//   cx, cy: centro de la cámara (el jugador)
//   vision: radio de visión, o Infinity si no hay niebla (fantasmas, inicio)
//   characters: personajes a dibujar   bodies: cuerpos [{ x, y, lang }]
//   markers: estaciones de mis tareas [[x, y]]   alerts: puntos de sabotaje [[x, y]]
// }
export function render(view) {
  const s = cameraScale();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = PALETTE.exterior;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const transform = [s, 0, 0, s, canvas.width / 2 - view.cx * s, canvas.height / 2 - view.cy * s];
  ctx.setTransform(...transform);
  if (mapCanvas) ctx.drawImage(mapCanvas, 0, 0, MAP.width, MAP.height);

  for (const b of (view.bodies || []).filter((b) => isVisible(b, view))) drawCorpse(ctx, b, b.lang);
  const visible = view.characters.filter((c) => isVisible(c, view)).sort((a, b) => a.y - b.y);
  for (const c of visible) drawCharacter(ctx, c);

  if (Number.isFinite(view.vision) && mapCanvas) drawFog(view, transform);

  // Las marcas de tareas se ven siempre, por encima de la niebla, para orientarse.
  ctx.setTransform(...transform);
  const now = performance.now();
  for (const [x, y] of view.markers || []) drawTaskMarker(ctx, x, y, now);
  for (const [x, y] of view.alerts || []) drawTaskMarker(ctx, x, y, now, ALERT_COLOR);
}

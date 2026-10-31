// Línea de visión: rayos desde el jugador que se cortan en paredes y muebles altos.
// Módulo puro (sin DOM): se puede probar con node.

import { MAP, blocksSight } from './map.js';

const CELL = 4; // tamaño de celda de la rejilla de visión
const RAYS = 720; // rayos por vuelta (uno cada medio grado)
const RAY_STEP = 3; // avance de cada rayo al buscar una pared
const WALL_REVEAL = 18; // el rayo entra un poco en la pared para que se vea
const REFINE_STEPS = 5; // precisión del punto de choque

let grid = null;
let cols = 0;
let rows = 0;

// Rejilla precalculada: 1 = tapa la vista. Se crea una vez al cargar.
export function buildVisionGrid() {
  cols = Math.ceil(MAP.width / CELL);
  rows = Math.ceil(MAP.height / CELL);
  grid = new Uint8Array(cols * rows);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      grid[y * cols + x] = blocksSight((x + 0.5) * CELL, (y + 0.5) * CELL) ? 1 : 0;
    }
  }
}

function blocked(x, y) {
  const cx = Math.floor(x / CELL);
  const cy = Math.floor(y / CELL);
  if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) return true;
  return grid[cy * cols + cx] === 1;
}

// Afina el punto de choque entre lo libre (a) y lo bloqueado (b) a medias sucesivas.
// Usa la forma exacta del mapa (no la rejilla) para que las curvas salgan lisas.
function refine(x, y, dx, dy, a, b) {
  for (let i = 0; i < REFINE_STEPS; i++) {
    const mid = (a + b) / 2;
    if (blocksSight(x + dx * mid, y + dy * mid)) b = mid;
    else a = mid;
  }
  return b;
}

// Distancia hasta la primera pared en una dirección (máx. radius).
function rayLength(x, y, dx, dy, radius) {
  for (let d = RAY_STEP; d < radius; d += RAY_STEP) {
    if (blocked(x + dx * d, y + dy * d)) {
      return Math.min(refine(x, y, dx, dy, d - RAY_STEP, d) + WALL_REVEAL, radius);
    }
  }
  return radius;
}

// Polígono visible desde (x, y): lista plana [x0, y0, x1, y1, ...].
export function visibilityPolygon(x, y, radius) {
  const points = new Float32Array(RAYS * 2);
  for (let i = 0; i < RAYS; i++) {
    const a = (i / RAYS) * Math.PI * 2;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const len = rayLength(x, y, dx, dy, radius);
    points[i * 2] = x + dx * len;
    points[i * 2 + 1] = y + dy * len;
  }
  return points;
}

// ¿Hay visión directa entre dos puntos?
export function canSee(ax, ay, bx, by) {
  const dist = Math.hypot(bx - ax, by - ay);
  const dx = (bx - ax) / dist;
  const dy = (by - ay) / dist;
  for (let d = RAY_STEP; d < dist; d += RAY_STEP) {
    if (blocked(ax + dx * d, ay + dy * d)) return false;
  }
  return true;
}

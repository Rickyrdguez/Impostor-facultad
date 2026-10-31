// Mapa completo (tecla M): dónde estás, tus tareas pendientes y, para el impostor, las trampillas.

import { state, phase, playerInfo, wifiDown } from './state.js';
import { MAP, ROOMS } from './map.js';
import { STATIONS, VENTS, EMERGENCY } from './places.js';
import { pendingFixPoints } from './sabotageui.js';
import { getMapCanvas } from './render.js';
import { pendingTasks } from './actions.js';
import { PALETTE } from './palette.js';
import { languageById } from '../../shared/constants.js';

const MARGIN = 48; // espacio libre alrededor del mapa en pantalla (px)
const HEAD = 130; // alto de la cabecera y la leyenda de la tarjeta (px)
const MAX_DPR = 2;
const LABEL_PX = 12; // tamaño de los nombres de las salas en pantalla
const $ = (id) => document.getElementById(id);
const els = {
  root: $('minimap'),
  canvas: $('minimap-canvas'),
  close: $('btn-map-close'),
  button: $('btn-map'),
  legend: $('map-legend'),
};

export function bindMinimap() {
  els.button.addEventListener('click', () => toggleMinimap());
  els.close.addEventListener('click', () => toggleMinimap(false));
  els.root.addEventListener('click', (e) => e.target === els.root && toggleMinimap(false));
}

export function toggleMinimap(open = !state.mapOpen) {
  state.mapOpen = open && state.screen === 'game';
  els.root.classList.toggle('hidden', !state.mapOpen);
  if (!state.mapOpen) return;
  const impostor = state.role === 'impostor';
  els.legend.textContent = impostor
    ? 'Amarillo: tus tareas falsas · Morado: trampillas · Rojo: botón de emergencia'
    : 'Amarillo: tus tareas pendientes · Rojo: botón de emergencia';
  sizeCanvas();
}

// El mapa ocupa lo que quepa en pantalla manteniendo su proporción.
function sizeCanvas() {
  const scale = Math.min((innerWidth - MARGIN) / MAP.width, (innerHeight - HEAD - MARGIN) / MAP.height);
  const dpr = Math.min(devicePixelRatio || 1, MAX_DPR);
  els.canvas.style.width = `${Math.floor(MAP.width * scale)}px`;
  els.canvas.style.height = `${Math.floor(MAP.height * scale)}px`;
  els.canvas.width = Math.floor(MAP.width * scale * dpr);
  els.canvas.height = Math.floor(MAP.height * scale * dpr);
}

function dot(ctx, x, y, r, fill, stroke = '#fff') {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = r * 0.35;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

// Nombres de las salas sobre una etiqueta color crema (tapa los rótulos del suelo).
function drawLabels(ctx, u) {
  ctx.font = `600 ${LABEL_PX * u}px Fredoka, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const padX = 5 * u;
  const h = (LABEL_PX + 6) * u;
  for (const room of ROOMS) {
    const [x, y] = room.label || (room.rect ? [room.rect[0] + room.rect[2] / 2, room.rect[1] + room.rect[3] / 2] : room.circle);
    const w = ctx.measureText(room.name).width + padX * 2;
    ctx.fillStyle = 'rgba(255, 248, 236, 0.92)';
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.brickMortar;
    ctx.fillText(room.name, x, y + u);
  }
}

// Se llama cada fotograma mientras el mapa está abierto (el punto propio se mueve).
export function updateMinimap(now) {
  if (!state.mapOpen) return;
  const ctx = els.canvas.getContext('2d');
  const k = els.canvas.width / MAP.width;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  // u = unidades del mundo por píxel de pantalla: así los tamaños no dependen del zoom.
  const u = els.canvas.width / parseFloat(els.canvas.style.width) / k;
  const map = getMapCanvas();
  if (map) ctx.drawImage(map, 0, 0, MAP.width, MAP.height);
  drawLabels(ctx, u);
  const pulse = 1 + Math.sin(now / 200) * 0.2;
  dot(ctx, EMERGENCY.x, EMERGENCY.y, 6 * u, PALETTE.brick);
  if (state.role === 'impostor') for (const v of VENTS) dot(ctx, v.x, v.y, 5 * u, '#8e5cc8');
  for (const p of pendingFixPoints()) dot(ctx, p.x, p.y, 8 * u * pulse, '#ff5a45');
  if (phase() === 'playing' && !wifiDown()) {
    for (const t of pendingTasks()) {
      const [x, y] = STATIONS[t.id];
      dot(ctx, x, y, 7 * u * pulse, PALETTE.tassel, PALETTE.cap);
    }
  }
  const me = playerInfo(state.myId);
  dot(ctx, state.me.x, state.me.y, 8 * u, languageById(me?.lang).color, '#fff');
}

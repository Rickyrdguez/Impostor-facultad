// Dentro de una trampilla: flechas hacia las trampillas conectadas.
// Se salta con WASD / flechas / joystick o pulsando la flecha; E para salir.

import { state } from './state.js';
import * as net from './network.js';
import { connectedVents, ventById } from './places.js';
import { closeMinigame } from './minigames/index.js';
import { moveVector } from './input.js';
import { screenToWorld } from './render.js';

const ARROW_DIST = 80; // distancia de las flechas al centro de la trampilla
const ARROW_HIT = 45; // radio en el que cuenta un toque sobre la flecha
const MAX_ANGLE = Math.PI / 2; // la dirección pulsada debe apuntar más o menos a la trampilla
const STICK_ON = 0.6; // fuerza mínima para saltar
const STICK_OFF = 0.2; // hay que soltar antes de volver a saltar

const $ = (id) => document.getElementById(id);
const els = {
  panel: $('vent-panel'),
  room: $('vent-room'),
  exit: $('btn-vent-exit'),
  touchZone: $('touch-zone'),
};

let armed = false; // evita saltar en cadena mientras se mantiene la tecla

function jump(id) {
  armed = false;
  net.send({ t: 'vent-move', to: id });
}

// Flechas a dibujar: una por trampilla conectada, apuntando hacia ella.
export function ventArrows() {
  if (!state.vent) return [];
  const here = ventById(state.vent);
  return connectedVents(state.vent).map((v) => {
    const angle = Math.atan2(v.y - here.y, v.x - here.x);
    return {
      id: v.id,
      room: v.room,
      angle,
      x: here.x + Math.cos(angle) * ARROW_DIST,
      y: here.y + Math.sin(angle) * ARROW_DIST,
    };
  });
}

function angleBetween(a, b) {
  const d = Math.abs(a - b) % (Math.PI * 2);
  return d > Math.PI ? Math.PI * 2 - d : d;
}

// Cada fotograma: WASD, flechas o joystick eligen la trampilla en esa dirección.
export function updateVentInput() {
  if (!state.vent) return;
  const v = moveVector();
  const strength = Math.hypot(v.x, v.y);
  if (strength < STICK_OFF) {
    armed = true;
    return;
  }
  if (!armed || strength < STICK_ON) return;
  const dir = Math.atan2(v.y, v.x);
  let best = null;
  for (const a of ventArrows()) {
    const diff = angleBetween(dir, a.angle);
    if (diff <= MAX_ANGLE && (!best || diff < best.diff)) best = { id: a.id, diff };
  }
  if (best) jump(best.id);
}

export function bindVentPanel(canvas) {
  els.exit.addEventListener('click', () => net.send({ t: 'vent' }));
  // Pulsar directamente sobre una flecha.
  canvas.addEventListener('pointerdown', (e) => {
    if (!state.vent) return;
    const p = screenToWorld(e.clientX, e.clientY);
    const hit = ventArrows().find((a) => Math.hypot(a.x - p.x, a.y - p.y) <= ARROW_HIT);
    if (hit) jump(hit.id);
  });
}

// Llega 'vent' del servidor: entra, cambia de trampilla o sale.
export function onVent(id) {
  state.vent = id;
  armed = false; // hay que soltar la tecla con la que se venía andando
  closeMinigame();
  els.panel.classList.toggle('hidden', !id);
  // Sin joystick dentro de la trampilla, para que los toques lleguen a las flechas.
  els.touchZone.classList.toggle('in-vent', Boolean(id));
  if (id) els.room.textContent = ventById(id).room;
}

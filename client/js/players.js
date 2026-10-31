// Movimiento propio y posiciones interpoladas de los demás jugadores.

import { state } from './state.js';
import { moveWithCollisions } from './map.js';
import { moveVector } from './input.js';
import { INTERP_DELAY_MS, PLAYER_RADIUS, PLAYER_SPEED } from '../../shared/constants.js';

const MAX_SNAPS = 20;
const WALK_FREQ = 0.09; // velocidad de la animación de andar (por unidad recorrida)
const MOVE_EPSILON = 0.05;

// Actualiza la animación (rebote y mirada) según lo que se ha movido.
function animate(p, dx, dy) {
  const dist = Math.hypot(dx, dy);
  p.moving = dist > MOVE_EPSILON;
  if (!p.moving) return;
  p.walk += dist * WALK_FREQ;
  p.fx = dx / dist;
  p.fy = dy / dist;
}

export function updateMe(dt, ghost) {
  const me = state.me;
  const v = moveVector();
  const step = PLAYER_SPEED * dt;
  const next = moveWithCollisions(me.x, me.y, v.x * step, v.y * step, PLAYER_RADIUS, ghost);
  animate(me, next.x - me.x, next.y - me.y);
  me.x = next.x;
  me.y = next.y;
}

export function setMyPosition(x, y) {
  state.me.x = x;
  state.me.y = y;
}

// Llega un snapshot del servidor: [id, x, y] por jugador.
export function onSnapshot(list) {
  const time = performance.now();
  const seen = new Set();
  for (const [id, x, y] of list) {
    if (id === state.myId) continue;
    seen.add(id);
    let o = state.others.get(id);
    if (!o) {
      o = { snaps: [], x, y, fx: 0, fy: 1, moving: false, walk: 0 };
      state.others.set(id, o);
    }
    o.snaps.push({ time, x, y });
    if (o.snaps.length > MAX_SNAPS) o.snaps.shift();
  }
  for (const id of state.others.keys()) if (!seen.has(id)) state.others.delete(id);
}

// Posición en un instante pasado, interpolando entre dos snapshots.
function sample(snaps, t) {
  const last = snaps[snaps.length - 1];
  if (t >= last.time) return last;
  for (let i = snaps.length - 1; i > 0; i--) {
    const a = snaps[i - 1];
    const b = snaps[i];
    if (t >= a.time) {
      const k = (t - a.time) / (b.time - a.time || 1);
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
    }
  }
  return snaps[0];
}

export function updateOthers() {
  const t = performance.now() - INTERP_DELAY_MS;
  for (const o of state.others.values()) {
    if (!o.snaps.length) continue;
    const pos = sample(o.snaps, t);
    animate(o, pos.x - o.x, pos.y - o.y);
    o.x = pos.x;
    o.y = pos.y;
  }
}

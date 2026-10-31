// Trampillas del impostor: entrar, saltar entre trampillas conectadas y salir.
// Dentro de una trampilla el impostor es invisible y no puede moverse ni matar. Lógica pura.

import { VENTS, connectedVents, ventById } from '../client/js/places.js';
import { USE_RANGE } from './config.js';
import { distance, isImpostor, playerList } from './info.js';

// Mensajes para el propio impostor: en qué trampilla está y su nueva posición.
function ventMessages(p) {
  const out = [{ to: p.id, msg: { t: 'vent', id: p.vent } }];
  if (p.vent) out.push({ to: p.id, msg: { t: 'pos', x: p.x, y: p.y } });
  return out;
}

function putIn(p, vent, now) {
  p.vent = vent.id;
  p.x = vent.x;
  p.y = vent.y;
  p.lastMoveAt = now;
}

// Pulsar "usar" sobre una trampilla: entra; si ya está dentro, sale.
export function toggleVent(room, id, msg, now) {
  const p = room.players[id];
  if (room.phase !== 'playing' || !p || !p.alive || !isImpostor(p)) return [];
  if (p.vent) {
    p.vent = null;
    p.lastMoveAt = now;
    return ventMessages(p);
  }
  const vent = VENTS.find((v) => distance(p, v) <= USE_RANGE);
  if (!vent) return [];
  putIn(p, vent, now);
  return ventMessages(p);
}

// Saltar a otra trampilla de la misma red.
export function moveVent(room, id, msg, now) {
  const p = room.players[id];
  if (room.phase !== 'playing' || !p || !p.vent) return [];
  const target = connectedVents(p.vent).find((v) => v.id === msg.to);
  if (!target) return [];
  putIn(p, ventById(target.id), now);
  return ventMessages(p);
}

// Al empezar una reunión todos salen de las trampillas.
export function leaveAllVents(room) {
  const out = [];
  for (const p of playerList(room)) {
    if (!p.vent) continue;
    p.vent = null;
    out.push(...ventMessages(p));
  }
  return out;
}

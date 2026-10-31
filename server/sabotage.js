// Sabotajes del impostor: wifi, luces y fuga de radón. Lógica pura.
// Solo puede haber uno activo; el radón hace perder a los tripulantes si no se cierra a tiempo.

import { FIX_POINTS, fixPointsOf } from '../client/js/places.js';
import { sabotageById } from '../shared/constants.js';
import { RADON_MS, SABOTAGE_COOLDOWN_MS, USE_RANGE } from './config.js';
import { distance, isImpostor, playerList, toAll } from './info.js';
import { endGame } from './victory.js';

// Estado del sabotaje para los clientes (ms = tiempo que queda, solo en el radón).
export function sabotageMessage(room, now) {
  const s = room.sabotage;
  if (!s) return { t: 'sabotage', kind: null };
  const ms = s.endsAt ? Math.max(0, s.endsAt - now) : null;
  return { t: 'sabotage', kind: s.kind, ms, fixed: Object.keys(s.fixed) };
}

// A cada impostor: cuánto falta para poder volver a sabotear.
function cooldownMessages(room, now) {
  const ms = Math.max(0, room.sabotageReadyAt - now);
  return playerList(room)
    .filter(isImpostor)
    .map((p) => ({ to: p.id, msg: { t: 'sabotage-cooldown', ms } }));
}

export function resetSabotage(room, now) {
  room.sabotage = null;
  room.sabotageReadyAt = now + SABOTAGE_COOLDOWN_MS;
  return cooldownMessages(room, now);
}

export function sabotage(room, id, msg, now) {
  const p = room.players[id];
  if (room.phase !== 'playing' || !p || !isImpostor(p) || !sabotageById(msg.kind)) return [];
  if (room.sabotage || now < room.sabotageReadyAt) return [];
  const radon = msg.kind === 'radon';
  room.sabotage = { kind: msg.kind, endsAt: radon ? now + RADON_MS : null, fixed: {} };
  room.sabotageReadyAt = now + SABOTAGE_COOLDOWN_MS;
  return [toAll(sabotageMessage(room, now)), ...cooldownMessages(room, now)];
}

// Un jugador vivo arregla un punto del sabotaje activo estando cerca.
export function fix(room, id, msg, now) {
  const p = room.players[id];
  const s = room.sabotage;
  if (room.phase !== 'playing' || !s || !p || !p.alive) return [];
  const point = FIX_POINTS.find((f) => f.id === msg.point && f.sabotage === s.kind);
  if (!point || distance(p, point) > USE_RANGE) return [];
  s.fixed[point.id] = true;
  const done = fixPointsOf(s.kind).every((f) => s.fixed[f.id]);
  if (done) room.sabotage = null;
  return [toAll(sabotageMessage(room, now))];
}

// Cada tick: si el radón llega a cero, gana el impostor.
export function tickSabotage(room, now) {
  const s = room.sabotage;
  if (room.phase !== 'playing' || !s || !s.endsAt || now < s.endsAt) return [];
  room.sabotage = null;
  return endGame(room, { winner: 'impostor', reason: 'radon' });
}

// Una reunión cierra la fuga de radón (las luces y el wifi siguen rotos).
export function onMeetingStart(room, now) {
  if (room.sabotage?.kind !== 'radon') return [];
  room.sabotage = null;
  return [toAll(sabotageMessage(room, now))];
}

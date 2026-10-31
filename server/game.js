// Reglas del juego. Lógica pura: sin ws ni Node.
// Cada función recibe la sala (estado), la modifica y devuelve la lista de
// mensajes a enviar: [{ to: 'all' | idJugador, msg }].

import { LANGUAGES, PLAYER_RADIUS, PLAYER_SPEED } from '../shared/constants.js';
import { canStand, pathClear, spawnPoint } from '../client/js/map.js';
import { MAX_PLAYERS, MOVE_MAX_DT_MS, MOVE_SLACK, MOVE_TOLERANCE } from './config.js';

export function createRoom(code) {
  return { code, hostId: null, phase: 'lobby', players: {} };
}

export function playerCount(room) {
  return Object.keys(room.players).length;
}

export function isFull(room) {
  return playerCount(room) >= MAX_PLAYERS;
}

// Mensaje con la información "lenta" de la sala (nombres, host, fase).
export function roomInfo(room) {
  const players = Object.values(room.players).map((p) => ({
    id: p.id,
    name: p.name,
    lang: p.lang,
    alive: p.alive,
    connected: p.connected,
  }));
  return { t: 'room', code: room.code, hostId: room.hostId, phase: room.phase, players };
}

// Snapshot "rápido" con las posiciones: [id, x, y].
export function snapshot(room) {
  const p = Object.values(room.players).map((pl) => [pl.id, Math.round(pl.x), Math.round(pl.y)]);
  return { t: 's', p };
}

function freeLanguage(room) {
  const used = new Set(Object.values(room.players).map((p) => p.lang));
  const free = LANGUAGES.find((l) => !used.has(l.id));
  return free ? free.id : LANGUAGES[0].id;
}

// Evita nombres repetidos añadiendo un número.
function uniqueName(room, name) {
  const taken = new Set(Object.values(room.players).map((p) => p.name));
  let candidate = name;
  for (let n = 2; taken.has(candidate); n++) candidate = `${name.slice(0, 10)}${n}`;
  return candidate;
}

export function addPlayer(room, id, name, now) {
  const pos = spawnPoint(playerCount(room), MAX_PLAYERS);
  room.players[id] = {
    id,
    name: uniqueName(room, name),
    lang: freeLanguage(room),
    x: pos.x,
    y: pos.y,
    alive: true,
    connected: true,
    lastMoveAt: now,
  };
  if (!room.hostId) room.hostId = id;
  return [{ to: 'all', msg: roomInfo(room) }];
}

export function removePlayer(room, id) {
  if (!room.players[id]) return [];
  delete room.players[id];
  if (room.hostId === id) room.hostId = Object.keys(room.players)[0] || null;
  return [{ to: 'all', msg: roomInfo(room) }];
}

// Marca a un jugador como conectado o caído (sin sacarlo de la sala).
export function setConnected(room, id, connected) {
  const p = room.players[id];
  if (!p || p.connected === connected) return [];
  p.connected = connected;
  return [{ to: 'all', msg: roomInfo(room) }];
}

// Movimiento enviado por el cliente: se valida velocidad y paredes.
export function handleMove(room, id, msg, now) {
  const p = room.players[id];
  if (!p) return [];
  const ghost = !p.alive;
  const dt = Math.min(now - p.lastMoveAt, MOVE_MAX_DT_MS);
  const maxDist = (PLAYER_SPEED * Math.max(dt, 0)) / 1000 * MOVE_TOLERANCE + MOVE_SLACK;
  const dist = Math.hypot(msg.x - p.x, msg.y - p.y);
  const ok =
    dist <= maxDist &&
    canStand(msg.x, msg.y, PLAYER_RADIUS, ghost) &&
    pathClear(p.x, p.y, msg.x, msg.y, PLAYER_RADIUS, ghost);
  p.lastMoveAt = now;
  if (!ok) return [{ to: id, msg: { t: 'pos', x: p.x, y: p.y } }];
  p.x = msg.x;
  p.y = msg.y;
  return [];
}

// Se llama cada TICK_MS: temporizadores y reparto de posiciones.
export function tick(room) {
  return [{ to: 'all', msg: snapshot(room) }];
}

// Reglas del juego: estado de la sala, jugadores, movimiento y reparto de estado.
// Lógica pura: sin ws ni Node. Cada función recibe la sala (estado), la modifica
// y devuelve la lista de mensajes a enviar: [{ to: 'all' | idJugador, msg }].
// El resto de reglas está en lobby.js, actions.js, meeting.js y victory.js.

import { LANGUAGES, PLAYER_RADIUS, PLAYER_SPEED } from '../shared/constants.js';
import { canStand, pathClear } from '../client/js/map.js';
import { MAX_PLAYERS, MIN_PLAYERS, MOVE_MAX_DT_MS, MOVE_SLACK, MOVE_TOLERANCE } from './config.js';
import { playerCount, roomInfo, taskProgress, tasksMessage } from './info.js';
import { backToLobby, placeAtSpawn, roleMessage } from './lobby.js';
import { tickMeeting, forgetVoter } from './meeting.js';
import { checkVictory } from './victory.js';
import { sabotageMessage, tickSabotage } from './sabotage.js';

export function createRoom(code) {
  return { code, hostId: null, phase: 'lobby', players: {}, bodies: [], meeting: null };
}

export { playerCount, roomInfo };

export function isFull(room) {
  return playerCount(room) >= MAX_PLAYERS;
}

// Posiciones [id, x, y]. Los vivos no ven a los fantasmas; los fantasmas ven a todos.
function snapshot(room, withGhosts) {
  const p = Object.values(room.players)
    .filter((pl) => (withGhosts || pl.alive) && !pl.vent)
    .map((pl) => [pl.id, Math.round(pl.x), Math.round(pl.y)]);
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
  const p = {
    id,
    name: uniqueName(room, name),
    lang: freeLanguage(room),
    x: 0,
    y: 0,
    alive: true,
    connected: true,
    role: null,
    tasks: [],
    lastMoveAt: now,
  };
  room.players[id] = p;
  placeAtSpawn(p, playerCount(room) - 1, now);
  if (!room.hostId) room.hostId = id;
  return [{ to: 'all', msg: roomInfo(room) }];
}

// Un jugador sale de la sala (o caducó su reconexión) sin romper la partida.
export function removePlayer(room, id, now = 0) {
  if (!room.players[id]) return [];
  delete room.players[id];
  if (room.hostId === id) room.hostId = Object.keys(room.players)[0] || null;
  if (room.phase === 'lobby' || room.phase === 'ended') {
    return [{ to: 'all', msg: roomInfo(room) }];
  }
  if (playerCount(room) < MIN_PLAYERS) {
    const notice = { t: 'notice', text: 'No quedan jugadores suficientes: volvéis a la sala.' };
    return [{ to: 'all', msg: notice }, ...backToLobby(room, now)];
  }
  const out = [{ to: 'all', msg: roomInfo(room) }, ...forgetVoter(room, id, now)];
  return [...out, ...checkVictory(room)];
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
  if (!p || room.phase === 'meeting' || p.vent) return [];
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

// Todo lo que necesita un jugador que reconecta para seguir donde estaba.
export function rejoinState(room, id, now) {
  const p = room.players[id];
  const to = (msg) => ({ to: id, msg });
  const out = [to(roomInfo(room)), to({ t: 'bodies', list: room.bodies })];
  if (p.role) {
    out.push(to(roleMessage(room, p)), to(tasksMessage(p)), to(taskProgress(room)));
  }
  if (p.role === 'impostor') out.push(to({ t: 'cooldown', ms: Math.max(0, p.killReadyAt - now) }));
  if (p.vent) out.push(to({ t: 'vent', id: p.vent }));
  if (room.sabotage) out.push(to(sabotageMessage(room, now)));
  if (p.role === 'impostor') {
    out.push(to({ t: 'sabotage-cooldown', ms: Math.max(0, (room.sabotageReadyAt || 0) - now) }));
  }
  const m = room.meeting;
  if (m) {
    const ms = Math.max(0, m.endsAt - now);
    out.push(to({ t: 'meeting', caller: m.caller, body: m.body, ms, votedIds: Object.keys(m.votes) }));
    if (m.stage === 'results') out.push(to({ t: 'result', votes: m.votes, ...m.result, ms }));
  }
  if (room.result) out.push(to(room.result));
  return out;
}

// Se llama cada TICK_MS: temporizadores y reparto de posiciones.
export function tick(room, now) {
  const out = room.phase === 'meeting' ? tickMeeting(room, now) : tickSabotage(room, now);
  const forAlive = snapshot(room, false);
  const forGhosts = snapshot(room, true);
  for (const p of Object.values(room.players)) {
    out.push({ to: p.id, msg: p.alive ? forAlive : forGhosts });
  }
  return out;
}

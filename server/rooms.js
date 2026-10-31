// Salas: crear, unir, salir y reconectar. Capa de red (sockets y tokens).
// Las reglas están en game.js; aquí solo se enrutan sus mensajes.

import { randomBytes } from 'node:crypto';
import * as game from './game.js';
import { CODE_LETTERS, RECONNECT_GRACE_MS } from './config.js';
import { ROOM_CODE_LENGTH } from '../shared/constants.js';

// code -> { state, sockets: Map(id -> ws), dropped: Map(id -> hora de la caída) }
const rooms = new Map();
// token -> { code, id }: permite recuperar al jugador si se cae la conexión
const tokens = new Map();

function randomId(bytes) {
  return randomBytes(bytes).toString('hex');
}

function newCode() {
  let code;
  do {
    code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      code += CODE_LETTERS[Math.floor(Math.random() * CODE_LETTERS.length)];
    }
  } while (rooms.has(code));
  return code;
}

export function send(ws, msg) {
  if (ws && ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
}

// Entrega los mensajes que devuelve game.js.
function deliver(room, out) {
  for (const { to, msg } of out) {
    if (to === 'all') {
      const data = JSON.stringify(msg);
      for (const ws of room.sockets.values()) if (ws.readyState === ws.OPEN) ws.send(data);
    } else {
      send(room.sockets.get(to), msg);
    }
  }
}

function attach(ws, room, id, token) {
  room.sockets.set(id, ws);
  room.dropped.delete(id);
  ws.ctx = { code: room.state.code, id, token };
}

function enter(ws, room, name) {
  const id = randomId(4);
  const token = randomId(16);
  tokens.set(token, { code: room.state.code, id });
  attach(ws, room, id, token);
  send(ws, { t: 'welcome', id, token, code: room.state.code });
  deliver(room, game.addPlayer(room.state, id, name, Date.now()));
}

export function createRoom(ws, name) {
  const code = newCode();
  const room = { state: game.createRoom(code), sockets: new Map(), dropped: new Map() };
  rooms.set(code, room);
  enter(ws, room, name);
}

export function joinRoom(ws, code, name) {
  const room = rooms.get(code);
  if (!room) return send(ws, { t: 'error', text: 'No existe ninguna sala con ese código.' });
  if (game.isFull(room.state)) return send(ws, { t: 'error', text: 'La sala está llena.' });
  if (room.state.phase !== 'lobby') {
    return send(ws, { t: 'error', text: 'La partida ya ha empezado.' });
  }
  enter(ws, room, name);
}

// Vuelve un jugador cuya conexión se cayó: recupera su personaje.
export function resume(ws, token) {
  const entry = tokens.get(token);
  const room = entry && rooms.get(entry.code);
  if (!room || !room.state.players[entry.id]) {
    tokens.delete(token);
    return send(ws, { t: 'resume-failed' });
  }
  const old = room.sockets.get(entry.id);
  if (old && old !== ws) {
    old.ctx = null; // así su cierre no cuenta como caída
    old.terminate();
  }
  attach(ws, room, entry.id, token);
  send(ws, { t: 'welcome', id: entry.id, token, code: entry.code, resumed: true });
  deliver(room, game.setConnected(room.state, entry.id, true));
  deliver(room, game.rejoinState(room.state, entry.id, Date.now()));
}

// Saca del todo a un jugador de la sala.
function removePlayer(room, id) {
  room.sockets.delete(id);
  room.dropped.delete(id);
  for (const [token, entry] of tokens) if (entry.id === id) tokens.delete(token);
  deliver(room, game.removePlayer(room.state, id, Date.now()));
  if (game.playerCount(room.state) === 0) rooms.delete(room.state.code);
}

// El jugador pulsa "Salir": se va inmediatamente.
export function leave(ws) {
  const ctx = ws.ctx;
  const room = ctx && rooms.get(ctx.code);
  ws.ctx = null;
  if (room) removePlayer(room, ctx.id);
}

// Se cerró la conexión sin despedirse: se le guarda el sitio un rato.
export function drop(ws) {
  const ctx = ws.ctx;
  const room = ctx && rooms.get(ctx.code);
  ws.ctx = null;
  if (!room || room.sockets.get(ctx.id) !== ws) return;
  room.sockets.delete(ctx.id);
  room.dropped.set(ctx.id, Date.now());
  deliver(room, game.setConnected(room.state, ctx.id, false));
}

// Pasa un mensaje de juego del jugador a game.js.
export function dispatch(ws, handler, msg) {
  const ctx = ws.ctx;
  const room = ctx && rooms.get(ctx.code);
  if (!room) return;
  deliver(room, handler(room.state, ctx.id, msg, Date.now()));
}

// Llamado cada TICK_MS desde index.js: expulsa a los caídos hace tiempo y reparte estado.
export function tickAll(now = Date.now()) {
  for (const room of [...rooms.values()]) {
    for (const [id, since] of room.dropped) {
      if (now - since > RECONNECT_GRACE_MS) removePlayer(room, id);
    }
    if (rooms.has(room.state.code)) deliver(room, game.tick(room.state, now));
  }
}

export function roomCount() {
  return rooms.size;
}

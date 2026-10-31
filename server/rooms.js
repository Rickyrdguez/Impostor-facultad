// Salas: crear, unir, salir. Capa de red (sockets y tokens).
// Las reglas están en game.js; aquí solo se enrutan sus mensajes.

import { randomBytes } from 'node:crypto';
import * as game from './game.js';
import { CODE_LETTERS } from './config.js';
import { ROOM_CODE_LENGTH } from '../shared/constants.js';

// code -> { state, sockets: Map(id -> ws), tokens: Map(token -> id) }
const rooms = new Map();

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

function enter(ws, room, name) {
  const id = randomId(4);
  const token = randomId(16);
  room.sockets.set(id, ws);
  room.tokens.set(token, id);
  ws.ctx = { code: room.state.code, id };
  send(ws, { t: 'welcome', id, token, code: room.state.code });
  deliver(room, game.addPlayer(room.state, id, name, Date.now()));
}

export function createRoom(ws, name) {
  const code = newCode();
  const room = { state: game.createRoom(code), sockets: new Map(), tokens: new Map() };
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

// El jugador se va (o se cierra su conexión).
export function leave(ws) {
  const ctx = ws.ctx;
  if (!ctx) return;
  ws.ctx = null;
  const room = rooms.get(ctx.code);
  if (!room) return;
  room.sockets.delete(ctx.id);
  for (const [token, id] of room.tokens) if (id === ctx.id) room.tokens.delete(token);
  deliver(room, game.removePlayer(room.state, ctx.id));
  if (room.sockets.size === 0) rooms.delete(ctx.code);
}

// Pasa un mensaje de juego del jugador a game.js.
export function dispatch(ws, handler, msg) {
  const ctx = ws.ctx;
  const room = ctx && rooms.get(ctx.code);
  if (!room) return;
  deliver(room, handler(room.state, ctx.id, msg, Date.now()));
}

// Llamado cada TICK_MS desde index.js.
export function tickAll() {
  const now = Date.now();
  for (const room of rooms.values()) deliver(room, game.tick(room.state, now));
}

export function roomCount() {
  return rooms.size;
}

// Validación y manejo de los mensajes que llegan del cliente.

import * as rooms from './rooms.js';
import * as game from './game.js';
import { MAX_MESSAGE_BYTES, MAX_MESSAGES_PER_SECOND } from './config.js';
import { NAME_MAX_LENGTH, ROOM_CODE_LENGTH } from '../shared/constants.js';

// Limpia un nombre: sin caracteres de control, espacios simples, máx. 12.
export function cleanName(raw) {
  if (typeof raw !== 'string') return 'Anónimo';
  const name = raw
    .replace(/[\u0000-\u001f\u007f<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return [...name].slice(0, NAME_MAX_LENGTH).join('').trim() || 'Anónimo';
}

function cleanCode(raw) {
  if (typeof raw !== 'string') return '';
  return raw.toUpperCase().replace(/[^A-Z]/g, '').slice(0, ROOM_CODE_LENGTH);
}

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

// Cada tipo de mensaje: comprobación de formato + acción.
const handlers = {
  create: {
    valid: () => true,
    run: (ws, m) => rooms.createRoom(ws, cleanName(m.name)),
  },
  join: {
    valid: (m) => typeof m.code === 'string',
    run: (ws, m) => rooms.joinRoom(ws, cleanCode(m.code), cleanName(m.name)),
  },
  leave: {
    valid: () => true,
    run: (ws) => rooms.leave(ws),
  },
  move: {
    valid: (m) => isNum(m.x) && isNum(m.y),
    run: (ws, m) => rooms.dispatch(ws, game.handleMove, { x: m.x, y: m.y }),
  },
};

// Limita cuántos mensajes por segundo puede mandar cada conexión.
function overRate(ws) {
  const now = Date.now();
  if (!ws.rate || now - ws.rate.start >= 1000) ws.rate = { start: now, count: 0 };
  ws.rate.count++;
  return ws.rate.count > MAX_MESSAGES_PER_SECOND;
}

function parse(data) {
  if (data.length > MAX_MESSAGE_BYTES) return null;
  try {
    const msg = JSON.parse(data.toString());
    return msg && typeof msg === 'object' && typeof msg.t === 'string' ? msg : null;
  } catch {
    return null;
  }
}

export function handleMessage(ws, data) {
  if (overRate(ws)) return;
  const msg = parse(data);
  const handler = msg && Object.hasOwn(handlers, msg.t) ? handlers[msg.t] : null;
  if (!handler || !handler.valid(msg)) return;
  // No se puede crear o unirse a otra sala sin salir antes.
  if ((msg.t === 'create' || msg.t === 'join') && ws.ctx) return;
  handler.run(ws, msg);
}

// Validación y manejo de los mensajes que llegan del cliente.

import * as rooms from './rooms.js';
import * as game from './game.js';
import * as lobby from './lobby.js';
import * as actions from './actions.js';
import * as meeting from './meeting.js';
import * as vents from './vents.js';
import * as sabotage from './sabotage.js';
import * as settings from './settings.js';
import { MAX_MESSAGE_BYTES, MAX_MESSAGES_PER_SECOND } from './config.js';
import { CHAT_MAX_LENGTH, NAME_MAX_LENGTH, ROOM_CODE_LENGTH } from '../shared/constants.js';

const TOKEN_MAX_LENGTH = 64;
const ID_MAX_LENGTH = 16;
const ENTRY_TYPES = new Set(['create', 'join', 'resume']); // mensajes para entrar en una sala

// Quita caracteres de control y espacios repetidos, y recorta a max letras.
function cleanText(raw, max) {
  if (typeof raw !== 'string') return '';
  const text = raw
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return [...text].slice(0, max).join('').trim();
}

// Nombres: además sin < ni >, máx. 12 letras.
export function cleanName(raw) {
  return cleanText(typeof raw === 'string' ? raw.replace(/[<>]/g, '') : '', NAME_MAX_LENGTH) || 'Anónimo';
}

function cleanCode(raw) {
  if (typeof raw !== 'string') return '';
  return raw.toUpperCase().replace(/[^A-Z]/g, '').slice(0, ROOM_CODE_LENGTH);
}

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isShortString = (v, max) => typeof v === 'string' && v.length <= max;
const always = () => true;

// Acción de juego sin datos extra: solo se pasa a la regla correspondiente.
const simple = (rule) => ({ valid: always, run: (ws) => rooms.dispatch(ws, rule, {}) });

// Cada tipo de mensaje: comprobación de formato + acción.
const handlers = {
  create: {
    valid: always,
    run: (ws, m) => rooms.createRoom(ws, cleanName(m.name)),
  },
  join: {
    valid: (m) => typeof m.code === 'string',
    run: (ws, m) => rooms.joinRoom(ws, cleanCode(m.code), cleanName(m.name)),
  },
  resume: {
    valid: (m) => isShortString(m.token, TOKEN_MAX_LENGTH),
    run: (ws, m) => rooms.resume(ws, m.token),
  },
  leave: {
    valid: always,
    run: (ws) => rooms.leave(ws),
  },
  move: {
    valid: (m) => isNum(m.x) && isNum(m.y),
    run: (ws, m) => rooms.dispatch(ws, game.handleMove, { x: m.x, y: m.y }),
  },
  lang: {
    valid: (m) => isShortString(m.lang, ID_MAX_LENGTH),
    run: (ws, m) => rooms.dispatch(ws, lobby.chooseLanguage, { lang: m.lang }),
  },
  start: simple(lobby.startGame),
  setting: {
    valid: (m) => isShortString(m.id, ID_MAX_LENGTH),
    run: (ws, m) => rooms.dispatch(ws, settings.changeSetting, { id: m.id, value: m.value }),
  },
  lobby: simple(lobby.returnToLobby),
  kill: simple(actions.kill),
  report: simple(actions.report),
  'task-start': simple(actions.taskStart),
  'task-done': simple(actions.taskDone),
  emergency: simple(actions.emergency),
  vent: simple(vents.toggleVent),
  'vent-move': {
    valid: (m) => isShortString(m.to, ID_MAX_LENGTH),
    run: (ws, m) => rooms.dispatch(ws, vents.moveVent, { to: m.to }),
  },
  sabotage: {
    valid: (m) => isShortString(m.kind, ID_MAX_LENGTH),
    run: (ws, m) => rooms.dispatch(ws, sabotage.sabotage, { kind: m.kind }),
  },
  fix: {
    valid: (m) => isShortString(m.point, ID_MAX_LENGTH),
    run: (ws, m) => rooms.dispatch(ws, sabotage.fix, { point: m.point }),
  },
  vote: {
    valid: (m) => isShortString(m.target, ID_MAX_LENGTH),
    run: (ws, m) => rooms.dispatch(ws, meeting.vote, { target: m.target }),
  },
  chat: {
    valid: (m) => typeof m.text === 'string',
    run: (ws, m) => rooms.dispatch(ws, meeting.chat, { text: cleanText(m.text, CHAT_MAX_LENGTH) }),
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
  if (ENTRY_TYPES.has(msg.t) && ws.ctx) return;
  handler.run(ws, msg);
}

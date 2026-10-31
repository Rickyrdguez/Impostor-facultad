// Consultas y mensajes comunes sobre el estado de la sala. Lógica pura.

import { MIN_PLAYERS } from './config.js';

export function playerList(room) {
  return Object.values(room.players);
}

export function playerCount(room) {
  return playerList(room).length;
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export const isImpostor = (p) => p.role === 'impostor';

// Información "lenta" de la sala. Los roles no se mandan aquí (son secretos).
export function roomInfo(room) {
  const players = playerList(room).map((p) => ({
    id: p.id,
    name: p.name,
    lang: p.lang,
    alive: p.alive,
    connected: p.connected,
    buttonUsed: Boolean(p.emergencyUsed),
  }));
  return {
    t: 'room',
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    minPlayers: MIN_PLAYERS,
    players,
  };
}

export const toAll = (msg) => ({ to: 'all', msg });

// Progreso global de tareas: solo cuentan las de los tripulantes.
export function taskProgress(room) {
  let done = 0;
  let total = 0;
  for (const p of playerList(room)) {
    if (p.role !== 'crew') continue;
    total += p.tasks.length;
    done += p.tasks.filter((t) => t.done).length;
  }
  return { t: 'progress', done, total };
}

// Lista de tareas que ve cada jugador (las del impostor son falsas).
export function tasksMessage(p) {
  return { t: 'tasks', list: p.tasks.map((t) => ({ id: t.id, done: t.done })) };
}

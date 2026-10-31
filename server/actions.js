// Acciones durante la partida: matar, reportar y hacer tareas. Lógica pura.
// El servidor elige el objetivo y comprueba distancias: no se fía del cliente.

import { EMERGENCY, STATIONS } from '../client/js/places.js';
import {
  KILL_COOLDOWN_MS,
  KILL_RANGE,
  REPORT_RANGE,
  TASK_HOLD_MS,
  TASK_TIME_TOLERANCE,
  USE_RANGE,
} from './config.js';
import { distance, isImpostor, playerList, roomInfo, taskProgress, tasksMessage, toAll } from './info.js';
import { startMeeting } from './meeting.js';
import { checkVictory } from './victory.js';

// El elemento de la lista más cercano a p dentro del rango (o null).
function nearest(p, list, range) {
  let best = null;
  for (const item of list) {
    const d = distance(p, item);
    if (d <= range && (!best || d < distance(p, best))) best = item;
  }
  return best;
}

function stationOf(taskId) {
  const [x, y] = STATIONS[taskId];
  return { x, y };
}

export function kill(room, id, msg, now) {
  const killer = room.players[id];
  if (room.phase !== 'playing' || !killer || !killer.alive || !isImpostor(killer)) return [];
  if (now < killer.killReadyAt || killer.vent) return [];
  const victims = playerList(room).filter((p) => p.alive && !isImpostor(p) && !p.vent);
  const victim = nearest(killer, victims, KILL_RANGE);
  if (!victim) return [];

  victim.alive = false;
  victim.taskStart = null;
  room.bodies.push({ id: victim.id, x: Math.round(victim.x), y: Math.round(victim.y) });
  killer.killReadyAt = now + KILL_COOLDOWN_MS;
  return [
    toAll(roomInfo(room)),
    toAll({ t: 'bodies', list: room.bodies }),
    { to: victim.id, msg: { t: 'killed', by: killer.id } },
    { to: killer.id, msg: { t: 'cooldown', ms: KILL_COOLDOWN_MS } },
    ...checkVictory(room),
  ];
}

export function report(room, id, msg, now) {
  const p = room.players[id];
  if (room.phase !== 'playing' || !p || !p.alive) return [];
  const body = nearest(p, room.bodies, REPORT_RANGE);
  if (!body) return [];
  return startMeeting(room, id, body.id, now);
}

// Empieza a mantener E: se apunta la tarea pendiente más cercana.
export function taskStart(room, id, msg, now) {
  const p = room.players[id];
  if (room.phase !== 'playing' || !p || p.role !== 'crew') return [];
  const pending = p.tasks.filter((t) => !t.done).map((t) => ({ ...stationOf(t.id), id: t.id }));
  const task = nearest(p, pending, USE_RANGE);
  p.taskStart = task ? { id: task.id, at: now } : null;
  return [];
}

// Termina de mantener E: si ha pasado el tiempo y sigue cerca, la tarea cuenta.
export function taskDone(room, id, msg, now) {
  const p = room.players[id];
  const started = p && p.taskStart;
  if (room.phase !== 'playing' || !started) return [];
  p.taskStart = null;
  const longEnough = now - started.at >= TASK_HOLD_MS * TASK_TIME_TOLERANCE;
  const close = distance(p, stationOf(started.id)) <= USE_RANGE;
  const task = p.tasks.find((t) => t.id === started.id);
  if (!longEnough || !close || !task || task.done) return [];
  task.done = true;
  return [{ to: id, msg: tasksMessage(p) }, toAll(taskProgress(room)), ...checkVictory(room)];
}

// Botón de emergencia: una vez por jugador y partida, y no justo después de una reunión.
export function emergency(room, id, msg, now) {
  const p = room.players[id];
  if (room.phase !== 'playing' || !p || !p.alive || p.vent) return [];
  if (distance(p, EMERGENCY) > USE_RANGE) return [];
  if (p.emergencyUsed) return [{ to: id, msg: { t: 'notice', text: 'Ya has usado tu botón de emergencia.' } }];
  if (now < room.emergencyReadyAt) {
    const s = Math.ceil((room.emergencyReadyAt - now) / 1000);
    return [{ to: id, msg: { t: 'notice', text: `El botón estará listo en ${s} s.` } }];
  }
  if (room.sabotage) {
    return [{ to: id, msg: { t: 'notice', text: 'No se puede convocar una reunión durante un sabotaje.' } }];
  }
  p.emergencyUsed = true;
  return startMeeting(room, id, null, now);
}

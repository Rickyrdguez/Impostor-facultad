// Acciones del jugador: usar (mantener E), matar (Q) y reportar (R).
// El cliente solo decide si mostrar el botón activo; el servidor valida todo.

import { state, amAlive, phase, playerInfo } from './state.js';
import * as net from './network.js';
import { STATIONS } from './map.js';
import { KILL_RANGE, REPORT_RANGE, TASK_HOLD_MS, USE_RANGE } from '../../shared/constants.js';

const dist = (a, x, y) => Math.hypot(a.x - x, a.y - y);

const playing = () => phase() === 'playing';

// Tareas que me quedan (las falsas del impostor también, para disimular).
export function pendingTasks() {
  return state.tasks.filter((t) => !t.done && !state.fakeDone.has(t.id));
}

export function nearestTask() {
  if (!playing()) return null;
  let best = null;
  for (const t of pendingTasks()) {
    const [x, y] = STATIONS[t.id];
    const d = dist(state.me, x, y);
    if (d <= USE_RANGE && (!best || d < best.d)) best = { id: t.id, d };
  }
  return best;
}

export function killCooldownMs() {
  return Math.max(0, state.killReadyAt - performance.now());
}

// ¿Hay alguien a quien matar? Solo cuenta a los vivos que no son aliados.
export function killTarget() {
  if (!playing() || state.role !== 'impostor' || !amAlive() || killCooldownMs() > 0) return null;
  for (const [id, o] of state.others) {
    const info = playerInfo(id);
    if (info?.alive && !state.allies.includes(id) && dist(state.me, o.x, o.y) <= KILL_RANGE) return id;
  }
  return null;
}

export function reportTarget() {
  if (!playing() || !amAlive()) return null;
  return state.bodies.find((b) => dist(state.me, b.x, b.y) <= REPORT_RANGE) || null;
}

function startUse() {
  const task = nearestTask();
  if (!task) return;
  state.hold = { id: task.id, start: performance.now() };
  if (state.role === 'crew') net.send({ t: 'task-start' });
}

// Botones y teclas llaman aquí: name = 'use' | 'kill' | 'report'.
export function act(name, down) {
  if (name === 'use') {
    if (down) startUse();
    else state.hold = null; // soltar antes de tiempo cancela la tarea
    return;
  }
  if (!down) return;
  if (name === 'kill' && killTarget()) net.send({ t: 'kill' });
  if (name === 'report' && reportTarget()) net.send({ t: 'report' });
}

// Progreso de la tarea en curso (0 a 1), o null si no hay.
export function holdProgress() {
  if (!state.hold) return null;
  return Math.min(1, (performance.now() - state.hold.start) / TASK_HOLD_MS);
}

// Cada fotograma: termina la tarea si se ha mantenido el tiempo suficiente.
export function updateActions() {
  if (!state.hold) return;
  if (!playing()) {
    state.hold = null;
    return;
  }
  if (holdProgress() < 1) return;
  const { id } = state.hold;
  state.hold = null;
  if (state.role === 'crew') net.send({ t: 'task-done' });
  else state.fakeDone.add(id); // el impostor solo finge
}

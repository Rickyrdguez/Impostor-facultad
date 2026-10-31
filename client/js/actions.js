// Acciones del jugador: usar (E: tarea, botón de emergencia o trampilla), matar (Q) y reportar (R).
// El cliente solo decide si mostrar el botón activo; el servidor valida todo.

import { state, amAlive, myInfo, phase, playerInfo } from './state.js';
import * as net from './network.js';
import { EMERGENCY, STATIONS, VENTS } from './places.js';
import { pendingFixPoints } from './sabotageui.js';
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
  if (!playing() || state.role !== 'impostor' || !amAlive() || state.vent || killCooldownMs() > 0) return null;
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

// Lo más cercano que se puede usar con E: { kind: 'task' | 'emergency' | 'vent', id } o null.
export function useTarget() {
  if (state.vent) return { kind: 'vent', id: state.vent }; // dentro: E para salir
  if (!playing()) return null;
  const options = [];
  const task = nearestTask();
  if (task) options.push({ kind: 'task', id: task.id, d: task.d });
  const me = myInfo();
  if (amAlive() && me && !me.buttonUsed && !state.sabotage) {
    const d = dist(state.me, EMERGENCY.x, EMERGENCY.y);
    if (d <= USE_RANGE) options.push({ kind: 'emergency', id: 'emergency', d });
  }
  if (amAlive()) {
    for (const p of pendingFixPoints()) {
      const d = dist(state.me, p.x, p.y);
      if (d <= USE_RANGE) options.push({ kind: 'fix', id: p.id, d });
    }
  }
  if (amAlive() && state.role === 'impostor') {
    for (const v of VENTS) {
      const d = dist(state.me, v.x, v.y);
      if (d <= USE_RANGE) options.push({ kind: 'vent', id: v.id, d });
    }
  }
  options.sort((a, b) => a.d - b.d);
  return options[0] || null;
}

function startUse() {
  const target = useTarget();
  if (!target) return;
  if (target.kind === 'emergency') return net.send({ t: 'emergency' });
  if (target.kind === 'vent') return net.send({ t: 'vent' });
  state.hold = { kind: target.kind, id: target.id, start: performance.now() };
  if (target.kind === 'task' && state.role === 'crew') net.send({ t: 'task-start' });
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
  const { id, kind } = state.hold;
  state.hold = null;
  if (kind === 'fix') net.send({ t: 'fix', point: id });
  else if (state.role === 'crew') net.send({ t: 'task-done' });
  else state.fakeDone.add(id); // el impostor solo finge
}

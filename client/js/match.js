// Mensajes del servidor sobre la partida: roles, tareas, cuerpos, reuniones y final.

import { state, phase, resetMatch } from './state.js';
import * as net from './network.js';
import * as ui from './ui.js';
import * as hud from './hud.js';
import * as meeting from './meeting.js';
import * as end from './endscreen.js';
import { renderLobby } from './lobby.js';
import { onSnapshot, setMyPosition } from './players.js';
import { onVent } from './ventui.js';
import { closeMinigame } from './minigames/index.js';
import { toggleMinimap } from './minimap.js';
import { clearSabotage, onSabotage, onSabotageCooldown } from './sabotageui.js';

let lastPhase = null;

// Cambio de fase de la sala: qué pantallas se abren o se cierran.
function onPhaseChange(now) {
  if (now !== 'playing') closeMinigame();
  if (now !== 'playing') {
    onVent(null);
    toggleMinimap(false);
  }
  if (now === 'lobby' || now === 'ended') clearSabotage();
  if (now === 'lobby') {
    resetMatch();
    end.hideEnd();
    meeting.closeMeeting();
  }
  if (now === 'playing') meeting.closeMeeting();
  if (now !== 'ended') end.hideEnd();
}

net.on('room', (m) => {
  state.room = m;
  if (m.phase !== lastPhase) {
    onPhaseChange(m.phase);
    lastPhase = m.phase;
  }
  ui.renderRoom(m, state.myId);
  renderLobby();
  hud.renderHudPhase();
  meeting.refreshMeeting();
  end.renderEnd();
});

net.on('s', (m) => {
  onSnapshot(m.p);
  const mine = m.p.find(([id]) => id === state.myId);
  if (mine && !state.me.placed) {
    setMyPosition(mine[1], mine[2]);
    state.me.placed = true;
  }
});

net.on('pos', (m) => setMyPosition(m.x, m.y));

net.on('role', (m) => {
  state.role = m.role;
  state.allies = m.allies;
  state.fakeDone = new Set();
  hud.renderHudPhase();
  if (phase() === 'playing') hud.showRoleBanner();
});

net.on('tasks', (m) => {
  state.tasks = m.list;
  hud.renderTasks();
  hud.renderHudPhase();
});

net.on('progress', (m) => {
  state.progress = { done: m.done, total: m.total };
  hud.renderProgress();
});

net.on('bodies', (m) => (state.bodies = m.list));

net.on('cooldown', (m) => (state.killReadyAt = performance.now() + m.ms));

net.on('killed', () => ui.toast('¡Te han eliminado! Ahora eres un fantasma.'));

net.on('meeting', (m) => {
  closeMinigame();
  meeting.openMeeting(m);
});

net.on('chat', (m) => meeting.onChat(m));
net.on('voted', (m) => meeting.onVoted(m));
net.on('result', (m) => meeting.onResult(m));

net.on('end', (m) => {
  meeting.closeMeeting();
  end.showEnd(m);
});

net.on('notice', (m) => ui.toast(m.text));

net.on('vent', (m) => onVent(m.id));

net.on('sabotage', (m) => {
  const wasWifi = state.sabotage?.kind === 'wifi';
  onSabotage(m);
  if (!m.kind) closeMinigame();
  if (wasWifi || m.kind === 'wifi') hud.renderTasks();
});

net.on('sabotage-cooldown', (m) => onSabotageCooldown(m.ms));

// Al salir de la sala hay que olvidar la fase para que la próxima empiece limpia.
export function forgetPhase() {
  lastPhase = null;
  resetMatch();
  onVent(null);
  toggleMinimap(false);
  clearSabotage();
  meeting.closeMeeting();
  end.hideEnd();
}

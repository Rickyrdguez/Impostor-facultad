// Arranque del cliente y bucle principal.

import { state, playerInfo, amAlive, phase } from './state.js';
import * as net from './network.js';
import * as ui from './ui.js';
import { initInput, setActionHandler } from './input.js';
import { initRender, prepareMap, render } from './render.js';
import { updateMe, updateOthers } from './players.js';
import { bindHome, tryResume } from './session.js';
import { bindLobby } from './lobby.js';
import { bindHud, updateButtons } from './hud.js';
import { bindMeeting, isMeetingOpen, updateMeeting } from './meeting.js';
import { bindEnd } from './endscreen.js';
import { act, holdProgress, pendingTasks, updateActions } from './actions.js';
import './match.js';
import { MAP, STATIONS } from './map.js';
import { SEND_RATE_MS, VISION_CREW, VISION_IMPOSTOR } from '../../shared/constants.js';

const MAX_DT = 0.1; // s; evita saltos si la pestaña estuvo parada
const FONT_TIMEOUT_MS = 1500;

let lastFrame = performance.now();
let lastSend = 0;
let lastSent = { x: NaN, y: NaN };

// Manda la posición propia unas 20 veces por segundo (si ha cambiado).
function sendPosition(now) {
  if (now - lastSend < SEND_RATE_MS) return;
  const { x, y } = state.me;
  if (x === lastSent.x && y === lastSent.y) return;
  lastSend = now;
  lastSent = { x, y };
  net.send({ t: 'move', x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
}

function characters() {
  const list = [];
  for (const [id, o] of state.others) {
    const info = playerInfo(id);
    if (info) list.push({ ...o, name: info.name, lang: info.lang, ghost: !info.alive });
  }
  const me = playerInfo(state.myId);
  if (me && state.me.placed) list.push({ ...state.me, name: me.name, lang: me.lang, ghost: !me.alive });
  return list;
}

// Radio de visión: los fantasmas lo ven todo y el impostor ve más lejos.
function visionRadius() {
  if (!amAlive()) return Infinity;
  return state.role === 'impostor' ? VISION_IMPOSTOR : VISION_CREW;
}

function gameView() {
  const bodies = state.bodies.map((b) => ({ ...b, lang: playerInfo(b.id)?.lang }));
  const markers = phase() === 'playing' ? pendingTasks().map((t) => STATIONS[t.id]) : [];
  return {
    cx: state.me.x,
    cy: state.me.y,
    vision: visionRadius(),
    characters: characters(),
    bodies,
    markers,
    ring: holdProgress(),
  };
}

// Vista de fondo en la pantalla de inicio: la cámara recorre el mapa.
function homeView(now) {
  const t = now / 9000;
  return {
    cx: MAP.width / 2 + Math.cos(t) * 500,
    cy: MAP.height / 2 + Math.sin(t * 0.7) * 800,
    vision: Infinity,
    characters: [],
  };
}

// Solo se anda si no hay reunión ni pantalla final y no se está haciendo una tarea.
function canWalk() {
  const p = phase();
  return net.isOpen() && !state.hold && !isMeetingOpen() && (p === 'lobby' || p === 'playing');
}

function frame(now) {
  const dt = Math.min((now - lastFrame) / 1000, MAX_DT);
  lastFrame = now;
  if (state.screen === 'game' && state.me.placed) {
    if (canWalk()) updateMe(dt, !amAlive());
    updateOthers();
    updateActions();
    updateButtons();
    updateMeeting();
    sendPosition(now);
    render(gameView());
  } else {
    render(homeView(now));
    ui.drawLogo(now);
  }
  requestAnimationFrame(frame);
}

async function start() {
  initRender(document.getElementById('game'));
  initInput(ui.els.stick, ui.els.knob);
  setActionHandler(act);
  bindHome();
  bindLobby();
  bindHud();
  bindMeeting();
  bindEnd();
  tryResume();
  // Espera a la fuente para que los nombres del suelo salgan con Fredoka.
  const timeout = new Promise((r) => setTimeout(r, FONT_TIMEOUT_MS));
  await Promise.race([document.fonts.load('600 34px Fredoka'), timeout]).catch(() => {});
  prepareMap();
  requestAnimationFrame(frame);
}

start();

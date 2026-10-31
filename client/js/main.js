// Arranque del cliente y bucle principal.

import { state, playerInfo } from './state.js';
import * as net from './network.js';
import * as ui from './ui.js';
import { initInput, clearKeys } from './input.js';
import { initRender, prepareMap, render } from './render.js';
import { updateMe, updateOthers, onSnapshot, setMyPosition } from './players.js';
import { MAP } from './map.js';
import { SEND_RATE_MS, VISION_CREW } from '../../shared/constants.js';

const NAME_KEY = 'impostor-nombre';
const MAX_DT = 0.1; // s; evita saltos si la pestaña estuvo parada
const FONT_TIMEOUT_MS = 1500;

let lastFrame = performance.now();
let lastSend = 0;
let lastSent = { x: NaN, y: NaN };

// ---------- Mensajes del servidor ----------

net.on('welcome', (m) => {
  state.myId = m.id;
  state.screen = 'game';
  state.me.placed = false;
  state.others.clear();
  ui.showGame();
  ui.setBusy(false);
});

net.on('room', (m) => {
  state.room = m;
  ui.renderRoom(m, state.myId);
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

net.on('error', (m) => {
  ui.setBusy(false);
  if (state.screen === 'home') ui.setHomeError(m.text);
  else ui.toast(m.text);
});

net.on('close', () => {
  if (state.screen === 'game') ui.toast('Se ha perdido la conexión con el servidor.');
  backToHome();
});

// ---------- Acciones de la pantalla de inicio ----------

function playerName() {
  const name = ui.els.name.value.trim();
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {}
  return name;
}

async function sendWhenConnected(msg) {
  ui.setBusy(true);
  ui.setHomeError('');
  try {
    if (!net.isOpen()) await net.connect();
    net.send(msg);
  } catch (err) {
    ui.setBusy(false);
    ui.setHomeError(err.message);
  }
}

function backToHome() {
  state.screen = 'home';
  state.myId = null;
  state.room = null;
  state.others.clear();
  clearKeys();
  ui.showHome();
  ui.setBusy(false);
}

function bindHome() {
  try {
    ui.els.name.value = localStorage.getItem(NAME_KEY) || '';
  } catch {}
  ui.els.create.addEventListener('click', () => {
    sendWhenConnected({ t: 'create', name: playerName() });
  });
  ui.els.join.addEventListener('click', () => {
    const code = ui.els.code.value.trim().toUpperCase();
    if (code.length !== 4) return ui.setHomeError('El código tiene 4 letras.');
    sendWhenConnected({ t: 'join', code, name: playerName() });
  });
  ui.els.code.addEventListener('keydown', (e) => e.key === 'Enter' && ui.els.join.click());
  ui.els.name.addEventListener('keydown', (e) => e.key === 'Enter' && ui.els.create.click());
  ui.els.leave.addEventListener('click', () => {
    net.send({ t: 'leave' });
    backToHome();
  });
}

// ---------- Bucle principal ----------

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
    if (info) list.push({ ...o, name: info.name, lang: info.lang });
  }
  const me = playerInfo(state.myId);
  if (me && state.me.placed) list.push({ ...state.me, name: me.name, lang: me.lang });
  return list;
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

function frame(now) {
  const dt = Math.min((now - lastFrame) / 1000, MAX_DT);
  lastFrame = now;
  if (state.screen === 'game' && state.me.placed) {
    updateMe(dt, false);
    updateOthers();
    sendPosition(now);
    render({ cx: state.me.x, cy: state.me.y, vision: VISION_CREW, characters: characters() });
  } else {
    render(homeView(now));
    ui.drawLogo(now);
  }
  requestAnimationFrame(frame);
}

async function start() {
  initRender(document.getElementById('game'));
  initInput(ui.els.stick, ui.els.knob);
  bindHome();
  // Espera a la fuente para que los nombres del suelo salgan con Fredoka.
  const timeout = new Promise((r) => setTimeout(r, FONT_TIMEOUT_MS));
  await Promise.race([document.fonts.load('600 34px Fredoka'), timeout]).catch(() => {});
  prepareMap();
  requestAnimationFrame(frame);
}

start();

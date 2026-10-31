// Sesión del jugador: entrar en una sala, salir y reconectar con el token.

import { state } from './state.js';
import * as net from './network.js';
import * as ui from './ui.js';
import { clearKeys } from './input.js';
import { RECONNECT_GRACE_MS } from '../../shared/constants.js';

const TOKEN_KEY = 'impostor-token'; // sessionStorage: uno por pestaña
const NAME_KEY = 'impostor-nombre'; // localStorage: se recuerda el nombre

let giveUpTimer = null;

function storage(kind, key, value) {
  try {
    const store = kind === 'local' ? localStorage : sessionStorage;
    if (value === undefined) return store.getItem(key);
    if (value === null) store.removeItem(key);
    else store.setItem(key, value);
  } catch {
    return null;
  }
}

function enterGame(m) {
  state.myId = m.id;
  state.screen = 'game';
  state.me.placed = false; // se coloca con el siguiente snapshot
  state.others.clear();
  storage('session', TOKEN_KEY, m.token);
  net.keepConnected(true);
  ui.showGame();
  ui.setBusy(false);
}

function backToHome(message) {
  clearTimeout(giveUpTimer);
  net.keepConnected(false);
  storage('session', TOKEN_KEY, null);
  state.screen = 'home';
  state.myId = null;
  state.room = null;
  state.others.clear();
  clearKeys();
  ui.setReconnecting(false);
  ui.showHome();
  ui.setBusy(false);
  if (message) ui.toast(message);
}

net.on('welcome', (m) => {
  clearTimeout(giveUpTimer);
  ui.setReconnecting(false);
  enterGame(m);
  if (m.resumed) ui.toast('¡Reconectado!');
});

// Se cayó la conexión: aviso y, si no volvemos a tiempo, a la pantalla de inicio.
net.on('lost', () => {
  ui.setReconnecting(true);
  clearTimeout(giveUpTimer);
  giveUpTimer = setTimeout(
    () => backToHome('No se pudo recuperar la conexión.'),
    RECONNECT_GRACE_MS,
  );
});

// Ha vuelto la conexión: pedimos recuperar nuestro personaje.
net.on('open', () => {
  const token = storage('session', TOKEN_KEY);
  if (token) net.send({ t: 'resume', token });
});

net.on('resume-failed', () => backToHome(state.screen === 'game' ? 'Tu sitio en la sala ha caducado.' : ''));

net.on('error', (m) => {
  ui.setBusy(false);
  if (state.screen === 'home') ui.setHomeError(m.text);
  else ui.toast(m.text);
});

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

function playerName() {
  const name = ui.els.name.value.trim();
  storage('local', NAME_KEY, name);
  return name;
}

export function bindHome() {
  ui.els.name.value = storage('local', NAME_KEY) || '';
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

// Al recargar la página: si había sesión en esta pestaña, intenta volver a ella.
export function tryResume() {
  const token = storage('session', TOKEN_KEY);
  if (token) sendWhenConnected({ t: 'resume', token });
}

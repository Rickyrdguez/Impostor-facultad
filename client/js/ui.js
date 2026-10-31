// Interfaz HTML: pantalla de inicio, tarjeta de sala y avisos.
// Todo el texto de otros jugadores va con textContent (nunca innerHTML).

import { LANGUAGES, languageById } from '../../shared/constants.js';
import { drawCharacter } from './characters.js';

const $ = (id) => document.getElementById(id);
const TOAST_MS = 3000;
const LOGO_SWAP_MS = 1600; // cada cuánto cambia el lenguaje del logo
let toastTimer = null;

export const els = {
  home: $('home'),
  hud: $('hud'),
  name: $('name'),
  code: $('code'),
  create: $('btn-create'),
  join: $('btn-join'),
  leave: $('btn-leave'),
  homeError: $('home-error'),
  roomCode: $('room-code'),
  playerList: $('player-list'),
  touchZone: $('touch-zone'),
  stick: $('stick'),
  knob: $('knob'),
  toast: $('toast'),
  reconnecting: $('reconnecting'),
  logo: $('logo'),
};

export function showHome() {
  els.home.classList.remove('hidden');
  els.hud.classList.add('hidden');
  els.touchZone.classList.add('hidden');
}

export function showGame() {
  els.home.classList.add('hidden');
  els.hud.classList.remove('hidden');
  els.touchZone.classList.remove('hidden');
  els.homeError.textContent = '';
}

export function setReconnecting(on) {
  els.reconnecting.classList.toggle('hidden', !on);
}

export function setHomeError(text) {
  els.homeError.textContent = text;
}

export function setBusy(busy) {
  els.create.disabled = busy;
  els.join.disabled = busy;
}

export function toast(text) {
  els.toast.textContent = text;
  els.toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.add('hidden'), TOAST_MS);
}

function langDot(langId) {
  const lang = languageById(langId);
  const dot = document.createElement('span');
  dot.className = 'lang-dot';
  dot.style.background = lang.color;
  dot.style.color = lang.ink;
  dot.textContent = lang.short;
  return dot;
}

function tag(text, extra = '') {
  const t = document.createElement('span');
  t.className = `tag ${extra}`;
  t.textContent = text;
  return t;
}

// Lista de jugadores de la sala.
export function renderRoom(room, myId) {
  els.roomCode.textContent = room.code;
  const items = room.players.map((p) => {
    const li = document.createElement('li');
    const name = document.createElement('span');
    name.textContent = p.name;
    li.append(langDot(p.lang), name);
    if (p.id === room.hostId) li.append(tag('anfitrión', 'host'));
    if (p.id === myId) li.append(tag('tú'));
    return li;
  });
  els.playerList.replaceChildren(...items);
}

// Personaje de ejemplo en la tarjeta de inicio.
export function drawLogo(t) {
  const ctx = els.logo.getContext('2d');
  ctx.clearRect(0, 0, els.logo.width, els.logo.height);
  ctx.save();
  ctx.scale(2, 2);
  const look = Math.sin(t / 900);
  const lang = LANGUAGES[Math.floor(t / LOGO_SWAP_MS) % LANGUAGES.length].id;
  drawCharacter(ctx, { x: 40, y: 36, lang, name: '', fx: look, fy: 0.3, moving: true, walk: t / 160 });
  ctx.restore();
}

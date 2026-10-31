// Pantallas animadas: te han eliminado, aviso de reunión y expulsión.

import { playerInfo } from './state.js';
import { drawCharacter } from './characters.js';
import { play } from './sound.js';

const DEATH_MS = 2600;
const SPLASH_MS = 1400;
const EJECT_FLIGHT_MS = 4200;
const TYPE_MS = 45; // velocidad del texto que se escribe solo
const CANVAS_SCALE = 5; // el personaje ocupa casi todo el canvas

const $ = (id) => document.getElementById(id);
const els = {
  death: $('death'),
  deathKiller: $('death-killer'),
  deathCanvas: $('death-canvas'),
  splash: $('splash'),
  splashText: $('splash-text'),
  eject: $('eject'),
  ejectCanvas: $('eject-canvas'),
  ejectText: $('eject-text'),
  ejectSub: $('eject-sub'),
};
const timers = {};

function later(key, fn, ms) {
  clearTimeout(timers[key]);
  timers[key] = setTimeout(fn, ms);
}

// Dibuja un personaje grande en un canvas pequeño.
function portrait(canvas, langId, extra = {}) {
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(canvas.width / 2, canvas.height / 2 + 30);
  ctx.scale(CANVAS_SCALE, CANVAS_SCALE);
  drawCharacter(ctx, { x: 0, y: 0, lang: langId, name: '', fx: 0, fy: 0.4, moving: false, walk: 0, ...extra });
}

// Al morir: pantalla roja con quién te ha eliminado.
export function showDeath(killerId) {
  const killer = playerInfo(killerId);
  els.deathKiller.textContent = killer ? `Te ha pillado ${killer.name}` : '';
  if (killer) portrait(els.deathCanvas, killer.lang);
  els.death.classList.remove('hidden');
  play('kill');
  later('death', () => els.death.classList.add('hidden'), DEATH_MS);
}

// Aviso grande antes de abrir la reunión.
export function showSplash(text) {
  els.splashText.textContent = text;
  els.splash.classList.remove('hidden');
  play('meeting');
  later('splash', () => els.splash.classList.add('hidden'), SPLASH_MS);
}

export const SPLASH_DELAY_MS = SPLASH_MS;

// Texto que se va escribiendo letra a letra.
function typeText(node, text) {
  node.textContent = '';
  let i = 0;
  clearInterval(timers.type);
  timers.type = setInterval(() => {
    node.textContent = text.slice(0, ++i);
    if (i >= text.length) clearInterval(timers.type);
  }, TYPE_MS);
}

// Expulsión: el personaje sale volando por la pantalla y se dice si era el impostor.
export function showEjection(text, sub, langId) {
  els.eject.classList.remove('hidden');
  els.ejectSub.textContent = '';
  typeText(els.ejectText, text);
  later('ejectSub', () => (els.ejectSub.textContent = sub), text.length * TYPE_MS + 400);
  els.ejectCanvas.classList.toggle('hidden', !langId);
  if (langId) {
    portrait(els.ejectCanvas, langId);
    els.ejectCanvas.style.animation = 'none';
    void els.ejectCanvas.offsetWidth;
    els.ejectCanvas.style.animation = '';
    play('eject');
  }
  later('eject', hideEjection, EJECT_FLIGHT_MS + 1500);
}

export function hideEjection() {
  clearInterval(timers.type);
  els.eject.classList.add('hidden');
}

// Al salir de la partida se quitan todas.
export function clearEffects() {
  for (const key of Object.keys(timers)) {
    clearTimeout(timers[key]);
    clearInterval(timers[key]);
  }
  els.death.classList.add('hidden');
  els.splash.classList.add('hidden');
  hideEjection();
}

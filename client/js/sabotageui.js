// Sabotajes en el cliente: menú del impostor, alarma en pantalla y puntos de arreglo.

import { state, amAlive, phase } from './state.js';
import * as net from './network.js';
import { FIX_POINTS } from './places.js';
import { SABOTAGES, sabotageById } from '../../shared/constants.js';
import { play } from './sound.js';

const $ = (id) => document.getElementById(id);
const els = {
  menu: $('sabotage-menu'),
  options: $('sabotage-options'),
  hint: $('sabotage-hint'),
  close: $('btn-sabotage-close'),
  alarm: $('alarm'),
  title: $('alarm-title'),
  text: $('alarm-text'),
  time: $('alarm-time'),
  flash: $('radon-flash'),
  button: $('act-sabotage'),
  cd: $('sabotage-cd'),
};

export function bindSabotage() {
  els.close.addEventListener('click', () => openMenu(false));
  els.menu.addEventListener('click', (e) => e.target === els.menu && openMenu(false));
  els.button.addEventListener('click', () => openMenu(true));
}

export function sabotageCooldownMs() {
  return Math.max(0, state.sabotageReadyAt - performance.now());
}

function canSabotage() {
  return phase() === 'playing' && state.role === 'impostor' && !state.sabotage && sabotageCooldownMs() === 0;
}

export function openMenu(open = els.menu.classList.contains('hidden')) {
  const show = open && phase() === 'playing' && state.role === 'impostor';
  els.menu.classList.toggle('hidden', !show);
  if (show) renderMenu();
}

function renderMenu() {
  const ok = canSabotage();
  const buttons = SABOTAGES.map((s) => {
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = s.name;
    btn.disabled = !ok;
    btn.addEventListener('click', () => {
      net.send({ t: 'sabotage', kind: s.id });
      openMenu(false);
    });
    return btn;
  });
  els.options.replaceChildren(...buttons);
  if (state.sabotage) els.hint.textContent = 'Ya hay un sabotaje en marcha.';
  else if (!ok) els.hint.textContent = `Podrás sabotear en ${Math.ceil(sabotageCooldownMs() / 1000)} s.`;
  else els.hint.textContent = 'El radón hace ganar al impostor si no lo cierran a tiempo.';
}

// Llega 'sabotage' del servidor.
export function onSabotage(msg) {
  state.sabotage = msg.kind
    ? { kind: msg.kind, endsAt: msg.ms ? performance.now() + msg.ms : null, fixed: new Set(msg.fixed) }
    : null;
  const info = sabotageById(msg.kind);
  els.alarm.classList.toggle('hidden', !info);
  els.flash.classList.toggle('hidden', msg.kind !== 'radon');
  if (!info) return;
  els.title.textContent = info.alarm;
  els.text.textContent = info.fix;
  if (!els.menu.classList.contains('hidden')) renderMenu();
}

export function onSabotageCooldown(ms) {
  state.sabotageReadyAt = performance.now() + ms;
}

// Puntos que quedan por arreglar del sabotaje activo.
export function pendingFixPoints() {
  const s = state.sabotage;
  if (!s || phase() !== 'playing') return [];
  return FIX_POINTS.filter((p) => p.sabotage === s.kind && !s.fixed.has(p.id));
}

// Cada fotograma: cuenta atrás del radón y estado del botón del impostor.
export function updateSabotage() {
  const s = state.sabotage;
  const left = s?.endsAt ? Math.max(0, Math.ceil((s.endsAt - performance.now()) / 1000)) : null;
  const text = left === null ? '' : `${left} s`;
  if (els.time.textContent !== text) {
    if (text) play('beep'); // pitido cada segundo del radón
    els.time.textContent = text;
  }
  const showButton = phase() === 'playing' && state.role === 'impostor' && amAlive();
  els.button.classList.toggle('hidden', !showButton);
  const cd = Math.ceil(sabotageCooldownMs() / 1000);
  const cdText = cd > 0 ? String(cd) : '';
  if (els.cd.textContent !== cdText) els.cd.textContent = cdText;
}

// Al salir de la partida se quita todo.
export function clearSabotage() {
  onSabotage({ kind: null });
  openMenu(false);
}

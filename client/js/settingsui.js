// Ventana de ajustes de la partida: el anfitrión los cambia, el resto solo los ve.

import { state, isHost } from './state.js';
import * as net from './network.js';
import { SETTINGS, settingText } from '../../shared/settings.js';

const $ = (id) => document.getElementById(id);
const els = {
  root: $('settings'),
  list: $('settings-list'),
  note: $('settings-note'),
  close: $('btn-settings-close'),
  open: $('btn-settings'),
};

export function bindSettings() {
  els.open.addEventListener('click', () => openSettings(true));
  els.close.addEventListener('click', () => openSettings(false));
  els.root.addEventListener('click', (e) => e.target === els.root && openSettings(false));
}

export function openSettings(open) {
  els.root.classList.toggle('hidden', !open);
  if (open) renderSettings();
}

function send(id, value) {
  net.send({ t: 'setting', id, value });
}

// El valor siguiente (o anterior) de un ajuste, o null si ya está en el borde.
function stepValue(s, value, dir) {
  if (s.type === 'bool') return !value;
  if (s.type === 'number') {
    const next = value + dir * s.step;
    return next >= s.min && next <= s.max ? next : null;
  }
  const i = s.options.findIndex(([v]) => v === value) + dir;
  return i >= 0 && i < s.options.length ? s.options[i][0] : null;
}

function arrow(text, s, value, dir) {
  const b = document.createElement('button');
  b.className = 'btn small ghost setting-step';
  b.textContent = text;
  const next = stepValue(s, value, dir);
  b.disabled = next === null;
  b.addEventListener('click', () => send(s.id, next));
  return b;
}

function row(s, value, editable) {
  const li = document.createElement('li');
  const label = document.createElement('span');
  label.textContent = s.label;
  const control = document.createElement('span');
  control.className = 'setting-control';
  const shown = document.createElement('strong');
  shown.textContent = settingText(s.id, value);
  if (!editable) control.append(shown);
  else if (s.type === 'bool') {
    const toggle = document.createElement('button');
    toggle.className = `btn small ${value ? 'secondary' : 'ghost'} setting-toggle`;
    toggle.textContent = settingText(s.id, value);
    toggle.addEventListener('click', () => send(s.id, !value));
    control.append(toggle);
  } else control.append(arrow('−', s, value, -1), shown, arrow('+', s, value, 1));
  li.append(label, control);
  return li;
}

export function renderSettings() {
  if (els.root.classList.contains('hidden') || !state.room) return;
  const editable = isHost() && state.room.phase === 'lobby';
  els.note.textContent = editable ? 'Tú eliges cómo se juega.' : 'Solo el anfitrión puede cambiarlos.';
  els.list.replaceChildren(...SETTINGS.map((s) => row(s, state.room.settings[s.id], editable)));
}

// Resumen corto para la tarjeta de la sala.
export function settingsSummary(settings) {
  const n = settings.impostors;
  return `${n} impostor${n > 1 ? 'es' : ''} · matar cada ${settings.killCooldown} s · reunión de ${settings.meetingTime} s`;
}

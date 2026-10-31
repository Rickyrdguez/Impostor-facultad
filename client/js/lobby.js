// Sala de espera: elegir lenguaje y botón de empezar (solo el anfitrión).

import { state, isHost, phase } from './state.js';
import * as net from './network.js';
import { LANGUAGES } from '../../shared/constants.js';
import { langDot } from './ui.js';
import { renderSettings, settingsSummary, openSettings } from './settingsui.js';

const $ = (id) => document.getElementById(id);
const els = {
  controls: $('lobby-controls'),
  langBtn: $('btn-lang'),
  start: $('btn-start'),
  hint: $('start-hint'),
  summary: $('settings-summary'),
  picker: $('lang-picker'),
  grid: $('lang-grid'),
  close: $('btn-picker-close'),
};

export function bindLobby() {
  els.langBtn.addEventListener('click', () => openPicker(true));
  els.close.addEventListener('click', () => openPicker(false));
  els.picker.addEventListener('click', (e) => e.target === els.picker && openPicker(false));
  els.start.addEventListener('click', () => net.send({ t: 'start' }));
}

export function openPicker(open) {
  els.picker.classList.toggle('hidden', !open);
  if (open) renderPicker();
}

function tile(lang, owner) {
  const btn = document.createElement('button');
  btn.className = 'lang-tile';
  const name = document.createElement('span');
  name.className = 'lang-name';
  name.textContent = lang.name;
  const who = document.createElement('span');
  who.className = 'lang-owner';
  if (owner) who.textContent = owner.id === state.myId ? 'Tú' : owner.name;
  btn.append(langDot(lang.id), name, who);
  if (owner && owner.id === state.myId) btn.classList.add('mine');
  else if (owner) btn.disabled = true;
  else btn.addEventListener('click', () => net.send({ t: 'lang', lang: lang.id }));
  return btn;
}

// Cuadrícula de lenguajes: los cogidos salen en gris con el nombre del jugador.
function renderPicker() {
  const players = state.room?.players || [];
  const tiles = LANGUAGES.map((lang) => tile(lang, players.find((p) => p.lang === lang.id)));
  els.grid.replaceChildren(...tiles);
}

// Se llama con cada mensaje 'room'.
export function renderLobby() {
  const inLobby = phase() === 'lobby';
  els.controls.classList.toggle('hidden', !inLobby);
  if (!inLobby) {
    openSettings(false);
    return openPicker(false);
  }
  if (!els.picker.classList.contains('hidden')) renderPicker();
  renderSettings();
  els.summary.textContent = settingsSummary(state.room.settings);

  const count = state.room.players.length;
  const missing = state.room.minPlayers - count;
  els.start.classList.toggle('hidden', !isHost());
  els.start.disabled = missing > 0;
  if (!isHost()) els.hint.textContent = 'Esperando a que el anfitrión empiece…';
  else if (missing === 1) els.hint.textContent = 'Falta 1 jugador para empezar.';
  else if (missing > 1) els.hint.textContent = `Faltan ${missing} jugadores para empezar.`;
  else els.hint.textContent = `${count} jugadores listos.`;
}

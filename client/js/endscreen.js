// Pantalla final: quién ha ganado y los roles de todos.

import { state, isHost } from './state.js';
import * as net from './network.js';
import { langDot, tag } from './ui.js';

const $ = (id) => document.getElementById(id);
const els = {
  root: $('end'),
  card: document.querySelector('.end-card'),
  title: $('end-title'),
  sub: $('end-sub'),
  list: $('end-list'),
  lobby: $('btn-lobby'),
  wait: $('end-wait'),
};

const REASONS = {
  impostor: 'El impostor ha sido descubierto.',
  tasks: 'Los tripulantes han terminado todas las tareas.',
  kills: 'Ya no quedan suficientes tripulantes para pararle.',
  radon: 'La fuga de radón no se cerró a tiempo.',
};

let result = null;

export function bindEnd() {
  els.lobby.addEventListener('click', () => net.send({ t: 'lobby' }));
}

export function showEnd(msg) {
  result = msg;
  const impostorWins = msg.winner === 'impostor';
  els.card.classList.toggle('impostor-wins', impostorWins);
  els.title.textContent = impostorWins ? '¡Gana el impostor!' : '¡Ganan los tripulantes!';
  els.sub.textContent = REASONS[msg.reason] || '';
  els.root.classList.remove('hidden');
  renderEnd();
}

export function hideEnd() {
  result = null;
  els.root.classList.add('hidden');
}

// Lista de jugadores con su rol; se repinta si cambia la sala (p. ej. el anfitrión).
export function renderEnd() {
  if (!result) return;
  const items = (state.room?.players || []).map((p) => {
    const li = document.createElement('li');
    const name = document.createElement('span');
    name.textContent = p.id === state.myId ? `${p.name} (tú)` : p.name;
    const impostor = result.roles[p.id] === 'impostor';
    li.append(langDot(p.lang), name, tag(impostor ? 'Impostor' : 'Tripulante', impostor ? 'impostor' : ''));
    return li;
  });
  els.list.replaceChildren(...items);
  els.lobby.classList.toggle('hidden', !isHost());
  els.wait.classList.toggle('hidden', isHost());
}

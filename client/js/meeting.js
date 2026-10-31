// Pantalla de reunión: lista de jugadores, votación, chat y resultado.

import { state, amAlive, playerInfo } from './state.js';
import * as net from './network.js';
import { langDot } from './ui.js';
import { languageById } from '../../shared/constants.js';
import { play } from './sound.js';
import { showEjection } from './effects.js';

const EJECT_DELAY_MS = 2200; // se ve el recuento un momento antes de la expulsión

const URGENT_S = 10; // últimos segundos con el temporizador en rojo
const $ = (id) => document.getElementById(id);
const els = {
  root: $('meeting'),
  title: $('meeting-title'),
  sub: $('meeting-sub'),
  time: $('meeting-time'),
  grid: $('vote-grid'),
  status: $('vote-status'),
  bar: $('vote-bar'),
  skip: $('btn-skip'),
  vote: $('btn-vote'),
  chatList: $('chat-list'),
  chatForm: $('chat-form'),
  chatInput: $('chat-input'),
};

// m: estado local de la reunión abierta (o null).
let m = null;

const nameOf = (id) => playerInfo(id)?.name || '¿?';

export function bindMeeting() {
  els.skip.addEventListener('click', () => castVote('skip'));
  els.vote.addEventListener('click', () => m?.selected && castVote(m.selected));
  els.chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = els.chatInput.value.trim();
    if (text) net.send({ t: 'chat', text });
    els.chatInput.value = '';
  });
}

export function isMeetingOpen() {
  return m !== null;
}

function castVote(target) {
  if (!m || m.myVote || m.result || !amAlive()) return;
  m.myVote = target;
  play('vote');
  net.send({ t: 'vote', target });
  render();
}

export function openMeeting(msg) {
  m = {
    endsAt: performance.now() + msg.ms,
    voted: new Set(msg.votedIds || []),
    selected: null,
    myVote: msg.votedIds?.includes(state.myId) ? 'hecho' : null,
    result: null,
  };
  els.title.textContent = msg.body ? '¡Cuerpo encontrado!' : '¡Reunión de emergencia!';
  els.sub.textContent = msg.body
    ? `${nameOf(msg.caller)} ha encontrado a ${nameOf(msg.body)}.`
    : `${nameOf(msg.caller)} ha convocado una reunión.`;
  els.chatList.replaceChildren();
  systemLine(amAlive() ? 'Hablad y votad. Si hay empate, no se expulsa a nadie.' : 'Estás muerto: puedes leer pero no hablar ni votar.');
  els.chatInput.disabled = !amAlive();
  els.chatInput.placeholder = amAlive() ? 'Escribe un mensaje…' : 'Los fantasmas no hablan';
  els.root.classList.remove('hidden');
  render();
}

export function closeMeeting() {
  m = null;
  els.root.classList.add('hidden');
  els.chatInput.blur();
}

function systemLine(text) {
  const li = document.createElement('li');
  li.className = 'system';
  li.textContent = text;
  els.chatList.append(li);
}

export function onChat(msg) {
  if (!m) return;
  const li = document.createElement('li');
  const name = document.createElement('span');
  name.className = 'chat-name';
  const info = playerInfo(msg.from);
  name.textContent = info?.name || '¿?';
  name.style.setProperty('--dot', info ? languageById(info.lang).color : 'transparent');
  const text = document.createElement('span');
  text.textContent = msg.text;
  li.append(name, text);
  els.chatList.append(li);
  els.chatList.scrollTop = els.chatList.scrollHeight;
}

export function onVoted(msg) {
  if (!m) return;
  m.voted.add(msg.id);
  if (msg.id !== state.myId) play('click');
  render();
}

export function onResult(msg) {
  if (!m) return;
  m.result = msg;
  m.endsAt = performance.now() + msg.ms;
  render();
  const ejected = msg.ejected ? playerInfo(msg.ejected) : null;
  const title = resultText(msg).split('. ')[0] + '.';
  const sub = !ejected ? '' : msg.wasImpostor ? 'Era el impostor.' : 'No era el impostor.';
  setTimeout(() => m && m.result === msg && showEjection(title, sub, ejected?.lang), EJECT_DELAY_MS);
}

function resultText(r) {
  if (!r.ejected) {
    const skipped = Object.values(r.votes).filter((v) => v === 'skip').length;
    return skipped ? 'Nadie ha sido expulsado (se saltó la votación).' : 'Nadie ha sido expulsado (empate).';
  }
  return `Habéis expulsado a ${nameOf(r.ejected)}. ${r.wasImpostor ? 'Era el impostor.' : 'No era el impostor.'}`;
}

// Tarjeta de un jugador: clic para seleccionarlo; tras el recuento, quién le votó.
function card(p) {
  const btn = document.createElement('button');
  btn.className = 'vote-card';
  const name = document.createElement('span');
  name.className = 'vote-name';
  name.textContent = p.id === state.myId ? `${p.name} (tú)` : p.name;
  btn.append(langDot(p.lang), name);
  if (!p.alive && !(m.result && m.result.ejected === p.id)) btn.classList.add('dead');
  if (m.voted.has(p.id) && !m.result) {
    const badge = document.createElement('span');
    badge.className = 'voted-badge';
    badge.textContent = 'votó';
    btn.append(badge);
  }
  if (m.result) addVoterDots(btn, p.id);
  if (m.result?.ejected === p.id) btn.classList.add('ejected');
  if (m.selected === p.id) btn.classList.add('selected');
  const canPick = !m.result && !m.myVote && amAlive() && p.alive;
  btn.disabled = !canPick;
  if (canPick) {
    btn.addEventListener('click', () => {
      m.selected = p.id;
      render();
    });
  }
  return btn;
}

function addVoterDots(btn, targetId) {
  const dots = document.createElement('span');
  dots.className = 'voter-dots';
  for (const [voter, target] of Object.entries(m.result.votes)) {
    if (target !== targetId) continue;
    const dot = document.createElement('span');
    dot.style.background = languageById(playerInfo(voter)?.lang).color;
    dots.append(dot);
  }
  btn.append(dots);
}

function render() {
  if (!m) return;
  const players = state.room?.players || [];
  els.grid.replaceChildren(...players.map(card));
  const voting = !m.result && amAlive() && !m.myVote;
  els.bar.classList.toggle('hidden', !voting);
  els.vote.disabled = !m.selected;
  els.vote.textContent = m.selected ? `Votar a ${nameOf(m.selected)}` : 'Votar';
  els.status.classList.toggle('result', Boolean(m.result));
  if (m.result) els.status.textContent = resultText(m.result);
  else if (m.myVote) els.status.textContent = 'Voto enviado. Esperando al resto…';
  else els.status.textContent = amAlive() ? 'Elige a quién expulsar o salta el voto.' : '';
  els.chatForm.classList.toggle('hidden', Boolean(m.result));
}

// Cada fotograma: temporizador.
export function updateMeeting() {
  if (!m) return;
  const s = Math.max(0, Math.ceil((m.endsAt - performance.now()) / 1000));
  const text = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  if (els.time.textContent !== text) {
    if (!m.result && s <= URGENT_S && s > 0) play('tick');
    els.time.textContent = text;
  }
  els.time.parentElement.classList.toggle('urgent', !m.result && s <= URGENT_S);
}

// Si cambia la sala (alguien se desconecta o muere) se repinta la lista.
export function refreshMeeting() {
  render();
}

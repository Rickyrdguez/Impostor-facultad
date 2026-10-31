// HUD de la partida: banner de rol, lista de tareas, progreso y botones de acción.

import { state, amAlive, phase, playerInfo } from './state.js';
import { act, killCooldownMs, killTarget, reportTarget, useTarget } from './actions.js';
import { taskById } from '../../shared/constants.js';

const BANNER_MS = 3600;
const $ = (id) => document.getElementById(id);
const els = {
  banner: $('banner'),
  bannerTitle: $('banner-title'),
  bannerSub: $('banner-sub'),
  taskCard: $('task-card'),
  taskTitle: $('task-title'),
  taskList: $('task-list'),
  progress: $('progress'),
  progressFill: $('progress-fill'),
  ghostNote: $('ghost-note'),
  actions: $('actions'),
  use: $('act-use'),
  kill: $('act-kill'),
  report: $('act-report'),
  killCd: $('kill-cd'),
  useLabel: $('use-label'),
  mapBtn: $('btn-map'),
};

const USE_LABELS = { task: 'Usar', emergency: 'Reunión', vent: 'Trampilla' };
let bannerTimer = null;

// Los botones funcionan con ratón y con el dedo; "usar" hay que mantenerlo.
export function bindHud() {
  const hold = (btn, name) => {
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      act(name, true);
    });
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) {
      btn.addEventListener(ev, () => act(name, false));
    }
  };
  hold(els.use, 'use');
  hold(els.kill, 'kill');
  hold(els.report, 'report');
}

export function showRoleBanner() {
  const impostor = state.role === 'impostor';
  els.banner.classList.toggle('impostor', impostor);
  els.bannerTitle.textContent = impostor ? 'ERES EL IMPOSTOR' : 'Eres tripulante';
  let sub = impostor
    ? 'Elimina a los tripulantes sin que te pillen.'
    : 'Haz tus tareas y descubre quién es el impostor.';
  const allies = state.allies.map((id) => playerInfo(id)?.name).filter(Boolean);
  if (allies.length) sub += ` Tu compañero: ${allies.join(', ')}.`;
  els.bannerSub.textContent = sub;
  // Reinicia la animación aunque el banner ya estuviera visible.
  els.banner.classList.add('hidden');
  void els.banner.offsetWidth;
  els.banner.classList.remove('hidden');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => els.banner.classList.add('hidden'), BANNER_MS);
}

export function renderTasks() {
  const fake = state.role === 'impostor';
  els.taskCard.classList.toggle('fake', fake);
  els.taskTitle.textContent = fake ? 'Tareas falsas (disimula)' : 'Tus tareas';
  const items = state.tasks.map((t) => {
    const info = taskById(t.id);
    const li = document.createElement('li');
    const text = document.createElement('span');
    text.textContent = info.name;
    const where = document.createElement('small');
    where.textContent = info.room;
    text.append(where);
    li.append(text);
    if (t.done || state.fakeDone.has(t.id)) li.classList.add('done');
    return li;
  });
  els.taskList.replaceChildren(...items);
}

export function renderProgress() {
  const { done, total } = state.progress;
  els.progressFill.style.width = `${total ? (done / total) * 100 : 0}%`;
}

// Qué parte del HUD se ve según la fase de la sala.
export function renderHudPhase() {
  const inMatch = phase() === 'playing' || phase() === 'meeting';
  els.taskCard.classList.toggle('hidden', !inMatch || !state.tasks.length);
  els.progress.classList.toggle('hidden', !inMatch);
  els.mapBtn.classList.toggle('hidden', !inMatch);
  els.actions.classList.toggle('hidden', !inMatch);
  els.kill.classList.toggle('hidden', state.role !== 'impostor' || !amAlive());
  els.report.classList.toggle('hidden', !amAlive());
  els.ghostNote.classList.toggle('hidden', !inMatch || amAlive());
  if (!inMatch) els.banner.classList.add('hidden');
}

function setEnabled(btn, on) {
  if (btn.disabled === on) btn.disabled = !on;
}

// Cada fotograma: activa los botones según lo que haya cerca.
export function updateButtons() {
  if (els.actions.classList.contains('hidden')) return;
  const target = useTarget();
  setEnabled(els.use, Boolean(target) || Boolean(state.hold));
  const label = state.vent ? 'Salir' : USE_LABELS[target?.kind] || 'Usar';
  if (els.useLabel.textContent !== label) els.useLabel.textContent = label;
  setEnabled(els.report, Boolean(reportTarget()));
  if (state.role !== 'impostor') return;
  setEnabled(els.kill, Boolean(killTarget()));
  const cd = Math.ceil(killCooldownMs() / 1000);
  const text = cd > 0 ? String(cd) : '';
  if (els.killCd.textContent !== text) els.killCd.textContent = text;
}

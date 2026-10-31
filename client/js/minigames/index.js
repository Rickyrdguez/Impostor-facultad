// Ventana de minijuegos: abre el de cada tarea o sabotaje y avisa al terminar.

import { createContext } from './kit.js';
import { waitingGames } from './waiting.js';
import { draggingGames } from './dragging.js';
import { rubbingGames } from './rubbing.js';
import { pickingGames } from './picking.js';
import { wireGames } from './wires.js';
import { tuningGames } from './tuning.js';
import { keypadGames } from './keypad.js';
import { switchGames } from './switches.js';

// id de tarea o de punto de sabotaje -> función que monta el minijuego.
const GAMES = {
  ...waitingGames,
  ...draggingGames,
  ...rubbingGames,
  ...pickingGames,
  ...wireGames,
  ...tuningGames,
  ...keypadGames,
  ...switchGames,
};

const $ = (id) => document.getElementById(id);
const els = {
  root: $('minigame'),
  title: $('minigame-title'),
  hint: $('minigame-hint'),
  stage: $('minigame-stage'),
  close: $('minigame-close'),
};

let current = null; // { g, onDone }

export function hasMinigame(id) {
  return Boolean(GAMES[id]);
}

export function isMinigameOpen() {
  return current !== null;
}

export function bindMinigames() {
  els.close.addEventListener('click', () => closeMinigame());
  addEventListener('keydown', (e) => e.key === 'Escape' && closeMinigame());
}

// Abre el minijuego `id`; onDone se llama solo si se completa.
export function openMinigame(id, title, onDone) {
  closeMinigame();
  const stage = els.stage.cloneNode(false); // escenario limpio, sin eventos viejos
  stage.className = 'minigame-stage';
  els.stage.replaceWith(stage);
  els.stage = stage;
  els.title.textContent = title;
  els.hint.textContent = '';
  const g = createContext(stage, els.hint, () => {
    closeMinigame();
    onDone();
  });
  current = { g };
  els.root.classList.remove('hidden');
  GAMES[id](g);
}

// Cerrar sin terminar cancela la tarea.
export function closeMinigame() {
  if (!current) return;
  current.g.dispose();
  current = null;
  els.root.classList.add('hidden');
}

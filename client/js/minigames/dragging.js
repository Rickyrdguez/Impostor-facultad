// Minijuegos de arrastrar: sello, papel, entrega de la práctica y ventana.

import { makeDraggable, overlaps, progressBar } from './kit.js';

const UPLOAD_MS = 2500;
const UPLOAD_STEP_MS = 100;

// Coloca un elemento con posición absoluta (px dentro del escenario).
function place(node, left, top) {
  node.style.left = `${left}px`;
  node.style.top = `${top}px`;
  return node;
}

// Sellar la matrícula: arrastra el sello hasta la casilla del impreso.
function matricula(g) {
  g.say('Arrastra el sello hasta la casilla del impreso.');
  const paper = place(g.el('div', 'mg-paper'), 150, 30);
  paper.append(g.el('strong', '', 'IMPRESO DE MATRÍCULA'), g.el('span', 'mg-lines'));
  const slot = g.el('div', 'mg-stamp-slot', 'SELLO');
  paper.append(slot);
  const stamp = place(g.el('div', 'mg-stamp', 'ULL'), 30, 170);
  g.stage.append(paper, stamp);
  makeDraggable(stamp, g.stage, () => {
    if (!overlaps(stamp, slot)) return false;
    stamp.remove();
    slot.classList.add('stamped');
    slot.textContent = 'MATRICULADO';
    g.finish('¡Matrícula sellada!');
    return true;
  });
}

// Reponer el papel: lleva el rollo nuevo al soporte vacío.
function papel(g) {
  g.say('Lleva el rollo nuevo al soporte de la pared.');
  const holder = place(g.el('div', 'mg-holder'), 200, 50);
  const roll = place(g.el('div', 'mg-roll'), 40, 180);
  g.stage.append(holder, roll);
  makeDraggable(roll, g.stage, () => {
    if (!overlaps(roll, holder)) return false;
    place(roll, 214, 58);
    roll.classList.add('placed');
    g.finish('¡Papel repuesto!');
    return true;
  });
}

// Entregar la práctica: arrastra el .zip al aula virtual y espera a que se suba.
function entregar(g) {
  g.say('Arrastra tu práctica a la zona de entrega del aula virtual.');
  const zone = place(g.el('div', 'mg-dropzone', 'Aula virtual · Suelta aquí tu entrega'), 150, 30);
  const file = place(g.el('div', 'mg-file', 'practica.zip'), 30, 170);
  g.stage.append(zone, file);
  makeDraggable(file, g.stage, () => {
    if (!overlaps(file, zone)) return false;
    file.remove();
    zone.textContent = 'practica.zip';
    const setBar = progressBar(g.stage, 'Subiendo… 0 %');
    let elapsed = 0;
    g.interval(() => {
      if (elapsed >= UPLOAD_MS) return;
      elapsed += UPLOAD_STEP_MS;
      const k = elapsed / UPLOAD_MS;
      setBar(k, `Subiendo… ${Math.round(k * 100)} %`);
      if (elapsed >= UPLOAD_MS) g.finish('¡Práctica entregada a tiempo!');
    }, UPLOAD_STEP_MS);
    return true;
  });
}

// Cerrar la ventana: arrastra la hoja corredera hasta el final.
function ventana(g) {
  g.say('Desliza la ventana hacia la izquierda hasta cerrarla.');
  const frame = g.el('div', 'mg-window');
  const pane = g.el('div', 'mg-pane');
  frame.append(pane);
  g.stage.append(frame);
  const closedLeft = 0;
  const openLeft = 150;
  pane.style.left = `${openLeft}px`;
  pane.style.touchAction = 'none';
  let startX = null;
  let startLeft = openLeft;
  pane.addEventListener('pointerdown', (e) => {
    pane.setPointerCapture(e.pointerId);
    startX = e.clientX;
    startLeft = parseFloat(pane.style.left);
  });
  pane.addEventListener('pointermove', (e) => {
    if (startX === null) return;
    const left = Math.max(closedLeft, Math.min(openLeft, startLeft + e.clientX - startX));
    pane.style.left = `${left}px`;
    if (left <= closedLeft + 2) {
      startX = null;
      g.finish('¡Ventana cerrada!');
    }
  });
  pane.addEventListener('pointerup', () => (startX = null));
}

export const draggingGames = { matricula, papel, entregar, ventana };

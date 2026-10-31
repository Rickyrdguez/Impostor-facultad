// Arreglar el proyector: conecta cada cable con la clavija de su color.

import { localPoint, shuffle } from './kit.js';

const COLORS = ['#e53935', '#3f7cac', '#f2c14e', '#5f8f4e'];
const SVG_NS = 'http://www.w3.org/2000/svg';
const ROW_GAP = 44;
const TOP = 130; // debajo de la pantalla del proyector
const LEFT_X = 30;
const RIGHT_X = 290;

function svgLine(color) {
  const line = document.createElementNS(SVG_NS, 'line');
  line.setAttribute('stroke', color);
  line.setAttribute('stroke-width', '10');
  line.setAttribute('stroke-linecap', 'round');
  return line;
}

function setLine(line, a, b) {
  line.setAttribute('x1', a.x);
  line.setAttribute('y1', a.y);
  line.setAttribute('x2', b.x);
  line.setAttribute('y2', b.y);
}

function plug(g, color, x, y, side) {
  const p = g.el('div', `mg-plug ${side}`);
  p.style.background = color;
  p.style.left = `${x - 14}px`;
  p.style.top = `${y - 14}px`;
  return p;
}

function proyector(g) {
  g.say('Conecta cada cable con la clavija del mismo color.');
  const screen = g.el('div', 'mg-projector-screen', 'SIN SEÑAL');
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.classList.add('mg-wires');
  g.stage.append(screen, svg);
  const rights = shuffle(COLORS).map((color, i) => ({ color, x: RIGHT_X, y: TOP + i * ROW_GAP }));
  for (const r of rights) g.stage.append(plug(g, r.color, r.x, r.y, 'right'));
  let connected = 0;

  COLORS.forEach((color, i) => {
    const start = { x: LEFT_X, y: TOP + i * ROW_GAP };
    const node = plug(g, color, start.x, start.y, 'left');
    node.style.touchAction = 'none';
    g.stage.append(node);
    let line = null;
    node.addEventListener('pointerdown', (e) => {
      if (node.classList.contains('done')) return;
      node.setPointerCapture(e.pointerId);
      line = svgLine(color);
      svg.append(line);
      setLine(line, start, start);
    });
    node.addEventListener('pointermove', (e) => {
      if (line) setLine(line, start, localPoint(e, g.stage));
    });
    node.addEventListener('pointerup', (e) => {
      if (!line) return;
      const p = localPoint(e, g.stage);
      const target = rights.find((r) => Math.hypot(r.x - p.x, r.y - p.y) < 28);
      if (target && target.color === color) {
        setLine(line, start, target);
        node.classList.add('done');
        connected++;
        if (connected === COLORS.length) {
          screen.textContent = 'ESIT · Tema 1';
          screen.classList.add('on');
          g.finish('¡Proyector funcionando!');
        }
      } else {
        line.remove();
      }
      line = null;
    });
  });
}

export const wireGames = { proyector };

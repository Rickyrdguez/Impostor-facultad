// Minijuegos de teclado: máquina expendedora y cierre de la fuga de radón.

import { pick } from './kit.js';

const ERROR_MS = 700;

// Teclado genérico: escribe `code` con las teclas `keys`.
function keypad(g, { say, code, keys, label, done, extra }) {
  g.say(say);
  const box = g.el('div', 'mg-keypad');
  if (extra) box.append(extra);
  const screen = g.el('div', 'mg-keypad-screen', label);
  const grid = g.el('div', 'mg-keys');
  let typed = '';
  for (const k of keys) {
    const b = g.el('button', 'mg-key', k);
    b.addEventListener('click', () => {
      if (typed.length >= code.length) return;
      typed += k;
      screen.textContent = typed;
      if (typed.length < code.length) return;
      if (typed === code) return g.finish(done);
      screen.textContent = 'ERROR';
      g.shake(box);
      g.timeout(() => {
        typed = '';
        screen.textContent = label;
      }, ERROR_MS);
    });
    grid.append(b);
  }
  box.append(screen, grid);
  g.stage.append(box);
}

// Sacar algo de la máquina: teclea el código del producto que te piden.
function maquina(g) {
  const products = [
    ['A1', 'Agua'],
    ['A3', 'Zumo'],
    ['B2', 'Chocolatina'],
    ['B4', 'Galletas'],
    ['C1', 'Papas'],
    ['C3', 'Café frío'],
  ];
  const [code, name] = pick(products);
  const menu = g.el('div', 'mg-vending');
  for (const [c, n] of products) menu.append(g.el('span', '', `${c} · ${n}`));
  keypad(g, {
    say: `Saca de la máquina: ${name}.`,
    code,
    keys: ['A', 'B', 'C', '1', '2', '3', '4'],
    label: 'Código',
    done: `¡${name}!`,
    extra: menu,
  });
}

// Cerrar la fuga de radón: escribe el código que aparece en la etiqueta.
function radon(g) {
  const code = String(1000 + Math.floor(Math.random() * 9000));
  const label = g.el('div', 'mg-radon-label', `CÓDIGO DE CIERRE: ${code}`);
  keypad(g, {
    say: 'Escribe el código de cierre de la válvula.',
    code,
    keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    label: '____',
    done: '¡Válvula cerrada!',
    extra: label,
  });
}

export const keypadGames = { maquina, 'radon-lab': radon, 'radon-secre': radon };

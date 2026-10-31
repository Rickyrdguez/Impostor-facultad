// Minijuegos de ajustar: osciloscopio y regar las plantas.

const SVG_NS = 'http://www.w3.org/2000/svg';
const WAVE_W = 300;
const WAVE_H = 140;
const MATCH_TOLERANCE = 4; // diferencia admitida en el deslizador
const MATCH_HOLD_MS = 600; // hay que mantener la onda encajada este tiempo
const WATER_SPEED = 0.006; // subida del agua por fotograma de 16 ms
const WATER_MARGIN = 0.06; // margen alrededor de la línea
const RETRY_MS = 900;

function wavePath(amplitude) {
  let d = '';
  for (let x = 0; x <= WAVE_W; x += 5) {
    const y = WAVE_H / 2 - Math.sin((x / WAVE_W) * Math.PI * 4) * amplitude;
    d += `${x === 0 ? 'M' : 'L'}${x} ${y.toFixed(1)} `;
  }
  return d;
}

function path(className) {
  const p = document.createElementNS(SVG_NS, 'path');
  p.setAttribute('class', className);
  return p;
}

// Calibrar el osciloscopio: mueve el mando hasta que tu onda tape la de referencia.
function osciloscopio(g) {
  g.say('Mueve el mando hasta que la onda verde encaje con la discontinua.');
  const target = 15 + Math.round(Math.random() * 45);
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${WAVE_W} ${WAVE_H}`);
  svg.classList.add('mg-scope');
  const ref = path('mg-wave-ref');
  ref.setAttribute('d', wavePath(target));
  const live = path('mg-wave-live');
  svg.append(ref, live);
  const slider = g.el('input', 'mg-slider');
  Object.assign(slider, { type: 'range', min: '0', max: '65', value: target > 35 ? '5' : '60' });
  g.stage.append(svg, slider);
  let matchedAt = null;
  const update = () => {
    const value = Number(slider.value);
    live.setAttribute('d', wavePath(value));
    const ok = Math.abs(value - target) <= MATCH_TOLERANCE;
    svg.classList.toggle('match', ok);
    if (!ok) matchedAt = null;
    else if (matchedAt === null) matchedAt = performance.now();
  };
  slider.addEventListener('input', update);
  update();
  g.interval(() => {
    if (matchedAt !== null && performance.now() - matchedAt >= MATCH_HOLD_MS) g.finish('¡Calibrado!');
  }, 100);
}

// Regar las plantas: mantén pulsado y suelta justo en la línea, sin pasarte.
function plantas(g) {
  g.say('Mantén pulsado para regar y suelta cuando el agua llegue a la línea.');
  const goal = 0.5 + Math.random() * 0.3;
  const pot = g.el('div', 'mg-pot');
  const water = g.el('div', 'mg-water');
  const line = g.el('div', 'mg-water-line');
  line.style.bottom = `${goal * 100}%`;
  pot.append(water, line, g.el('div', 'mg-plant'));
  const button = g.el('button', 'btn secondary mg-center', 'Regar');
  button.style.touchAction = 'none';
  g.stage.append(pot, button);
  let level = 0;
  let pouring = false;
  let locked = false;
  const show = () => (water.style.height = `${level * 100}%`);
  button.addEventListener('pointerdown', () => {
    if (!locked) pouring = true;
  });
  const stop = () => {
    if (!pouring) return;
    pouring = false;
    if (Math.abs(level - goal) <= WATER_MARGIN) return g.finish('¡Plantas regadas!');
    locked = true;
    g.say(level > goal ? '¡Te has pasado! Prueba otra vez.' : 'Falta agua. Prueba otra vez.');
    g.shake(pot);
    g.timeout(() => {
      level = 0;
      locked = false;
      show();
      g.say('Mantén pulsado para regar y suelta cuando el agua llegue a la línea.');
    }, RETRY_MS);
  };
  button.addEventListener('pointerup', stop);
  button.addEventListener('pointerleave', stop);
  g.interval(() => {
    if (!pouring) return;
    level = Math.min(1, level + WATER_SPEED);
    show();
  }, 16);
}

export const tuningGames = { osciloscopio, plantas };

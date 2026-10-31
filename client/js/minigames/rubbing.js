// Minijuegos de frotar y agitar: mesas, manos y despertar al del sofá.

import { localPoint } from './kit.js';

const RUB_STEP = 0.07; // cuánto se borra una mancha por cada movimiento encima
const SHAKE_MIN_PX = 25; // recorrido mínimo para que cuente una sacudida
const SHAKE_STEP = 0.1; // cuánto se despierta por cada sacudida
const SHAKE_MAX_PX = 45; // hasta dónde se mueve el dormido al agitarlo

// Manchas (o espuma) que desaparecen al pasar el dedo por encima.
function rub(g, { say, spotClass, count, done, surface }) {
  g.say(say);
  const area = g.el('div', `mg-surface ${surface}`);
  area.style.touchAction = 'none';
  g.stage.append(area);
  const spots = Array.from({ length: count }, () => {
    const spot = g.el('div', spotClass);
    spot.style.left = `${15 + Math.random() * 70}%`;
    spot.style.top = `${15 + Math.random() * 65}%`;
    spot.dataset.left = '1';
    area.append(spot);
    return spot;
  });
  let rubbing = false;
  area.addEventListener('pointerdown', (e) => {
    rubbing = true;
    area.setPointerCapture(e.pointerId);
  });
  area.addEventListener('pointerup', () => (rubbing = false));
  area.addEventListener('pointermove', (e) => {
    if (!rubbing) return;
    const p = localPoint(e, area);
    for (const spot of spots) {
      const r = spot.getBoundingClientRect();
      const a = area.getBoundingClientRect();
      const inside = p.x > r.left - a.left && p.x < r.right - a.left && p.y > r.top - a.top && p.y < r.bottom - a.top;
      if (!inside) continue;
      const left = Math.max(0, Number(spot.dataset.left) - RUB_STEP);
      spot.dataset.left = String(left);
      spot.style.opacity = String(left);
    }
    if (spots.every((s) => Number(s.dataset.left) === 0)) g.finish(done);
  });
}

// Despertar al del sofá: primer plano de alguien dormido al que hay que agitar.
function sofa(g) {
  g.say('Se ha quedado dormido en el sofá. Arrástralo a los lados para despertarlo.');
  const scene = g.el('div', 'mg-sofa');
  const sleeper = g.el('div', 'mg-sleeper');
  const face = g.el('div', 'mg-face');
  face.append(g.el('span', 'mg-eye'), g.el('span', 'mg-eye'), g.el('span', 'mg-mouth'));
  const zzz = g.el('div', 'mg-zzz', 'Z z z');
  sleeper.append(g.el('div', 'mg-cap'), face);
  scene.append(g.el('div', 'mg-sofa-back'), sleeper, zzz, g.el('div', 'mg-sofa-seat'));
  const meter = g.el('div', 'mg-awake');
  const fill = g.el('div', 'mg-awake-fill');
  meter.append(fill);
  g.stage.append(scene, meter);

  let awake = 0;
  let lastX = null;
  let dir = 0;
  let travel = 0;
  let offset = 0; // desplazamiento del dormido (px)
  sleeper.style.touchAction = 'none';
  sleeper.addEventListener('pointerdown', (e) => {
    sleeper.setPointerCapture(e.pointerId);
    lastX = e.clientX;
  });
  sleeper.addEventListener('pointerup', () => {
    lastX = null;
    offset = 0;
    sleeper.style.transform = '';
  });
  sleeper.addEventListener('pointermove', (e) => {
    if (lastX === null || awake >= 1) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    offset = Math.max(-SHAKE_MAX_PX, Math.min(SHAKE_MAX_PX, offset + dx));
    sleeper.style.transform = `translateX(${offset}px) rotate(${offset / 4}deg)`;
    const newDir = Math.sign(dx);
    if (newDir && newDir !== dir) {
      if (travel > SHAKE_MIN_PX) awake = Math.min(1, awake + SHAKE_STEP);
      dir = newDir;
      travel = 0;
    }
    travel += Math.abs(dx);
    fill.style.width = `${awake * 100}%`;
    zzz.style.opacity = String(1 - awake);
    if (awake >= 1) {
      face.classList.add('awake');
      g.finish('«¡Ya voy, ya voy!»');
    }
  });
}

export const rubbingGames = {
  sofa,
  mesas: (g) =>
    rub(g, { say: 'Frota las manchas de café hasta dejar la mesa limpia.', spotClass: 'mg-stain', count: 5, done: '¡Mesa limpia!', surface: 'wood' }),
  lavarse: (g) =>
    rub(g, { say: 'Frota para aclarar toda la espuma.', spotClass: 'mg-foam', count: 7, done: '¡Manos limpias!', surface: 'sink' }),
};

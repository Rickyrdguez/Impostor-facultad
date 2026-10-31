// Entrada: teclado (WASD / flechas) y joystick táctil.

const keys = new Set();
const ACTION_KEYS = { KeyE: 'use', KeyQ: 'kill', KeyR: 'report' };
let onAction = () => {};
const stick = { active: false, id: null, ox: 0, oy: 0, dx: 0, dy: 0 };
const STICK_RADIUS = 50; // px de pantalla

const DIRS = {
  KeyW: [0, -1], ArrowUp: [0, -1],
  KeyS: [0, 1], ArrowDown: [0, 1],
  KeyA: [-1, 0], ArrowLeft: [-1, 0],
  KeyD: [1, 0], ArrowRight: [1, 0],
};

function typingInField(e) {
  const tag = e.target && e.target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA';
}

export function initInput(stickEl, knobEl) {
  addEventListener('keydown', (e) => {
    if (typingInField(e)) return;
    keys.add(e.code);
    if (DIRS[e.code]) e.preventDefault();
    if (ACTION_KEYS[e.code] && !e.repeat) onAction(ACTION_KEYS[e.code], true);
  });
  addEventListener('keyup', (e) => {
    keys.delete(e.code);
    if (ACTION_KEYS[e.code]) onAction(ACTION_KEYS[e.code], false);
  });
  addEventListener('blur', () => keys.clear());
  initStick(stickEl, knobEl);
}

// Joystick: aparece donde se toca la mitad izquierda de la pantalla.
function initStick(stickEl, knobEl) {
  const zone = stickEl.parentElement;
  zone.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' || stick.active) return;
    Object.assign(stick, { active: true, id: e.pointerId, ox: e.clientX, oy: e.clientY, dx: 0, dy: 0 });
    stickEl.style.left = `${e.clientX}px`;
    stickEl.style.top = `${e.clientY}px`;
    stickEl.classList.add('on');
    knobEl.style.transform = 'translate(-50%, -50%)';
  });
  zone.addEventListener('pointermove', (e) => {
    if (!stick.active || e.pointerId !== stick.id) return;
    let dx = e.clientX - stick.ox;
    let dy = e.clientY - stick.oy;
    const len = Math.hypot(dx, dy);
    if (len > STICK_RADIUS) {
      dx = (dx / len) * STICK_RADIUS;
      dy = (dy / len) * STICK_RADIUS;
    }
    stick.dx = dx / STICK_RADIUS;
    stick.dy = dy / STICK_RADIUS;
    knobEl.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  });
  const end = (e) => {
    if (e.pointerId !== stick.id) return;
    Object.assign(stick, { active: false, id: null, dx: 0, dy: 0 });
    stickEl.classList.remove('on');
  };
  zone.addEventListener('pointerup', end);
  zone.addEventListener('pointercancel', end);
}

// Dirección de movimiento normalizada (longitud máx. 1).
export function moveVector() {
  let x = 0;
  let y = 0;
  for (const code of keys) {
    if (DIRS[code]) {
      x += DIRS[code][0];
      y += DIRS[code][1];
    }
  }
  if (stick.active) {
    x += stick.dx;
    y += stick.dy;
  }
  const len = Math.hypot(x, y);
  return len > 1 ? { x: x / len, y: y / len } : { x, y };
}

// Registra quién atiende las teclas de acción: fn(nombre, pulsada).
export function setActionHandler(fn) {
  onAction = fn;
}

export function clearKeys() {
  keys.clear();
}

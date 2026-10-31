// Ayudas comunes para los minijuegos: crear elementos, temporizadores y arrastrar.

const FINISH_DELAY_MS = 700; // se enseña el "¡Hecho!" un momento antes de cerrar

export function el(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

export function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export function shuffle(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Contexto que recibe cada minijuego: escenario, instrucciones y temporizadores
// que se limpian solos al cerrar.
export function createContext(stage, hint, onDone) {
  const timers = [];
  let finished = false;
  const g = {
    stage,
    el,
    say: (text) => (hint.textContent = text),
    timeout: (fn, ms) => timers.push(setTimeout(fn, ms)),
    interval: (fn, ms) => timers.push(setInterval(fn, ms)),
    // Marca el minijuego como superado.
    finish(text = '¡Hecho!') {
      if (finished) return;
      finished = true;
      g.say(text);
      stage.classList.add('won');
      g.timeout(onDone, FINISH_DELAY_MS);
    },
    // Pequeña sacudida para avisar de un error.
    shake(node = stage) {
      node.classList.remove('shake');
      void node.offsetWidth;
      node.classList.add('shake');
    },
    dispose() {
      for (const t of timers) {
        clearTimeout(t);
        clearInterval(t);
      }
    },
  };
  return g;
}

// Posición del puntero dentro de un elemento (px).
export function localPoint(e, box) {
  const r = box.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

export function overlaps(a, b) {
  const ra = a.getBoundingClientRect();
  const rb = b.getBoundingClientRect();
  return ra.left < rb.right && ra.right > rb.left && ra.top < rb.bottom && ra.bottom > rb.top;
}

// Hace arrastrable un elemento con posición absoluta dentro del escenario.
// onDrop(item) devuelve true si lo ha aceptado; si no, vuelve a su sitio.
export function makeDraggable(item, stage, onDrop, onMove = () => {}) {
  const home = { left: item.style.left, top: item.style.top };
  let grab = null;
  item.style.touchAction = 'none';
  item.addEventListener('pointerdown', (e) => {
    item.setPointerCapture(e.pointerId);
    const p = localPoint(e, item);
    grab = { dx: p.x, dy: p.y };
    item.classList.add('dragging');
  });
  item.addEventListener('pointermove', (e) => {
    if (!grab) return;
    const p = localPoint(e, stage);
    item.style.left = `${p.x - grab.dx}px`;
    item.style.top = `${p.y - grab.dy}px`;
    onMove(item, p);
  });
  const release = () => {
    if (!grab) return;
    grab = null;
    item.classList.remove('dragging');
    if (!onDrop(item)) Object.assign(item.style, home);
  };
  item.addEventListener('pointerup', release);
  item.addEventListener('pointercancel', release);
}

// Barra de progreso sencilla; devuelve una función para fijar el valor (0 a 1).
export function progressBar(parent, label = '') {
  const wrap = el('div', 'mg-progress');
  const fill = el('div', 'mg-progress-fill');
  const text = el('span', 'mg-progress-text', label);
  wrap.append(fill, text);
  parent.append(wrap);
  return (value, newLabel) => {
    fill.style.width = `${Math.round(Math.min(1, value) * 100)}%`;
    if (newLabel !== undefined) text.textContent = newLabel;
  };
}

// Minijuegos de "pulsa y espera": fotocopiadora, ascensor y router.

import { progressBar } from './kit.js';

const COPY_SHEETS = 12;
const COPY_STEP_MS = 350;
const FLOOR_STEP_MS = 700;
const LED_COUNT = 4;
const LED_STEP_MS = 600;
const UNPLUG_WAIT_MS = 1200;

// Fotocopiar apuntes: pulsas Copiar y van saliendo las hojas.
function fotocopias(g) {
  g.say('Pulsa "Copiar" y espera a que salgan todas las hojas.');
  const copier = g.el('div', 'mg-copier');
  const tray = g.el('div', 'mg-tray');
  const button = g.el('button', 'btn primary mg-center', 'Copiar');
  copier.append(g.el('div', 'mg-copier-lid'), g.el('div', 'mg-copier-screen', 'LISTA'), tray);
  g.stage.append(copier, button);
  const setBar = progressBar(g.stage, `0/${COPY_SHEETS} hojas`);
  button.addEventListener('click', () => {
    button.disabled = true;
    let sheets = 0;
    g.interval(() => {
      if (sheets >= COPY_SHEETS) return;
      sheets++;
      tray.append(g.el('div', 'mg-sheet'));
      setBar(sheets / COPY_SHEETS, `Imprimiendo hoja ${sheets}/${COPY_SHEETS}…`);
      if (sheets === COPY_SHEETS) g.finish('¡Apuntes fotocopiados!');
    }, COPY_STEP_MS);
  });
}

// Llamar al ascensor: botón y cuenta atrás de pisos hasta que se abren las puertas.
function ascensor(g) {
  g.say('Llama al ascensor y espera a que llegue.');
  const lift = g.el('div', 'mg-lift');
  const display = g.el('div', 'mg-lift-display', '4');
  const doors = g.el('div', 'mg-lift-doors');
  doors.append(g.el('div', 'mg-door left'), g.el('div', 'mg-door right'));
  lift.append(display, doors);
  const button = g.el('button', 'mg-lift-button', '▼');
  g.stage.append(lift, button);
  button.addEventListener('click', () => {
    button.disabled = true;
    button.classList.add('lit');
    let floor = 4;
    g.interval(() => {
      if (floor === 0) return;
      floor--;
      display.textContent = floor === 0 ? 'B' : String(floor);
      if (floor === 0) {
        doors.classList.add('open');
        g.finish('¡Ya está aquí!');
      }
    }, FLOOR_STEP_MS);
  });
}

// Router: desenchufar, esperar, enchufar y ver cómo se encienden las luces.
function router(g, text) {
  g.say(text);
  const box = g.el('div', 'mg-router');
  const leds = Array.from({ length: LED_COUNT }, () => g.el('span', 'mg-led on'));
  box.append(...leds);
  const button = g.el('button', 'btn primary mg-center', 'Desenchufar');
  g.stage.append(box, button);
  let step = 'unplug';
  button.addEventListener('click', () => {
    if (step === 'unplug') {
      step = 'wait';
      leds.forEach((l) => l.classList.remove('on'));
      button.disabled = true;
      button.textContent = 'Esperando…';
      g.timeout(() => {
        step = 'plug';
        button.disabled = false;
        button.textContent = 'Enchufar';
      }, UNPLUG_WAIT_MS);
    } else if (step === 'plug') {
      step = 'boot';
      button.disabled = true;
      button.textContent = 'Arrancando…';
      leds.forEach((l, i) => g.timeout(() => l.classList.add('on', 'green'), LED_STEP_MS * (i + 1)));
      g.timeout(() => g.finish('¡Conexión recuperada!'), LED_STEP_MS * (LED_COUNT + 1));
    }
  });
}

export const waitingGames = {
  fotocopias,
  ascensor,
  wifi: (g) => router(g, 'Reinicia el router: desenchúfalo, espera y vuelve a enchufarlo.'),
  red: (g) => router(g, 'Reinicia el armario de red para que vuelva el wifi.'),
};

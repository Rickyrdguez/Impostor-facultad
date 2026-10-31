// Arreglar las luces: sube todos los interruptores del cuadro eléctrico.

const SWITCHES = 5;

function cuadro(g) {
  g.say('Sube todos los interruptores para devolver la luz.');
  const panel = g.el('div', 'mg-panel');
  const bulb = g.el('div', 'mg-bulb');
  const row = g.el('div', 'mg-switches');
  // Al menos uno empieza bajado; el resto al azar.
  const states = Array.from({ length: SWITCHES }, () => Math.random() < 0.5);
  states[Math.floor(Math.random() * SWITCHES)] = false;
  const buttons = states.map((up) => {
    const s = g.el('button', `mg-switch${up ? ' up' : ''}`);
    s.addEventListener('click', () => {
      s.classList.toggle('up');
      if (buttons.every((b) => b.classList.contains('up'))) {
        bulb.classList.add('on');
        g.finish('¡Hágase la luz!');
      }
    });
    return s;
  });
  row.append(...buttons);
  panel.append(bulb, row);
  g.stage.append(panel);
}

export const switchGames = { cuadro };

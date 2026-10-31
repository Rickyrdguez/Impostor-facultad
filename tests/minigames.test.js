// Cada tarea y cada punto de sabotaje tiene su minijuego.

import test from 'node:test';
import assert from 'node:assert/strict';
import { TASKS } from '../shared/constants.js';
import { FIX_POINTS } from '../client/js/places.js';

// Los módulos de minijuegos solo usan el DOM al jugar, así que se pueden importar aquí.
const modules = ['waiting', 'dragging', 'rubbing', 'picking', 'wires', 'tuning', 'keypad', 'switches'];

test('todas las tareas y sabotajes tienen minijuego', async () => {
  const ids = new Set();
  for (const name of modules) {
    const mod = await import(`../client/js/minigames/${name}.js`);
    for (const games of Object.values(mod)) Object.keys(games).forEach((id) => ids.add(id));
  }
  for (const t of TASKS) assert.ok(ids.has(t.id), `falta el minijuego de ${t.id}`);
  for (const p of FIX_POINTS) assert.ok(ids.has(p.id), `falta el minijuego de ${p.id}`);
});

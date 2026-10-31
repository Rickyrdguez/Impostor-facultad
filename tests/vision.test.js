// Línea de visión: las paredes y los muebles altos tapan la vista.

import test from 'node:test';
import assert from 'node:assert/strict';
import { buildVisionGrid, canSee, visibilityPolygon } from '../client/js/vision.js';

buildVisionGrid();

test('se ve a lo largo del gran pasillo', () => {
  assert.equal(canSee(300, 790, 1500, 720), true);
});

test('no se ve a través de la pared de la clase', () => {
  assert.equal(canSee(1300, 800, 1300, 1150), false);
});

test('la columna tapa lo que hay detrás', () => {
  assert.equal(canSee(640, 790, 760, 790), false);
});

test('el polígono se corta en las paredes', () => {
  const poly = visibilityPolygon(550, 1250, 300); // dentro del pasillo estrecho
  let maxX = 0;
  for (let i = 0; i < poly.length; i += 2) {
    if (Math.abs(poly[i + 1] - 1250) < 2) maxX = Math.max(maxX, poly[i]);
  }
  assert.ok(maxX < 700, `la vista llega hasta x=${maxX}`);
});

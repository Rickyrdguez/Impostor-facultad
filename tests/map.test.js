// Comprueba que el mapa es jugable: aparición válida y todas las salas conectadas.

import test from 'node:test';
import assert from 'node:assert/strict';
import { MAP, ROOMS, STATIONS, canStand, spawnPoint } from '../client/js/map.js';
import { PLAYER_RADIUS, TASKS, USE_RANGE } from '../shared/constants.js';
import { MAX_PLAYERS } from '../server/config.js';

const GRID = 10;

// Relleno por inundación desde el punto de aparición.
function reachableCells() {
  const seen = new Set();
  const start = [Math.round(MAP.spawn.x / GRID), Math.round(MAP.spawn.y / GRID)];
  const queue = [start];
  seen.add(start.join());
  while (queue.length) {
    const [cx, cy] = queue.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = [cx + dx, cy + dy];
      const key = n.join();
      if (seen.has(key) || !canStand(n[0] * GRID, n[1] * GRID, PLAYER_RADIUS)) continue;
      seen.add(key);
      queue.push(n);
    }
  }
  return seen;
}

function roomHasCell(room, cells) {
  for (const key of cells) {
    const [x, y] = key.split(',').map((v) => v * GRID);
    if (room.rect) {
      const [rx, ry, w, h] = room.rect;
      if (x >= rx && x <= rx + w && y >= ry && y <= ry + h) return true;
    } else {
      const [cx, cy, r] = room.circle;
      if (Math.hypot(x - cx, y - cy) <= r) return true;
    }
  }
  return false;
}

test('todos los puntos de aparición son válidos', () => {
  for (let i = 0; i < MAX_PLAYERS; i++) {
    const p = spawnPoint(i, MAX_PLAYERS);
    assert.ok(canStand(p.x, p.y, PLAYER_RADIUS), `spawn ${i} bloqueado`);
  }
});

test('todas las salas se pueden alcanzar desde el inicio', () => {
  const cells = reachableCells();
  for (const room of ROOMS) assert.ok(roomHasCell(room, cells), `${room.name} no es alcanzable`);
});

test('no se puede estar dentro de una pared', () => {
  assert.equal(canStand(660, 400, PLAYER_RADIUS), false); // entre secretaría y patio
  assert.equal(canStand(900, 400, PLAYER_RADIUS), false); // patio
  assert.equal(canStand(900, 400, PLAYER_RADIUS, true), true); // fantasma sí
});

test('cada tarea tiene una estación alcanzable', () => {
  const cells = [...reachableCells()].map((k) => k.split(',').map((v) => v * GRID));
  for (const task of TASKS) {
    assert.ok(STATIONS[task.id], `${task.id} no tiene estación`);
    const [sx, sy] = STATIONS[task.id];
    const ok = cells.some(([x, y]) => Math.hypot(x - sx, y - sy) <= USE_RANGE * 0.7);
    assert.ok(ok, `no se llega a la estación de ${task.id}`);
  }
});

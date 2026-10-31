// Salas y movimiento con clientes WebSocket simulados.

import test from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, FakeClient } from './helpers/fake-client.js';

let srv;
test.before(async () => (srv = await startTestServer()));
test.after(() => srv.close());

async function client() {
  const c = new FakeClient(srv.port);
  await c.connect();
  return c;
}

async function createRoom(name = 'Ana') {
  const host = await client();
  const welcome = host.waitFor('welcome');
  host.send({ t: 'create', name });
  return { host, welcome: await welcome };
}

test('/health responde 200', async () => {
  const res = await fetch(`http://127.0.0.1:${srv.port}/health`);
  assert.equal(res.status, 200);
});

test('sirve el cliente y shared/, pero no archivos de fuera', async () => {
  const ok = await fetch(`http://127.0.0.1:${srv.port}/shared/constants.js`);
  assert.equal(ok.status, 200);
  const bad = await fetch(`http://127.0.0.1:${srv.port}/..%2fpackage.json`);
  assert.equal(bad.status, 404);
});

test('crear sala y unirse: ambos se ven', async () => {
  const { host, welcome } = await createRoom();
  assert.match(welcome.code, /^[A-Z]{4}$/);
  const guest = await client();
  const room = guest.waitFor((m) => m.t === 'room' && m.players.length === 2);
  guest.send({ t: 'join', code: welcome.code.toLowerCase(), name: 'Beto' });
  const info = await room;
  assert.equal(info.hostId, welcome.id);
  assert.notEqual(info.players[0].lang, info.players[1].lang);
  const snap = await host.waitFor((m) => m.t === 's' && m.p.length === 2);
  assert.equal(snap.p.length, 2);
  host.close();
  guest.close();
});

test('código inexistente da error', async () => {
  const c = await client();
  const err = c.waitFor('error');
  c.send({ t: 'join', code: 'ZZZZ', name: 'X' });
  assert.match((await err).text, /código/);
  c.close();
});

test('los nombres se limpian y recortan a 12', async () => {
  const { host } = await createRoom('  <b>Nombre   muy largo de verdad');
  const info = await host.waitFor('room');
  assert.equal(info.players[0].name, 'bNombre muy');
  host.close();
});

test('movimiento válido se acepta y atravesar paredes no', async () => {
  const { host, welcome } = await createRoom();
  const snap = await host.waitFor('s');
  const [, x, y] = snap.p.find(([id]) => id === welcome.id);
  await new Promise((r) => setTimeout(r, 100));
  host.send({ t: 'move', x: x + 5, y });
  const moved = await host.waitFor((m) => m.t === 's' && m.p[0][1] === Math.round(x + 5));
  assert.ok(moved);
  // Teletransporte a la cafetería: el servidor corrige la posición.
  host.send({ t: 'move', x: 900, y: 1500 });
  const pos = await host.waitFor('pos');
  assert.equal(Math.round(pos.x), Math.round(x + 5));
  host.close();
});

test('mensajes mal formados se ignoran sin romper nada', async () => {
  const c = await client();
  c.send('esto no es json');
  c.send({ t: 'move', x: 'a', y: null });
  c.send({ t: '__proto__' });
  const welcome = c.waitFor('welcome');
  c.send({ t: 'create', name: 'Ok' });
  assert.ok(await welcome);
  c.close();
});

test('si el anfitrión se va, pasa a otro jugador', async () => {
  const { host, welcome } = await createRoom();
  const guest = await client();
  const joined = guest.waitFor('welcome');
  guest.send({ t: 'join', code: welcome.code, name: 'Beto' });
  const guestId = (await joined).id;
  const after = guest.waitFor((m) => m.t === 'room' && m.players.length === 1);
  host.close();
  assert.equal((await after).hostId, guestId);
  guest.close();
});

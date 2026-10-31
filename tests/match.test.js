// Partida por WebSocket con tres clientes simulados.

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

// Sala con tres jugadores; devuelve los clientes y sus ids.
async function roomOfThree() {
  const host = await client();
  const hw = host.waitFor('welcome');
  host.send({ t: 'create', name: 'Ana' });
  const { code, id } = await hw;
  const players = [{ c: host, id, code }];
  for (const name of ['Beto', 'Carla']) {
    const c = await client();
    const w = c.waitFor('welcome');
    c.send({ t: 'join', code, name });
    players.push({ c, id: (await w).id });
  }
  await host.waitFor((m) => m.t === 'room' && m.players.length === 3);
  return players;
}

test('elegir lenguaje repetido da error y el libre se acepta', async () => {
  const [a, b, c] = await roomOfThree();
  a.c.send({ t: 'lang', lang: 'kt' });
  await b.c.waitFor((m) => m.t === 'room' && m.players.some((p) => p.id === a.id && p.lang === 'kt'));
  const err = b.c.waitFor('error');
  b.c.send({ t: 'lang', lang: 'kt' });
  assert.match((await err).text, /cogido/);
  [a, b, c].forEach((p) => p.c.close());
});

test('empezar: cada uno recibe su rol en privado y hay un impostor', async () => {
  const players = await roomOfThree();
  const roles = players.map((p) => p.c.waitFor('role'));
  const tasks = players.map((p) => p.c.waitFor('tasks'));
  players[0].c.send({ t: 'start' });
  const got = await Promise.all(roles);
  assert.equal(got.filter((r) => r.role === 'impostor').length, 1);
  for (const t of await Promise.all(tasks)) assert.equal(t.list.length, 3);
  const room = await players[1].c.waitFor((m) => m.t === 'room' && m.phase === 'playing');
  assert.ok(room.players.every((p) => !('role' in p)), 'los roles no se filtran a todos');
  players.forEach((p) => p.c.close());
});

test('si alguien sale y quedan pocos, se vuelve a la sala', async () => {
  const players = await roomOfThree();
  players[0].c.send({ t: 'start' });
  await players[1].c.waitFor((m) => m.t === 'room' && m.phase === 'playing');
  const notice = players[1].c.waitFor('notice');
  players[2].c.send({ t: 'leave' });
  assert.ok(await notice);
  await players[1].c.waitFor((m) => m.t === 'room' && m.phase === 'lobby');
  players.forEach((p) => p.c.close());
});

test('no se puede unir nadie con la partida empezada', async () => {
  const players = await roomOfThree();
  const { code } = players[0];
  players[0].c.send({ t: 'start' });
  await players[0].c.waitFor((m) => m.t === 'room' && m.phase === 'playing');
  const late = await client();
  const err = late.waitFor('error');
  late.send({ t: 'join', code, name: 'Tarde' });
  assert.match((await err).text, /empezado/);
  [...players.map((p) => p.c), late].forEach((c) => c.close());
});

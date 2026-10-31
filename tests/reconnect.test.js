// Caídas de conexión: el jugador conserva su sitio 30 s y puede volver con su token.

import test from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, FakeClient } from './helpers/fake-client.js';
import { tickAll } from '../server/rooms.js';
import { RECONNECT_GRACE_MS } from '../server/config.js';

let srv;
test.before(async () => (srv = await startTestServer()));
test.after(() => srv.close());

async function client() {
  const c = new FakeClient(srv.port);
  await c.connect();
  return c;
}

// Sala con anfitrión y un invitado.
async function roomWithTwo() {
  const host = await client();
  const hw = host.waitFor('welcome');
  host.send({ t: 'create', name: 'Ana' });
  const hostWelcome = await hw;
  const guest = await client();
  const gw = guest.waitFor('welcome');
  guest.send({ t: 'join', code: hostWelcome.code, name: 'Beto' });
  return { host, guest, hostWelcome, guestWelcome: await gw };
}

test('una caída deja al jugador como desconectado, sin sacarlo', async () => {
  const { host, guest, guestWelcome } = await roomWithTwo();
  const update = host.waitFor(
    (m) => m.t === 'room' && m.players.some((p) => p.id === guestWelcome.id && !p.connected),
  );
  guest.ws.terminate();
  const info = await update;
  assert.equal(info.players.length, 2);
  host.close();
});

test('volver con el token recupera el mismo personaje y la posición', async () => {
  const { host, guest, guestWelcome } = await roomWithTwo();
  guest.ws.terminate();
  await host.waitFor((m) => m.t === 'room' && m.players.some((p) => !p.connected));
  host.messages.length = 0; // olvida los mensajes anteriores a la caída

  const back = await client();
  const welcome = back.waitFor('welcome');
  back.send({ t: 'resume', token: guestWelcome.token });
  const w = await welcome;
  assert.equal(w.id, guestWelcome.id);
  assert.equal(w.resumed, true);
  const info = await host.waitFor((m) => m.t === 'room' && m.players.every((p) => p.connected));
  assert.equal(info.players.length, 2);
  const snap = await back.waitFor((m) => m.t === 's' && m.p.some(([id]) => id === w.id));
  assert.ok(snap);
  host.close();
  back.close();
});

test('un token desconocido no entra', async () => {
  const c = await client();
  const failed = c.waitFor('resume-failed');
  c.send({ t: 'resume', token: 'no-existe' });
  assert.ok(await failed);
  c.close();
});

test('pasados 30 s sin volver, se le saca y el anfitrión cambia', async () => {
  const { host, guest, guestWelcome } = await roomWithTwo();
  host.ws.terminate();
  await guest.waitFor((m) => m.t === 'room' && m.players.some((p) => !p.connected));
  const after = guest.waitFor((m) => m.t === 'room' && m.players.length === 1);
  tickAll(Date.now() + RECONNECT_GRACE_MS + 1000);
  const info = await after;
  assert.equal(info.hostId, guestWelcome.id);
  guest.close();
});

test('una conexión nueva con el token sustituye a la vieja', async () => {
  const { host, guest, guestWelcome } = await roomWithTwo();
  const second = await client();
  const w = second.waitFor('welcome');
  second.send({ t: 'resume', token: guestWelcome.token });
  assert.equal((await w).id, guestWelcome.id);
  await new Promise((r) => setTimeout(r, 100));
  assert.equal(guest.ws.readyState, guest.ws.CLOSED);
  host.close();
  second.close();
});

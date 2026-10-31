// Ajustes de la sala: quién los cambia, qué valores se aceptan y que se aplican.

import test from 'node:test';
import assert from 'node:assert/strict';
import * as game from '../server/game.js';
import * as lobby from '../server/lobby.js';
import * as actions from '../server/actions.js';
import * as meeting from '../server/meeting.js';
import { changeSetting } from '../server/settings.js';
import { validSetting } from '../shared/settings.js';

const T0 = 1_000_000;

function lobbyRoom(n) {
  const room = game.createRoom('TEST');
  for (let i = 0; i < n; i++) game.addPlayer(room, `p${i}`, `J${i}`, T0);
  return room;
}

test('solo el anfitrión cambia los ajustes y solo con valores válidos', () => {
  const room = lobbyRoom(3);
  assert.deepEqual(changeSetting(room, 'p1', { id: 'killCooldown', value: 30 }), []);
  assert.equal(room.settings.killCooldown, 15);
  changeSetting(room, 'p0', { id: 'killCooldown', value: 30 });
  assert.equal(room.settings.killCooldown, 30);
  for (const bad of [7, 31, '30', 1000, null]) {
    changeSetting(room, 'p0', { id: 'killCooldown', value: bad });
    assert.equal(room.settings.killCooldown, 30, `aceptó ${bad}`);
  }
  changeSetting(room, 'p0', { id: 'noExiste', value: 1 });
  assert.equal(room.settings.noExiste, undefined);
  assert.equal(validSetting('confirmEjects', 'sí'), null);
  assert.equal(validSetting('speed', 1.25), 1.25);
});

test('no se cambian los ajustes con la partida empezada', () => {
  const room = lobbyRoom(3);
  lobby.startGame(room, 'p0', {}, T0);
  changeSetting(room, 'p0', { id: 'tasks', value: 5 });
  assert.equal(room.settings.tasks, 3);
});

test('número de impostores y de tareas', () => {
  const room = lobbyRoom(7);
  changeSetting(room, 'p0', { id: 'impostors', value: 2 });
  changeSetting(room, 'p0', { id: 'tasks', value: 5 });
  lobby.startGame(room, 'p0', {}, T0);
  const players = Object.values(room.players);
  assert.equal(players.filter((p) => p.role === 'impostor').length, 2);
  assert.ok(players.filter((p) => p.role === 'crew').every((p) => p.tasks.length === 5));

  // Con 3 jugadores nunca puede haber 2 impostores.
  const small = lobbyRoom(3);
  changeSetting(small, 'p0', { id: 'impostors', value: 3 });
  lobby.startGame(small, 'p0', {}, T0);
  assert.equal(Object.values(small.players).filter((p) => p.role === 'impostor').length, 1);
});

test('espera y distancia para matar', () => {
  const room = lobbyRoom(4);
  changeSetting(room, 'p0', { id: 'killCooldown', value: 30 });
  changeSetting(room, 'p0', { id: 'killDistance', value: 120 });
  lobby.startGame(room, 'p0', {}, T0);
  const all = Object.values(room.players);
  const impostor = all.find((p) => p.role === 'impostor');
  const crew = all.filter((p) => p.role === 'crew');
  Object.assign(impostor, { x: crew[0].x + 110, y: crew[0].y });
  for (const c of crew.slice(1)) Object.assign(c, { x: crew[0].x + 600, y: crew[0].y });
  assert.deepEqual(actions.kill(room, impostor.id, {}, T0 + 20000), []); // aún esperando
  actions.kill(room, impostor.id, {}, T0 + 30000);
  assert.equal(crew[0].alive, false, 'a 110 llega con distancia larga');
});

test('expulsión sin confirmar y votos anónimos', () => {
  const room = lobbyRoom(4);
  changeSetting(room, 'p0', { id: 'confirmEjects', value: false });
  changeSetting(room, 'p0', { id: 'anonymousVotes', value: true });
  changeSetting(room, 'p0', { id: 'meetingTime', value: 60 });
  lobby.startGame(room, 'p0', {}, T0);
  const out = meeting.startMeeting(room, 'p0', null, T0);
  assert.equal(out.find((o) => o.msg.t === 'meeting').msg.ms, 60000);
  let result = null;
  for (const id of ['p0', 'p1', 'p2', 'p3']) {
    const res = meeting.vote(room, id, { target: 'p1' }, T0).find((o) => o.msg.t === 'result');
    if (res) result = res.msg;
  }
  assert.equal(result.ejected, 'p1');
  assert.equal(result.wasImpostor, null, 'no se dice si era el impostor');
  assert.ok(Object.keys(result.votes).every((k) => k.startsWith('anon')), 'no se sabe quién votó');
});

test('reuniones de emergencia por jugador', async () => {
  const { EMERGENCY } = await import('../client/js/places.js');
  const room = lobbyRoom(4);
  changeSetting(room, 'p0', { id: 'emergencyMeetings', value: 0 });
  changeSetting(room, 'p0', { id: 'emergencyCooldown', value: 0 });
  lobby.startGame(room, 'p0', {}, T0);
  const p = room.players.p0;
  Object.assign(p, { x: EMERGENCY.x + 50, y: EMERGENCY.y });
  const out = actions.emergency(room, 'p0', {}, T0);
  assert.match(out[0].msg.text, /no te quedan/);
  assert.equal(room.phase, 'playing');
});

// Reglas de la partida probadas directamente sobre la lógica pura (sin red).

import test from 'node:test';
import assert from 'node:assert/strict';
import * as game from '../server/game.js';
import * as lobby from '../server/lobby.js';
import * as actions from '../server/actions.js';
import * as meeting from '../server/meeting.js';
import { STATIONS } from '../client/js/places.js';
import { KILL_COOLDOWN_MS, MEETING_MS, RESULT_MS, TASK_MIN_MS } from '../server/config.js';

const T0 = 1_000_000;

// Sala con n jugadores (p0 es el anfitrión) ya empezada.
function startedRoom(n = 4) {
  const room = game.createRoom('TEST');
  for (let i = 0; i < n; i++) game.addPlayer(room, `p${i}`, `Jugador${i}`, T0);
  lobby.startGame(room, 'p0', {}, T0);
  const all = Object.values(room.players);
  return { room, impostor: all.find((p) => p.role === 'impostor'), crew: all.filter((p) => p.role === 'crew') };
}

const msgs = (out, type) => out.filter((o) => o.msg.t === type);

test('elegir lenguaje: no se puede repetir', () => {
  const room = game.createRoom('TEST');
  game.addPlayer(room, 'a', 'A', T0);
  game.addPlayer(room, 'b', 'B', T0);
  lobby.chooseLanguage(room, 'a', { lang: 'rust' });
  assert.equal(room.players.a.lang, 'rust');
  const out = lobby.chooseLanguage(room, 'b', { lang: 'rust' });
  assert.equal(msgs(out, 'error').length, 1);
  assert.notEqual(room.players.b.lang, 'rust');
});

test('solo el anfitrión empieza y con jugadores suficientes', () => {
  const room = game.createRoom('TEST');
  game.addPlayer(room, 'a', 'A', T0);
  game.addPlayer(room, 'b', 'B', T0);
  assert.equal(msgs(lobby.startGame(room, 'a', {}, T0), 'error').length, 1);
  game.addPlayer(room, 'c', 'C', T0);
  assert.deepEqual(lobby.startGame(room, 'b', {}, T0), []);
  const out = lobby.startGame(room, 'a', {}, T0);
  assert.equal(room.phase, 'playing');
  assert.equal(msgs(out, 'role').length, 3);
  const roles = Object.values(room.players).map((p) => p.role);
  assert.equal(roles.filter((r) => r === 'impostor').length, 1);
});

test('matar: hace falta estar cerca y esperar el enfriamiento', () => {
  const { room, impostor, crew } = startedRoom();
  const victim = crew[0];
  Object.assign(impostor, { x: victim.x + 30, y: victim.y });
  for (const c of crew.slice(1)) Object.assign(c, { x: victim.x + 400, y: victim.y });
  assert.deepEqual(actions.kill(room, impostor.id, {}, T0 + 1000), []); // aún en enfriamiento
  const out = actions.kill(room, impostor.id, {}, T0 + KILL_COOLDOWN_MS);
  assert.equal(victim.alive, false);
  assert.equal(room.bodies.length, 1);
  assert.equal(msgs(out, 'killed')[0].to, victim.id);
  assert.deepEqual(actions.kill(room, impostor.id, {}, T0 + KILL_COOLDOWN_MS + 10), []);
});

test('un tripulante no puede matar', () => {
  const { room, crew } = startedRoom();
  Object.assign(crew[0], { x: crew[1].x + 10, y: crew[1].y });
  assert.deepEqual(actions.kill(room, crew[0].id, {}, T0 + KILL_COOLDOWN_MS), []);
  assert.equal(crew[1].alive, true);
});

test('las tareas se validan por distancia y tiempo, y completarlas gana', () => {
  const { room, crew } = startedRoom(3);
  for (const p of crew) {
    for (const task of p.tasks) {
      const [x, y] = STATIONS[task.id];
      Object.assign(p, { x: x + 2000, y });
      actions.taskStart(room, p.id, {}, T0);
      assert.equal(p.taskStart, null, 'lejos de la estación no empieza');
      Object.assign(p, { x, y });
      actions.taskStart(room, p.id, {}, T0);
      actions.taskDone(room, p.id, {}, T0 + 100);
      assert.equal(task.done, false, 'demasiado rápido no cuenta');
      actions.taskStart(room, p.id, {}, T0);
      actions.taskDone(room, p.id, {}, T0 + TASK_MIN_MS);
      assert.equal(task.done, true);
    }
  }
  assert.equal(room.phase, 'ended');
  assert.equal(room.result.winner, 'crew');
  assert.equal(room.result.reason, 'tasks');
});

test('reportar, votar y expulsar al impostor: ganan los tripulantes', () => {
  const { room, impostor, crew } = startedRoom(4);
  Object.assign(impostor, { x: crew[0].x + 20, y: crew[0].y });
  for (const c of crew.slice(1)) Object.assign(c, { x: crew[0].x + 400, y: crew[0].y });
  actions.kill(room, impostor.id, {}, T0 + KILL_COOLDOWN_MS);
  const reporter = crew[1];
  Object.assign(reporter, { x: crew[0].x + 50, y: crew[0].y });
  actions.report(room, reporter.id, {}, T0 + KILL_COOLDOWN_MS);
  assert.equal(room.phase, 'meeting');
  assert.deepEqual(meeting.vote(room, crew[0].id, { target: impostor.id }, T0), []); // muerto no vota

  const now = T0 + KILL_COOLDOWN_MS + 1000;
  meeting.chat(room, reporter.id, { text: 'fue el impostor' }, now);
  meeting.vote(room, crew[1].id, { target: impostor.id }, now);
  meeting.vote(room, crew[2].id, { target: impostor.id }, now);
  const out = meeting.vote(room, impostor.id, { target: 'skip' }, now);
  const result = msgs(out, 'result')[0].msg;
  assert.equal(result.ejected, impostor.id);
  assert.equal(result.wasImpostor, true);
  game.tick(room, now + RESULT_MS);
  assert.equal(room.phase, 'ended');
  assert.equal(room.result.winner, 'crew');
});

test('empate en la votación: nadie es expulsado y se vuelve a jugar', () => {
  const { room, crew } = startedRoom(4);
  meeting.startMeeting(room, crew[0].id, null, T0);
  meeting.vote(room, crew[0].id, { target: crew[1].id }, T0);
  meeting.vote(room, crew[1].id, { target: crew[0].id }, T0);
  game.tick(room, T0 + MEETING_MS);
  assert.equal(room.meeting.result.ejected, null);
  const out = game.tick(room, T0 + MEETING_MS + RESULT_MS);
  assert.equal(room.phase, 'playing');
  assert.ok(msgs(out, 'pos').length >= 4, 'todos vuelven al inicio');
});

test('gana el impostor cuando quedan tantos impostores como tripulantes', () => {
  const { room, impostor, crew } = startedRoom(3);
  Object.assign(impostor, { x: crew[0].x + 20, y: crew[0].y });
  Object.assign(crew[1], { x: crew[0].x + 400, y: crew[0].y });
  actions.kill(room, impostor.id, {}, T0 + KILL_COOLDOWN_MS);
  assert.equal(room.phase, 'ended');
  assert.equal(room.result.winner, 'impostor');
});

test('si se va el impostor ganan los tripulantes; con pocos se vuelve a la sala', () => {
  const a = startedRoom(4);
  game.removePlayer(a.room, a.impostor.id, T0);
  assert.equal(a.room.result.winner, 'crew');

  const b = startedRoom(3);
  game.removePlayer(b.room, b.crew[0].id, T0);
  assert.equal(b.room.phase, 'lobby');
  assert.ok(Object.values(b.room.players).every((p) => p.role === null && p.alive));
});

test('al reconectar se recupera el rol y las tareas', () => {
  const { room, impostor } = startedRoom(3);
  const out = game.rejoinState(room, impostor.id, T0);
  assert.equal(msgs(out, 'role')[0].msg.role, 'impostor');
  assert.equal(msgs(out, 'tasks')[0].msg.list.length, 3);
});

test('los vivos no ven a los fantasmas en las posiciones', () => {
  const { room, impostor, crew } = startedRoom(4);
  crew[0].alive = false;
  const out = game.tick(room, T0);
  const forAlive = out.find((o) => o.to === impostor.id).msg.p.map(([id]) => id);
  const forGhost = out.find((o) => o.to === crew[0].id).msg.p.map(([id]) => id);
  assert.ok(!forAlive.includes(crew[0].id));
  assert.ok(forGhost.includes(crew[0].id));
});

test('botón de emergencia: una vez por jugador y con enfriamiento', async () => {
  const { EMERGENCY } = await import('../client/js/places.js');
  const { EMERGENCY_COOLDOWN_MS } = await import('../server/config.js');
  const { room, crew } = startedRoom(4);
  const p = crew[0];
  Object.assign(p, { x: EMERGENCY.x + 50, y: EMERGENCY.y });
  const early = actions.emergency(room, p.id, {}, T0 + 1000);
  assert.equal(msgs(early, 'notice').length, 1);
  assert.equal(room.phase, 'playing');
  actions.emergency(room, p.id, {}, T0 + EMERGENCY_COOLDOWN_MS);
  assert.equal(room.phase, 'meeting');
  assert.equal(room.meeting.body, null);
  // Tras la reunión ya no puede volver a pulsarlo
  game.tick(room, T0 + EMERGENCY_COOLDOWN_MS + MEETING_MS);
  game.tick(room, T0 + EMERGENCY_COOLDOWN_MS + MEETING_MS + RESULT_MS);
  assert.equal(room.phase, 'playing');
  Object.assign(p, { x: EMERGENCY.x + 50, y: EMERGENCY.y });
  const again = actions.emergency(room, p.id, {}, T0 + 10 * EMERGENCY_COOLDOWN_MS);
  assert.match(msgs(again, 'notice')[0].msg.text, /Ya no te quedan/);
});

test('trampillas: solo el impostor, invisible dentro y salto a las conectadas', async () => {
  const vents = await import('../server/vents.js');
  const { VENTS } = await import('../client/js/places.js');
  const { room, impostor, crew } = startedRoom(4);
  const banos = VENTS.find((v) => v.id === 'banos');
  Object.assign(crew[0], { x: banos.x, y: banos.y });
  assert.deepEqual(vents.toggleVent(room, crew[0].id, {}, T0), []);
  Object.assign(impostor, { x: banos.x + 10, y: banos.y });
  vents.toggleVent(room, impostor.id, {}, T0);
  assert.equal(impostor.vent, 'banos');
  const snap = game.tick(room, T0).find((o) => o.to === crew[1].id).msg.p.map(([id]) => id);
  assert.ok(!snap.includes(impostor.id), 'dentro de la trampilla no se le ve');
  assert.deepEqual(vents.moveVent(room, impostor.id, { to: 'terraza' }, T0), []); // otra red
  vents.moveVent(room, impostor.id, { to: 'laboratorio' }, T0);
  assert.equal(impostor.vent, 'laboratorio');
  assert.deepEqual(game.handleMove(room, impostor.id, { x: impostor.x + 5, y: impostor.y }, T0 + 50), []);
  vents.toggleVent(room, impostor.id, {}, T0 + 100);
  assert.equal(impostor.vent, null);
  assert.equal(Math.round(impostor.y), VENTS.find((v) => v.id === 'laboratorio').y);
});

test('sabotaje de luces: solo el impostor, con enfriamiento, y se arregla en el cuadro', async () => {
  const sab = await import('../server/sabotage.js');
  const { FIX_POINTS } = await import('../client/js/places.js');
  const { SABOTAGE_COOLDOWN_MS } = await import('../server/config.js');
  const { room, impostor, crew } = startedRoom(4);
  const now = T0 + SABOTAGE_COOLDOWN_MS;
  assert.deepEqual(sab.sabotage(room, crew[0].id, { kind: 'luces' }, now), []);
  assert.deepEqual(sab.sabotage(room, impostor.id, { kind: 'luces' }, T0 + 1000), []); // enfriamiento
  sab.sabotage(room, impostor.id, { kind: 'luces' }, now);
  assert.equal(room.sabotage.kind, 'luces');
  assert.deepEqual(sab.sabotage(room, impostor.id, { kind: 'wifi' }, now), []); // ya hay uno
  const cuadro = FIX_POINTS.find((f) => f.id === 'cuadro');
  Object.assign(crew[0], { x: cuadro.x + 300, y: cuadro.y });
  sab.fix(room, crew[0].id, { point: 'cuadro' }, now);
  assert.ok(room.sabotage, 'lejos no se arregla');
  Object.assign(crew[0], { x: cuadro.x + 20, y: cuadro.y });
  sab.fix(room, crew[0].id, { point: 'cuadro' }, now);
  assert.equal(room.sabotage, null);
});

test('radón: hacen falta los dos puntos; si se acaba el tiempo gana el impostor', async () => {
  const sab = await import('../server/sabotage.js');
  const { FIX_POINTS } = await import('../client/js/places.js');
  const { SABOTAGE_COOLDOWN_MS, RADON_MS } = await import('../server/config.js');
  const a = startedRoom(4);
  const now = T0 + SABOTAGE_COOLDOWN_MS;
  sab.sabotage(a.room, a.impostor.id, { kind: 'radon' }, now);
  const [lab, secre] = FIX_POINTS.filter((f) => f.sabotage === 'radon');
  Object.assign(a.crew[0], { x: lab.x, y: lab.y + 20 });
  sab.fix(a.room, a.crew[0].id, { point: lab.id }, now);
  assert.ok(a.room.sabotage, 'con un punto no basta');
  Object.assign(a.crew[1], { x: secre.x - 20, y: secre.y + 20 });
  sab.fix(a.room, a.crew[1].id, { point: secre.id }, now);
  assert.equal(a.room.sabotage, null);

  const b = startedRoom(4);
  sab.sabotage(b.room, b.impostor.id, { kind: 'radon' }, now);
  game.tick(b.room, now + RADON_MS);
  assert.equal(b.room.phase, 'ended');
  assert.equal(b.room.result.winner, 'impostor');
  assert.equal(b.room.result.reason, 'radon');
});

test('no se puede pulsar el botón de emergencia durante un sabotaje', async () => {
  const sab = await import('../server/sabotage.js');
  const { EMERGENCY } = await import('../client/js/places.js');
  const { SABOTAGE_COOLDOWN_MS } = await import('../server/config.js');
  const { room, impostor, crew } = startedRoom(4);
  const now = T0 + SABOTAGE_COOLDOWN_MS;
  sab.sabotage(room, impostor.id, { kind: 'wifi' }, now);
  Object.assign(crew[0], { x: EMERGENCY.x + 50, y: EMERGENCY.y });
  const out = actions.emergency(room, crew[0].id, {}, now);
  assert.match(msgs(out, 'notice')[0].msg.text, /sabotaje/);
  assert.equal(room.phase, 'playing');
});

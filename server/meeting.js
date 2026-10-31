// Reuniones: chat, votación con temporizador y expulsión. Lógica pura.

import { CHAT_COOLDOWN_MS, CHAT_MAX_LENGTH, RESULT_MS } from './config.js';
import { emergencyCooldownMs, killCooldownMs, meetingMs } from './settings.js';
import { isImpostor, playerList, roomInfo, toAll } from './info.js';
import { sendAllToSpawn } from './lobby.js';
import { checkVictory } from './victory.js';
import { leaveAllVents } from './vents.js';
import { onMeetingStart } from './sabotage.js';

const SKIP = 'skip';

const voters = (room) => playerList(room).filter((p) => p.alive);

// Alguien reporta un cuerpo: todos a la reunión y los cuerpos desaparecen.
export function startMeeting(room, callerId, bodyId, now) {
  room.phase = 'meeting';
  room.meeting = { caller: callerId, body: bodyId, stage: 'voting', endsAt: now + meetingMs(room), votes: {} };
  room.bodies = [];
  for (const p of playerList(room)) p.taskStart = null;
  return [
    ...leaveAllVents(room),
    ...onMeetingStart(room, now),
    toAll(roomInfo(room)),
    toAll({ t: 'bodies', list: [] }),
    toAll({ t: 'meeting', caller: callerId, body: bodyId, ms: meetingMs(room) }),
  ];
}

export function chat(room, id, msg, now) {
  const p = room.players[id];
  const m = room.meeting;
  if (room.phase !== 'meeting' || m.stage !== 'voting' || !p || !p.alive) return [];
  if (now - (p.chatAt || 0) < CHAT_COOLDOWN_MS) return [];
  const text = msg.text.slice(0, CHAT_MAX_LENGTH);
  if (!text) return [];
  p.chatAt = now;
  return [toAll({ t: 'chat', from: id, text })];
}

export function vote(room, id, msg, now) {
  const p = room.players[id];
  const m = room.meeting;
  if (room.phase !== 'meeting' || m.stage !== 'voting' || !p || !p.alive) return [];
  if (m.votes[id] !== undefined) return [];
  const target = room.players[msg.target];
  if (msg.target !== SKIP && (!target || !target.alive)) return [];
  m.votes[id] = msg.target;
  const out = [toAll({ t: 'voted', id })];
  const everyone = voters(room).every((v) => m.votes[v.id] !== undefined);
  return everyone ? [...out, ...finishVoting(room, now)] : out;
}

// Si un jugador se va durante la votación, su voto deja de contar.
export function forgetVoter(room, id, now) {
  const m = room.meeting;
  if (room.phase !== 'meeting' || m.stage !== 'voting') return [];
  delete m.votes[id];
  for (const voter of Object.keys(m.votes)) if (m.votes[voter] === id) m.votes[voter] = SKIP;
  const everyone = voters(room).every((v) => m.votes[v.id] !== undefined);
  return everyone ? finishVoting(room, now) : [];
}

// El más votado es expulsado; empate o "saltar" en cabeza = nadie.
function tally(votes) {
  const counts = {};
  for (const target of Object.values(votes)) counts[target] = (counts[target] || 0) + 1;
  let best = null;
  let tie = false;
  for (const [target, n] of Object.entries(counts)) {
    if (!best || n > counts[best]) {
      best = target;
      tie = false;
    } else if (n === counts[best]) {
      tie = true;
    }
  }
  return !best || tie || best === SKIP ? null : best;
}

// Votos anónimos: se sabe cuántos votos tiene cada uno, pero no de quién.
function anonymous(votes) {
  return Object.fromEntries(Object.values(votes).map((target, i) => [`anon${i}`, target]));
}

function finishVoting(room, now) {
  const m = room.meeting;
  const ejectedId = tally(m.votes);
  const ejected = ejectedId ? room.players[ejectedId] : null;
  if (ejected) ejected.alive = false;
  m.stage = 'results';
  m.endsAt = now + RESULT_MS;
  const confirm = room.settings.confirmEjects;
  m.result = {
    ejected: ejectedId,
    wasImpostor: ejected && confirm ? isImpostor(ejected) : null,
    impostorsLeft: confirm ? playerList(room).filter((p) => p.alive && isImpostor(p)).length : null,
    votes: room.settings.anonymousVotes ? anonymous(m.votes) : m.votes,
  };
  const result = { t: 'result', ...m.result, ms: RESULT_MS };
  return [toAll(result), toAll(roomInfo(room))];
}

// Tras enseñar el resultado: o termina la partida o todos vuelven al inicio.
function endMeeting(room, now) {
  const ended = checkVictory(room);
  if (ended.length) return ended;
  room.phase = 'playing';
  room.meeting = null;
  room.emergencyReadyAt = now + emergencyCooldownMs(room);
  const out = [toAll(roomInfo(room)), ...sendAllToSpawn(room, now)];
  for (const p of playerList(room).filter(isImpostor)) {
    p.killReadyAt = now + killCooldownMs(room);
    out.push({ to: p.id, msg: { t: 'cooldown', ms: killCooldownMs(room) } });
  }
  return out;
}

export function tickMeeting(room, now) {
  const m = room.meeting;
  if (!m || now < m.endsAt) return [];
  return m.stage === 'voting' ? finishVoting(room, now) : endMeeting(room, now);
}

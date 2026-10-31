// Sala de espera: elegir lenguaje, empezar la partida y volver a la sala. Lógica pura.

import { LANGUAGES, TASKS } from '../shared/constants.js';
import { spawnPoint } from '../client/js/map.js';
import { MAX_PLAYERS, MIN_PLAYERS } from './config.js';
import { emergencyCooldownMs, killCooldownMs } from './settings.js';
import { playerList, roomInfo, taskProgress, tasksMessage, toAll } from './info.js';
import { resetSabotage, sabotageMessage } from './sabotage.js';

const error = (id, text) => ({ to: id, msg: { t: 'error', text } });

function shuffle(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Coloca al jugador en el punto de aparición número i.
export function placeAtSpawn(p, i, now) {
  const pos = spawnPoint(i, MAX_PLAYERS);
  p.x = pos.x;
  p.y = pos.y;
  p.lastMoveAt = now;
}

// Todos al punto de inicio y aviso a cada cliente de su nueva posición.
export function sendAllToSpawn(room, now) {
  return playerList(room).map((p, i) => {
    placeAtSpawn(p, i, now);
    return { to: p.id, msg: { t: 'pos', x: p.x, y: p.y } };
  });
}

export function chooseLanguage(room, id, msg) {
  const p = room.players[id];
  if (!p || room.phase !== 'lobby' || !LANGUAGES.some((l) => l.id === msg.lang)) return [];
  const taken = playerList(room).some((o) => o.id !== id && o.lang === msg.lang);
  if (taken) return [error(id, 'Ese lenguaje ya lo ha cogido otro jugador.')];
  p.lang = msg.lang;
  return [toAll(roomInfo(room))];
}

// Los que pida el anfitrión, pero nunca tantos como tripulantes.
function impostorCount(players, wanted) {
  return Math.max(1, Math.min(wanted, Math.floor((players - 1) / 2)));
}

function randomTasks(count) {
  return shuffle(TASKS)
    .slice(0, count)
    .map((t) => ({ id: t.id, done: false }));
}

// Mensaje privado con el rol: el impostor sabe quiénes son sus compañeros.
export function roleMessage(room, p) {
  const allies =
    p.role === 'impostor'
      ? playerList(room).filter((o) => o.role === 'impostor' && o.id !== p.id).map((o) => o.id)
      : [];
  return { t: 'role', role: p.role, allies };
}

export function startGame(room, id, msg, now) {
  if (room.phase !== 'lobby' || room.hostId !== id) return [];
  const players = playerList(room);
  if (players.length < MIN_PLAYERS) {
    return [error(id, `Hacen falta al menos ${MIN_PLAYERS} jugadores.`)];
  }
  const { settings } = room;
  const impostors = new Set(shuffle(players).slice(0, impostorCount(players.length, settings.impostors)));
  for (const p of players) {
    p.role = impostors.has(p) ? 'impostor' : 'crew';
    p.alive = true;
    p.tasks = randomTasks(settings.tasks);
    p.taskStart = null;
    p.killReadyAt = now + killCooldownMs(room);
    p.emergencyLeft = settings.emergencyMeetings;
    p.vent = null;
  }
  room.phase = 'playing';
  room.emergencyReadyAt = now + emergencyCooldownMs(room);
  room.bodies = [];
  room.meeting = null;
  const out = [
    toAll(roomInfo(room)),
    toAll(taskProgress(room)),
    toAll({ t: 'bodies', list: [] }),
    ...resetSabotage(room, now),
    toAll(sabotageMessage(room, now)),
  ];
  for (const p of players) {
    out.push({ to: p.id, msg: roleMessage(room, p) }, { to: p.id, msg: tasksMessage(p) });
    if (p.role === 'impostor') out.push({ to: p.id, msg: { t: 'cooldown', ms: killCooldownMs(room) } });
  }
  return [...out, ...sendAllToSpawn(room, now)];
}

// Todo vuelve a como estaba en la sala de espera.
export function backToLobby(room, now) {
  for (const p of playerList(room)) {
    p.alive = true;
    p.role = null;
    p.tasks = [];
    p.taskStart = null;
    p.vent = null;
    p.emergencyLeft = undefined;
  }
  room.phase = 'lobby';
  room.bodies = [];
  room.meeting = null;
  room.result = null;
  room.sabotage = null;
  return [
    toAll(roomInfo(room)),
    toAll({ t: 'bodies', list: [] }),
    toAll(sabotageMessage(room, now)),
    ...sendAllToSpawn(room, now),
  ];
}

// Tras la pantalla final, el anfitrión devuelve a todos a la sala.
export function returnToLobby(room, id, msg, now) {
  if (room.phase !== 'ended' || room.hostId !== id) return [];
  return backToLobby(room, now);
}

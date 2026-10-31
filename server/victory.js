// Condiciones de victoria y fin de partida. Lógica pura.

import { isImpostor, playerList, roomInfo, taskProgress, toAll } from './info.js';

// Quién ha ganado ahora mismo (o null si la partida sigue).
function winner(room) {
  const alive = playerList(room).filter((p) => p.alive);
  const impostors = alive.filter(isImpostor).length;
  const crew = alive.length - impostors;
  if (impostors === 0) return { winner: 'crew', reason: 'impostor' };
  if (impostors >= crew) return { winner: 'impostor', reason: 'kills' };
  const { done, total } = taskProgress(room);
  if (total > 0 && done >= total) return { winner: 'crew', reason: 'tasks' };
  return null;
}

export function endGame(room, result) {
  room.phase = 'ended';
  room.meeting = null;
  const roles = {};
  for (const p of playerList(room)) roles[p.id] = p.role;
  room.result = { t: 'end', ...result, roles }; // se guarda para quien reconecte
  return [toAll(roomInfo(room)), toAll(room.result)];
}

// Se llama tras cada muerte, expulsión, tarea completada o jugador que se va.
export function checkVictory(room) {
  if (room.phase !== 'playing' && room.phase !== 'meeting') return [];
  const result = winner(room);
  return result ? endGame(room, result) : [];
}

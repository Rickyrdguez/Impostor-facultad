// Estado compartido del cliente.

export const state = {
  screen: 'home', // home | game
  myId: null,
  room: null, // último mensaje 'room' (nombres, host, fase)
  me: { x: 0, y: 0, fx: 0, fy: 1, moving: false, walk: 0, placed: false },
  // Otros jugadores: id -> { snaps: [{time, x, y}], x, y, fx, fy, moving, walk }
  others: new Map(),
};

export function myInfo() {
  return state.room?.players.find((p) => p.id === state.myId) || null;
}

export function playerInfo(id) {
  return state.room?.players.find((p) => p.id === id) || null;
}

export function isHost() {
  return state.room?.hostId === state.myId;
}

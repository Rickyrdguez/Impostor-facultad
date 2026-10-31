// Estado compartido del cliente.

export const state = {
  screen: 'home', // home | game
  myId: null,
  room: null, // último mensaje 'room' (nombres, host, fase)
  me: { x: 0, y: 0, fx: 0, fy: 1, moving: false, walk: 0, placed: false },
  // Otros jugadores: id -> { snaps: [{time, x, y}], x, y, fx, fy, moving, walk }
  others: new Map(),

  // Partida
  role: null, // 'crew' | 'impostor' | null
  allies: [], // otros impostores (solo los ve el impostor)
  tasks: [], // [{ id, done }]
  fakeDone: new Set(), // tareas falsas que el impostor ha "hecho"
  progress: { done: 0, total: 0 },
  bodies: [], // [{ id, x, y }]
  killReadyAt: 0, // performance.now() a partir del cual se puede matar
  hold: null, // tarea en curso: { id, start }
  vent: null, // trampilla en la que está el impostor (o null)
  sabotage: null, // sabotaje activo: { kind, endsAt, fixed: Set } o null
  sabotageReadyAt: 0, // performance.now() a partir del cual el impostor puede sabotear
  mapOpen: false,
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

export function phase() {
  return state.room?.phase || 'lobby';
}

export function amAlive() {
  return myInfo()?.alive !== false;
}

// Al volver a la sala de espera se olvida todo lo de la partida.
export function resetMatch() {
  state.role = null;
  state.allies = [];
  state.tasks = [];
  state.fakeDone = new Set();
  state.progress = { done: 0, total: 0 };
  state.bodies = [];
  state.killReadyAt = 0;
  state.hold = null;
  state.vent = null;
  state.sabotage = null;
  state.sabotageReadyAt = 0;
}

// Con el wifi caído nadie ve sus tareas.
export function wifiDown() {
  return state.sabotage?.kind === 'wifi';
}

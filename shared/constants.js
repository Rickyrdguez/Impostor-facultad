// Constantes compartidas entre servidor y cliente.

// Movimiento y tamaños (unidades del mundo = píxeles del mapa a escala 1)
export const PLAYER_RADIUS = 18;
export const PLAYER_SPEED = 220; // unidades por segundo
export const NAME_MAX_LENGTH = 12;
export const ROOM_CODE_LENGTH = 4;

// Red
export const SEND_RATE_MS = 50; // el cliente manda su posición ~20 veces/s
export const INTERP_DELAY_MS = 100; // retraso de interpolación de los demás
export const RECONNECT_GRACE_MS = 30000; // tiempo para volver tras una caída

// Visión (radio en unidades del mundo)
export const VISION_CREW = 300;
export const VISION_IMPOSTOR = 400;

// Lenguajes elegibles como personaje: color característico + letras.
// ink = color de las letras de la insignia para que se lean bien.
export const LANGUAGES = [
  { id: 'py', name: 'Python', short: 'Py', color: '#3776ab', ink: '#ffd845' },
  { id: 'js', name: 'JavaScript', short: 'JS', color: '#f7df1e', ink: '#1d1d1b' },
  { id: 'java', name: 'Java', short: 'Jv', color: '#9c6418', ink: '#ffffff' },
  { id: 'cpp', name: 'C++', short: 'C++', color: '#f34b7d', ink: '#ffffff' },
  { id: 'cs', name: 'C#', short: 'C#', color: '#2f9e2f', ink: '#ffffff' },
  { id: 'go', name: 'Go', short: 'Go', color: '#00add8', ink: '#ffffff' },
  { id: 'rust', name: 'Rust', short: 'Rs', color: '#d9772e', ink: '#1d1d1b' },
  { id: 'php', name: 'PHP', short: 'PHP', color: '#4f5d95', ink: '#ffffff' },
  { id: 'kt', name: 'Kotlin', short: 'Kt', color: '#a97bff', ink: '#ffffff' },
  { id: 'swift', name: 'Swift', short: 'Sw', color: '#e53935', ink: '#ffffff' },
  { id: 'sh', name: 'Bash', short: 'Sh', color: '#89e051', ink: '#1d1d1b' },
  { id: 'c', name: 'C', short: 'C', color: '#a8b9cc', ink: '#1d1d1b' },
];

export function languageById(id) {
  return LANGUAGES.find((l) => l.id === id) || LANGUAGES[0];
}

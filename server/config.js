// Constantes del servidor. Lógica pura: no depende de Node ni de ws.

import { defaultSettings } from '../shared/settings.js';

export {
  RECONNECT_GRACE_MS,
  USE_RANGE,
  REPORT_RANGE,
  TASK_MIN_MS,
  CHAT_MAX_LENGTH,
} from '../shared/constants.js';

export const TICK_MS = 50; // reparto del estado (20 veces/s)
export const MIN_PLAYERS = 3; // bájalo a 2 para probar con dos pestañas
export const MAX_PLAYERS = 10;

// Reglas de la partida. Las que se pueden ajustar en la sala están en
// shared/settings.js; aquí se exportan sus valores por defecto (los usan los tests).
const DEFAULTS = defaultSettings();
export const KILL_COOLDOWN_MS = DEFAULTS.killCooldown * 1000;
export const EMERGENCY_COOLDOWN_MS = DEFAULTS.emergencyCooldown * 1000;
export const MEETING_MS = DEFAULTS.meetingTime * 1000;
export const SABOTAGE_COOLDOWN_MS = 30000; // entre sabotajes (y al empezar)
export const RADON_MS = 45000; // tiempo para cerrar la fuga de radón antes de perder
export const RESULT_MS = 8000; // recuento + animación de expulsión
export const CHAT_COOLDOWN_MS = 700; // entre dos mensajes del mismo jugador

// Red y seguridad
export const MAX_MESSAGE_BYTES = 1024;
export const MAX_MESSAGES_PER_SECOND = 60;
export const PING_INTERVAL_MS = 25000;

// Validación de movimiento: margen sobre la velocidad teórica
export const MOVE_TOLERANCE = 1.6;
export const MOVE_SLACK = 20; // unidades extra permitidas por lag
export const MOVE_MAX_DT_MS = 250; // tope de tiempo entre dos movimientos

// Letras de los códigos de sala (sin I, O ni L para no confundir)
export const CODE_LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ';

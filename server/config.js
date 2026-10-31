// Constantes del servidor. Lógica pura: no depende de Node ni de ws.

export {
  RECONNECT_GRACE_MS,
  USE_RANGE,
  KILL_RANGE,
  REPORT_RANGE,
  TASK_HOLD_MS,
  CHAT_MAX_LENGTH,
} from '../shared/constants.js';

export const TICK_MS = 50; // reparto del estado (20 veces/s)
export const MIN_PLAYERS = 3; // bájalo a 2 para probar con dos pestañas
export const MAX_PLAYERS = 10;
export const IMPOSTORS = 1;

// Reglas de la partida
export const TASKS_PER_PLAYER = 3;
export const KILL_COOLDOWN_MS = 15000;
export const EMERGENCY_COOLDOWN_MS = 15000; // tras empezar y tras cada reunión
export const SABOTAGE_COOLDOWN_MS = 30000; // entre sabotajes (y al empezar)
export const RADON_MS = 45000; // tiempo para cerrar la fuga de radón antes de perder
export const MEETING_MS = 40000; // tiempo para hablar y votar
export const RESULT_MS = 6000; // tiempo mostrando el resultado de la votación
export const CHAT_COOLDOWN_MS = 700; // entre dos mensajes del mismo jugador
export const TASK_TIME_TOLERANCE = 0.8; // se acepta la tarea si se mantuvo el 80 % del tiempo

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

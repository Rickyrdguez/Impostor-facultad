// Constantes del servidor. Lógica pura: no depende de Node ni de ws.

export { RECONNECT_GRACE_MS } from '../shared/constants.js';

export const TICK_MS = 50; // reparto del estado (20 veces/s)
export const MIN_PLAYERS = 3; // bájalo a 2 para probar con dos pestañas
export const MAX_PLAYERS = 10;
export const IMPOSTORS = 1;

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

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

// Acciones (distancias en unidades del mundo, tiempos en ms)
export const USE_RANGE = 80; // distancia para hacer una tarea
export const REPORT_RANGE = 110; // distancia para reportar un cuerpo
export const TASK_MIN_MS = 500; // tiempo mínimo entre abrir y terminar un minijuego
export const CHAT_MAX_LENGTH = 120;

// Sabotajes del impostor
export const LIGHTS_VISION = 110; // radio de visión de los tripulantes con las luces apagadas
export const SABOTAGES = [
  { id: 'wifi', name: 'Tirar el wifi', alarm: '¡Se ha caído el wifi!', fixTitle: 'Reiniciar la red', fix: 'Reinícialo en el armario de red (Exterior)' },
  { id: 'luces', name: 'Apagar las luces', alarm: '¡Se han ido las luces!', fixTitle: 'Cuadro eléctrico', fix: 'Sube los interruptores del cuadro (Pasillo)' },
  { id: 'radon', name: 'Fuga de radón', alarm: '¡Fuga de radón!', fixTitle: 'Cerrar la válvula', fix: 'Ciérrala en el Laboratorio y en Secretaría' },
];

export function sabotageById(id) {
  return SABOTAGES.find((s) => s.id === id) || null;
}

// Tareas: nombre que ve el jugador. Su estación está en client/js/map.js.
export const TASKS = [
  { id: 'matricula', name: 'Sellar la matrícula', room: 'Secretaría' },
  { id: 'certificado', name: 'Pedir un certificado', room: 'Secretaría' },
  { id: 'ventana', name: 'Cerrar la ventana', room: 'Pasarela' },
  { id: 'maquina', name: 'Sacar algo de la máquina', room: 'Zona relax' },
  { id: 'sofa', name: 'Despertar al del sofá', room: 'Zona relax' },
  { id: 'tablon', name: 'Mirar las notas del tablón', room: 'Gran pasillo' },
  { id: 'wifi', name: 'Reiniciar el wifi', room: 'Gran pasillo' },
  { id: 'lavarse', name: 'Lavarse las manos', room: 'Baños' },
  { id: 'papel', name: 'Reponer el papel', room: 'Baños' },
  { id: 'ascensor', name: 'Llamar al ascensor', room: 'Ascensor' },
  { id: 'proyector', name: 'Arreglar el proyector', room: 'Clase' },
  { id: 'entregar', name: 'Entregar la práctica', room: 'Clase' },
  { id: 'compilar', name: 'Compilar el proyecto', room: 'Laboratorio' },
  { id: 'osciloscopio', name: 'Calibrar el osciloscopio', room: 'Laboratorio' },
  { id: 'fotocopias', name: 'Fotocopiar apuntes', room: 'Sala de estudio' },
  { id: 'libro', name: 'Buscar un libro', room: 'Sala de estudio' },
  { id: 'cafe', name: 'Pedir un café', room: 'Cafetería' },
  { id: 'mesas', name: 'Limpiar las mesas', room: 'Cafetería' },
  { id: 'plantas', name: 'Regar las plantas', room: 'Terraza' },
];

export function taskById(id) {
  return TASKS.find((t) => t.id === id);
}

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

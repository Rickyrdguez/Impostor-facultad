// Ajustes de la partida que elige el anfitrión (al estilo de Among Us).
// Lo usan el servidor (para aplicar y validar) y el cliente (para pintar el menú).
//
// Tipos:
//   number: entre min y max, de step en step (unit es lo que se muestra detrás)
//   choice: una de las opciones [valor, texto]
//   bool:   sí o no

const SIZE = [
  [0.75, 'Poca'],
  [1, 'Normal'],
  [1.25, 'Mucha'],
];

export const SETTINGS = [
  { id: 'impostors', label: 'Impostores', type: 'number', min: 1, max: 3, step: 1, value: 1 },
  { id: 'killCooldown', label: 'Espera para matar', type: 'number', min: 10, max: 60, step: 5, value: 15, unit: 's' },
  {
    id: 'killDistance',
    label: 'Distancia para matar',
    type: 'choice',
    options: [
      [70, 'Corta'],
      [90, 'Normal'],
      [120, 'Larga'],
    ],
    value: 90,
  },
  { id: 'meetingTime', label: 'Tiempo de reunión', type: 'number', min: 20, max: 120, step: 10, value: 40, unit: 's' },
  { id: 'emergencyMeetings', label: 'Reuniones de emergencia por jugador', type: 'number', min: 0, max: 3, step: 1, value: 1 },
  { id: 'emergencyCooldown', label: 'Espera del botón de emergencia', type: 'number', min: 0, max: 60, step: 5, value: 15, unit: 's' },
  { id: 'confirmEjects', label: 'Decir si el expulsado era el impostor', type: 'bool', value: true },
  { id: 'anonymousVotes', label: 'Votos anónimos', type: 'bool', value: false },
  { id: 'tasks', label: 'Tareas por tripulante', type: 'number', min: 1, max: 6, step: 1, value: 3 },
  {
    id: 'speed',
    label: 'Velocidad de los jugadores',
    type: 'choice',
    options: [
      [0.75, 'Lenta'],
      [1, 'Normal'],
      [1.25, 'Rápida'],
    ],
    value: 1,
  },
  { id: 'crewVision', label: 'Visión de los tripulantes', type: 'choice', options: SIZE, value: 1 },
  { id: 'impostorVision', label: 'Visión del impostor', type: 'choice', options: SIZE, value: 1 },
];

export function settingById(id) {
  return SETTINGS.find((s) => s.id === id) || null;
}

export function defaultSettings() {
  return Object.fromEntries(SETTINGS.map((s) => [s.id, s.value]));
}

// Devuelve el valor si es válido para ese ajuste, o null si no lo es.
export function validSetting(id, value) {
  const s = settingById(id);
  if (!s) return null;
  if (s.type === 'bool') return typeof value === 'boolean' ? value : null;
  if (s.type === 'choice') return s.options.some(([v]) => v === value) ? value : null;
  const ok = Number.isInteger(value) && value >= s.min && value <= s.max && (value - s.min) % s.step === 0;
  return ok ? value : null;
}

// Texto para mostrar un valor ("15 s", "Normal", "Sí"...).
export function settingText(id, value) {
  const s = settingById(id);
  if (s.type === 'bool') return value ? 'Sí' : 'No';
  if (s.type === 'choice') return (s.options.find(([v]) => v === value) || [, '?'])[1];
  return s.unit ? `${value} ${s.unit}` : String(value);
}

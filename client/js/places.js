// Puntos interactivos del mapa: estaciones de tareas, trampillas y botón de emergencia.
// Datos puros (sin DOM): los usan el cliente y el servidor.

// Estaciones de tareas: id de la tarea (shared/constants.js) -> [x, y].
export const STATIONS = {
  matricula: [310, 365],
  certificado: [230, 230],
  ventana: [900, 105],
  maquina: [1605, 145],
  sofa: [1290, 200],
  tablon: [300, 665],
  wifi: [1550, 665],
  lavarse: [170, 1120],
  papel: [245, 1265],
  ascensor: [825, 1060],
  proyector: [1525, 1210],
  entregar: [1110, 1205],
  compilar: [200, 1625],
  osciloscopio: [200, 1885],
  fotocopias: [1315, 1858],
  libro: [1638, 1870],
  cafe: [1078, 1495],
  mesas: [800, 1960],
  plantas: [620, 2220],
};

// Botón de emergencia: en la mesa del centro del gran pasillo (donde se aparece).
export const EMERGENCY = { x: 900, y: 790, radius: 26 };

// Trampillas del impostor. Las de la misma red están conectadas entre sí.
export const VENTS = [
  { id: 'banos', room: 'Baños', net: 'a', x: 330, y: 1055 },
  { id: 'laboratorio', room: 'Laboratorio', net: 'a', x: 300, y: 1760 },
  { id: 'secretaria', room: 'Secretaría', net: 'b', x: 560, y: 520 },
  { id: 'cafeteria', room: 'Cafetería', net: 'b', x: 560, y: 1880 },
  { id: 'relax', room: 'Zona relax', net: 'c', x: 1640, y: 545 },
  { id: 'estudio', room: 'Sala de estudio', net: 'c', x: 1660, y: 1660 },
  { id: 'ascensor', room: 'Ascensor', net: 'd', x: 740, y: 1170 },
  { id: 'clase', room: 'Clase', net: 'd', x: 990, y: 1215 },
  { id: 'terraza', room: 'Terraza', net: 'd', x: 1100, y: 2225 },
];

export function ventById(id) {
  return VENTS.find((v) => v.id === id) || null;
}

// Trampillas a las que se puede saltar desde esta (misma red).
export function connectedVents(id) {
  const vent = ventById(id);
  return vent ? VENTS.filter((v) => v.net === vent.net && v.id !== id) : [];
}

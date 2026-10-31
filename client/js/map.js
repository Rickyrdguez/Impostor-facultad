// Datos del mapa (una planta de la ESIT) y colisiones.
// Módulo puro: sin DOM. Lo usan el cliente y el servidor.
// Rectángulos: [x, y, ancho, alto]. Círculos: [cx, cy, radio].

export const MAP = { width: 1800, height: 2340, spawn: { x: 900, y: 790 } };

// Salas: suelo transitable con nombre y estilo de suelo.
// Se dibujan en este orden: las que solapan van antes de la sala que las tapa.
export const ROOMS = [
  { id: 'secretaria', name: 'Secretaría', rect: [100, 80, 540, 520], floor: 'crema', label: [370, 470] },
  { id: 'pasarela', name: 'Pasarela', rect: [680, 80, 440, 120], floor: 'baldosa' },
  { id: 'relax', name: 'Zona relax', rect: [1160, 80, 540, 520], floor: 'madera', label: [1430, 560] },
  // Pasillo real de la facultad: baja del gran pasillo a la cafetería
  { id: 'pasillo', name: 'Pasillo', rect: [460, 930, 180, 530], floor: 'baldosa', label: [550, 1330] },
  { id: 'exterior', name: 'Exterior', rect: [1600, 930, 100, 520], floor: 'piedra', label: [1650, 1190] },
  { id: 'hall', name: 'Gran pasillo', rect: [100, 640, 1600, 300], floor: 'baldosa' },
  { id: 'banos', name: 'Baños', rect: [100, 1000, 320, 300], floor: 'azul', label: [260, 1150] },
  { id: 'ascensor', name: 'Ascensor', rect: [680, 1000, 220, 220], floor: 'terrazo', label: [770, 1180] },
  { id: 'clase', name: 'Clase', rect: [940, 980, 620, 270], floor: 'madera', label: [1250, 1225] },
  { id: 'laboratorio', name: 'Laboratorio', rect: [100, 1480, 240, 480], floor: 'azul', label: [220, 1515] },
  { id: 'estudio', name: 'Sala de estudio', rect: [1260, 1440, 440, 520], floor: 'crema' },
  { id: 'cafeteria', name: 'Cafetería', circle: [800, 1700, 420], floor: 'baldosa', label: [800, 1515] },
  { id: 'terraza', name: 'Terraza', rect: [100, 2160, 1600, 120], floor: 'piedra' },
];

// Puertas que unen salas (también son suelo).
export const DOORS = [
  [630, 100, 60, 80], [1110, 100, 60, 80], // pasarela norte
  [300, 590, 120, 60], [1380, 590, 120, 60], // secretaría y relax al gran pasillo
  [960, 930, 120, 60], // única entrada de la clase
  [410, 1100, 60, 100], [630, 1060, 60, 100], // baños y ascensor al pasillo
  [330, 1650, 80, 100], [1200, 1650, 70, 100], // laterales de la cafetería
  [170, 1950, 100, 220], [1450, 1950, 100, 220], [750, 2100, 100, 70], // terraza
];

// Muebles y objetos que bloquean el paso.
export const OBSTACLES = [
  // Secretaría
  { kind: 'mostrador', rect: [160, 300, 300, 40] },
  { kind: 'mesa', rect: [180, 150, 100, 56] },
  { kind: 'mesa', rect: [340, 150, 100, 56] },
  { kind: 'armario', rect: [110, 450, 50, 130] },
  // Zona relax
  { kind: 'sofa', rect: [1200, 120, 170, 50] },
  { kind: 'sofa', rect: [1200, 220, 50, 150] },
  { kind: 'mesa', circle: [1340, 290, 40] },
  { kind: 'maquina', rect: [1630, 100, 55, 90] },
  { kind: 'mesa', rect: [1480, 420, 170, 90] },
  // Gran pasillo
  { kind: 'banco', rect: [420, 775, 150, 30] },
  { kind: 'banco', rect: [1230, 775, 150, 30] },
  { kind: 'columna', circle: [700, 790, 20] },
  { kind: 'columna', circle: [1100, 790, 20] },
  // Baños: lavabos y cubículos
  { kind: 'lavabo', rect: [110, 1030, 40, 170] },
  { kind: 'mampara', rect: [200, 1215, 10, 85] },
  { kind: 'mampara', rect: [280, 1215, 10, 85] },
  { kind: 'mampara', rect: [360, 1215, 10, 85] },
  // Zona del ascensor
  { kind: 'ascensor', rect: [850, 1020, 40, 80] },
  { kind: 'ascensor', rect: [850, 1125, 40, 80] },
  { kind: 'maceta', circle: [715, 1035, 18] },
  // Clase: pupitres y mesa del profesor
  ...desks(1060, 1060, 3, 2),
  { kind: 'mesa', rect: [1470, 1030, 40, 140] },
  // Laboratorio y sala de estudio
  { kind: 'mesa', rect: [130, 1560, 140, 36] },
  { kind: 'mesa', rect: [130, 1690, 140, 36] },
  { kind: 'mesa', rect: [130, 1820, 140, 36] },
  { kind: 'mesa', rect: [1340, 1540, 120, 60] },
  { kind: 'mesa', rect: [1510, 1540, 100, 60] },
  { kind: 'mesa', rect: [1340, 1720, 120, 60] },
  { kind: 'mesa', rect: [1510, 1720, 120, 60] },
  { kind: 'armario', rect: [1660, 1800, 30, 140] },
  // Cafetería: lucernario central y mesas en anillo
  { kind: 'lucernario', circle: [800, 1700, 130] },
  ...ringTables(800, 1700, 275, 7),
  // Terraza
  { kind: 'maceta', circle: [420, 2255, 18] },
  { kind: 'maceta', circle: [620, 2255, 18] },
  { kind: 'maceta', circle: [1000, 2255, 18] },
  { kind: 'maceta', circle: [1300, 2255, 18] },
];

// Objetos altos que tapan la vista (el resto son bajos y se ve por encima).
export const OPAQUE_KINDS = new Set(['armario', 'maquina', 'ascensor', 'columna', 'lucernario', 'mampara']);


// Decoración que no es suelo (no se puede pisar).
export const DECOR = [{ kind: 'patio', name: 'Patio', rect: [680, 240, 440, 360] }];

// Filas de pupitres de la clase.
function desks(x0, y0, cols, rows) {
  const out = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out.push({ kind: 'pupitre', rect: [x0 + c * 150, y0 + r * 80, 100, 30] });
    }
  }
  return out;
}

// Mesas repartidas en círculo alrededor del lucernario.
function ringTables(cx, cy, radius, count) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + Math.PI / count;
    out.push({ kind: 'mesa', circle: [cx + Math.cos(a) * radius, cy + Math.sin(a) * radius, 26] });
  }
  return out;
}

// ---------- Colisiones ----------

const SAMPLES = 12; // puntos del borde del jugador que se comprueban
const STEP = 8; // paso al comprobar un trayecto

function inRect(px, py, [x, y, w, h]) {
  return px >= x && px <= x + w && py >= y && py <= y + h;
}

function inCircle(px, py, [cx, cy, r]) {
  return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
}

function inShape(px, py, s) {
  return s.rect ? inRect(px, py, s.rect) : inCircle(px, py, s.circle);
}

// ¿Este punto tapa la vista? (paredes y muebles altos)
export function blocksSight(px, py) {
  if (!isFloor(px, py)) return true;
  return OBSTACLES.some((o) => OPAQUE_KINDS.has(o.kind) && inShape(px, py, o));
}

// ¿Este punto es suelo?
export function isFloor(px, py) {
  return ROOMS.some((r) => inShape(px, py, r)) || DOORS.some((d) => inRect(px, py, d));
}

// Distancia mínima de un punto a un obstáculo (0 si está dentro).
function distToObstacle(px, py, o) {
  if (o.circle) {
    const [cx, cy, r] = o.circle;
    return Math.max(0, Math.hypot(px - cx, py - cy) - r);
  }
  const [x, y, w, h] = o.rect;
  const dx = Math.max(x - px, 0, px - (x + w));
  const dy = Math.max(y - py, 0, py - (y + h));
  return Math.hypot(dx, dy);
}

// ¿Cabe un jugador de radio r en (x, y)? Los fantasmas solo respetan los bordes.
export function canStand(x, y, r, ghost = false) {
  if (ghost) return x >= 0 && y >= 0 && x <= MAP.width && y <= MAP.height;
  if (!isFloor(x, y)) return false;
  for (let i = 0; i < SAMPLES; i++) {
    const a = (i / SAMPLES) * Math.PI * 2;
    if (!isFloor(x + Math.cos(a) * r, y + Math.sin(a) * r)) return false;
  }
  return !OBSTACLES.some((o) => distToObstacle(x, y, o) < r);
}

// ¿Se puede ir en línea recta de a a b sin atravesar nada?
export function pathClear(ax, ay, bx, by, r, ghost = false) {
  const steps = Math.ceil(Math.hypot(bx - ax, by - ay) / STEP);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    if (!canStand(ax + (bx - ax) * t, ay + (by - ay) * t, r, ghost)) return false;
  }
  return true;
}

// Mueve deslizando por las paredes: primero en x y luego en y.
export function moveWithCollisions(x, y, dx, dy, r, ghost = false) {
  let nx = x;
  let ny = y;
  if (canStand(x + dx, y, r, ghost)) nx = x + dx;
  if (canStand(nx, y + dy, r, ghost)) ny = y + dy;
  return { x: nx, y: ny };
}

// Punto de aparición número i, en círculo alrededor del spawn.
export function spawnPoint(i, total) {
  const a = (i / Math.max(total, 1)) * Math.PI * 2;
  const radius = total > 1 ? 70 : 0;
  return { x: MAP.spawn.x + Math.cos(a) * radius, y: MAP.spawn.y + Math.sin(a) * radius };
}

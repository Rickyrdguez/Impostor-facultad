// Datos del mapa (una planta de la ESIT) y colisiones.
// Módulo puro: sin DOM. Lo usan el cliente y el servidor.
// Rectángulos: [x, y, ancho, alto]. Círculos: [cx, cy, radio].

export const MAP = { width: 1800, height: 2420, spawn: { x: 900, y: 790 } };

// Salas: suelo transitable con nombre y estilo de suelo.
export const ROOMS = [
  { id: 'secretaria', name: 'Secretaría', rect: [100, 80, 540, 520], floor: 'crema', label: [370, 470] },
  { id: 'pasarela', name: 'Pasarela', rect: [680, 80, 440, 120], floor: 'baldosa' },
  { id: 'relax', name: 'Zona relax', rect: [1160, 80, 540, 520], floor: 'madera', label: [1430, 560] },
  { id: 'hall', name: 'Gran pasillo', rect: [100, 640, 1600, 300], floor: 'baldosa' },
  { id: 'banos', name: 'Baños', rect: [100, 980, 340, 360], floor: 'azul' },
  { id: 'ascensor', name: 'Ascensor', rect: [480, 980, 380, 420], floor: 'terrazo' },
  { id: 'clase', name: 'Clase', rect: [900, 980, 540, 420], floor: 'madera', label: [1170, 1355] },
  { id: 'reprografia', name: 'Reprografía', rect: [1480, 980, 220, 420], floor: 'crema' },
  { id: 'laboratorio', name: 'Laboratorio', rect: [100, 1480, 360, 420], floor: 'azul', label: [280, 1525] },
  { id: 'estudio', name: 'Sala de estudio', rect: [1340, 1480, 360, 420], floor: 'crema' },
  { id: 'cafeteria', name: 'Cafetería', circle: [900, 1820, 380], floor: 'baldosa', label: [900, 1650] },
  { id: 'terraza', name: 'Terraza', rect: [100, 2240, 1600, 120], floor: 'piedra' },
];

// Puertas y pasillos cortos que unen salas (también son suelo).
export const DOORS = [
  [630, 100, 60, 80], [1110, 100, 60, 80], // pasarela norte
  [300, 590, 120, 60], [1380, 590, 120, 60], // secretaría y relax al pasillo
  [220, 930, 100, 60], [600, 930, 140, 60], [1080, 930, 120, 60], [1540, 930, 100, 60],
  [430, 1120, 60, 100], [850, 1200, 60, 100], [1430, 1150, 60, 100],
  [760, 1390, 100, 110], [940, 1390, 100, 110], // a la cafetería
  [220, 1330, 100, 160], [1350, 1390, 80, 100],
  [450, 1730, 120, 100], [1230, 1730, 120, 100], // laterales de la cafetería
  [220, 1890, 100, 360], [1480, 1890, 100, 360], [850, 2170, 100, 80], // terraza
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
  // Baños, ascensor, clase, reprografía
  { kind: 'lavabo', rect: [110, 1050, 40, 200] },
  { kind: 'ascensor', rect: [490, 990, 90, 70] },
  { kind: 'ascensor', rect: [760, 990, 90, 70] },
  { kind: 'mesa', rect: [1250, 1000, 130, 40] },
  ...desks(960, 1080, 3, 3),
  { kind: 'maquina', rect: [1635, 1060, 55, 70] },
  { kind: 'maquina', rect: [1635, 1180, 55, 70] },
  { kind: 'mesa', rect: [1500, 1310, 120, 40] },
  // Laboratorio y sala de estudio
  { kind: 'mesa', rect: [140, 1560, 200, 40] },
  { kind: 'mesa', rect: [140, 1680, 200, 40] },
  { kind: 'mesa', rect: [140, 1800, 200, 40] },
  { kind: 'mesa', rect: [1400, 1560, 120, 60] },
  { kind: 'mesa', rect: [1570, 1560, 100, 60] },
  { kind: 'mesa', rect: [1420, 1720, 120, 60] },
  { kind: 'armario', rect: [1655, 1690, 35, 180] },
  // Cafetería: lucernario central y mesas en anillo
  { kind: 'lucernario', circle: [900, 1820, 120] },
  ...ringTables(900, 1820, 250, 6),
  // Terraza
  { kind: 'maceta', circle: [420, 2335, 18] },
  { kind: 'maceta', circle: [700, 2335, 18] },
  { kind: 'maceta', circle: [1100, 2335, 18] },
  { kind: 'maceta', circle: [1380, 2335, 18] },
];

// Decoración que no es suelo (no se puede pisar).
export const DECOR = [{ kind: 'patio', name: 'Patio', rect: [680, 240, 440, 360] }];

// Filas de pupitres de la clase.
function desks(x0, y0, cols, rows) {
  const out = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out.push({ kind: 'pupitre', rect: [x0 + c * 150, y0 + r * 90, 100, 30] });
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

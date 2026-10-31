// Paleta del juego: todos los colores salen de aquí.

export const PALETTE = {
  exterior: '#2e3430',
  exteriorDot: '#363d38',
  wallTop: '#9c978e', // hormigón
  wallTopEdge: '#7f7a72',
  brick: '#a85a40', // ladrillo
  brickMortar: '#8c4832',
  shadow: 'rgba(30, 20, 10, 0.28)',
  wood: '#c9803f', // naranja madera
  woodDark: '#94592a',
  woodLight: '#e0a465',
  blue: '#3f7cac', // toque de azul
  blueDark: '#2d5c82',
  blueLight: '#7fb0d6',
  metal: '#b9bcbf',
  metalDark: '#878b90',
  plant: '#5f8f4e',
  plantDark: '#44703a',
  label: 'rgba(110, 80, 50, 0.22)',
  darkness: 'rgba(8, 8, 14, 0.94)',
  nameFill: '#ffffff',
  nameStroke: 'rgba(25, 20, 15, 0.85)',
  outline: 'rgba(25, 20, 15, 0.75)',
  cap: '#23262e', // birrete
  tassel: '#f2c14e',
};

// Estilos de suelo: color base, color de juntas y tamaño de baldosa.
export const FLOORS = {
  crema: { base: '#efe3c8', line: '#e2d2b0', size: 40 },
  baldosa: { base: '#e6d4b0', line: '#d6c299', size: 48, checker: '#e0cda6' },
  madera: { base: '#d8b385', line: '#c49b6a', size: 24, planks: true },
  azul: { base: '#d3e0e6', line: '#bccdd6', size: 32 },
  terrazo: { base: '#e3dccd', line: '#d4cbb8', size: 60, speckle: '#bfb5a2' },
  piedra: { base: '#cdbfa5', line: '#b7a88c', size: 56 },
};

// Colores de cada tipo de mueble: [cuerpo, borde oscuro, brillo].
export const FURNITURE = {
  mesa: [PALETTE.wood, PALETTE.woodDark, PALETTE.woodLight],
  pupitre: [PALETTE.wood, PALETTE.woodDark, PALETTE.woodLight],
  mostrador: [PALETTE.wood, PALETTE.woodDark, PALETTE.woodLight],
  banco: [PALETTE.wood, PALETTE.woodDark, PALETTE.woodLight],
  armario: [PALETTE.woodDark, '#6e4220', PALETTE.wood],
  sofa: [PALETTE.blue, PALETTE.blueDark, PALETTE.blueLight],
  maquina: [PALETTE.metal, PALETTE.metalDark, '#e4e6e8'],
  ascensor: [PALETTE.metal, PALETTE.metalDark, '#e4e6e8'],
  lavabo: ['#f4f4f2', '#b8bcbd', '#ffffff'],
  columna: [PALETTE.wallTop, PALETTE.wallTopEdge, '#bdb8af'],
  lucernario: [PALETTE.blueLight, PALETTE.blue, '#cfe4f2'],
  maceta: [PALETTE.plant, PALETTE.plantDark, '#86b56f'],
};

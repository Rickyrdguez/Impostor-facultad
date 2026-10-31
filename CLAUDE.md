# Impostor en la ESIT — decisiones del proyecto

Juego multijugador tipo "impostor" ambientado en la Escuela Superior de
Ingeniería y Tecnología (ULL). Se juega online desde cualquier red.

## Stack
- Servidor: Node (ESM, `"type": "module"`) + librería `ws`. Un único puerto
  (`process.env.PORT`, 3000 por defecto, host `0.0.0.0`) sirve la web
  (`client/` en `/` y `shared/` en `/shared/`) y los WebSockets.
- Cliente: canvas 2D + módulos ES nativos. Sin bundler, sin frameworks, sin
  librerías externas (solo la fuente Fredoka de Google Fonts).
- Despliegue: Render (Web Service gratuito, sin Docker). Build `npm install`,
  start `npm start`. `GET /health` responde 200.

## Arquitectura (no romper)
- `server/game.js` y `server/config.js` son **lógica pura**: no importan `ws`
  ni módulos de Node. Las funciones de `game.js` reciben la sala (estado) y un
  mensaje, modifican la sala y **devuelven la lista de mensajes a enviar**
  `[{ to: 'all' | playerId, msg }]`. Los temporizadores se resuelven en
  `tick(room, now)`, que llama la capa de red cada `TICK_MS`. Así se podrá
  migrar a Cloudflare Workers + Durable Objects sin tocar las reglas.
- Red solo en `server/index.js` (http, ws, ping), `server/rooms.js` (salas,
  sockets, tokens, reconexión) y `server/messages.js` (parseo y validación).
- Cliente: `main` (bucle), `network`, `input`, `state`, `players` (movimiento
  propio + interpolación), `render` (cámara, oscuridad), `mapview` (mapa
  pre-dibujado en un canvas aparte), `furniture`, `characters`, `ui`, `palette`.
- `client/js/map.js` es datos + colisiones puras (sin DOM). Lo importan el
  cliente y el servidor (el servidor valida movimiento y distancias).
- `shared/constants.js`: lo que usan servidor y cliente (lenguajes, tareas,
  velocidad, radios, longitud de nombres...).
- Constantes en `config.js` / `shared/constants.js`, nada de números mágicos.

## Red
- Mensajes JSON con campo `t` (tipo). Tamaño máximo limitado (`maxPayload`).
- Cliente envía posición ~20 veces/s; servidor reparte snapshots cada
  `TICK_MS` (50 ms). El cliente interpola a los demás (~100 ms de retraso).
- El servidor no se fía del cliente: valida velocidad, paredes y distancias.
- URL del WebSocket calculada desde `location` (ws/wss).
- Keepalive: ping cada 25 s. Reconexión con token (sessionStorage) durante 30 s.

## Estilo de código
- Archivos cortos (idealmente < 200 líneas), funciones cortas y simples.
- Comentarios breves en español. Texto de otros jugadores siempre con
  `textContent`, nunca `innerHTML`.
- Commits en español al terminar cada fase ("Fase N: ...").
- `referencias/` está en `.gitignore` (lleva marcas de Google Maps y logos).

## Estilo visual
- Paleta en `client/js/palette.js`: beige/crema (suelos), naranja madera
  (muebles), ladrillo y gris hormigón (paredes), toque de azul.
- Personajes dibujados por código: círculo con birrete + insignia del
  lenguaje (color + letras). Nada de logos oficiales.
- Oscuridad: radio de visión con degradado; el impostor ve más; los
  fantasmas lo ven todo.

## Fases
1. Estructura, servidor, sala, movimiento, mapa con estilo y oscuridad.
2. Despliegue en Render, reconexión y keepalive.
3. Elección de lenguaje, roles, banner, impostor.
4. Tareas, matar, cuerpos, reportes.
5. Reuniones, chat, votación, pantalla final.
6. Pulido: sonidos, animaciones, móvil, README completo.
7. Opcional: `cloudflare/` (Worker + Durable Objects) y conductos.

## Probar
- `npm run dev` y abrir varias pestañas en http://localhost:3000.
- `npm test` lanza los tests (node:test + clientes WebSocket simulados).
- `MIN_PLAYERS` en `server/config.js` se puede bajar a 2 para probar.

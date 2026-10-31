# Impostor en la ESIT

Juego multijugador por navegador tipo "impostor", ambientado en la Escuela
Superior de Ingeniería y Tecnología (Universidad de La Laguna). Cada jugador
es un lenguaje de programación con birrete; uno de ellos es el impostor.

> Proyecto en desarrollo por fases. Ahora mismo (fase 1): salas con código,
> movimiento por el mapa de la facultad con colisiones, varios jugadores
> viéndose entre sí y visión dinámica (las paredes tapan la vista).

## Ejecutar en local

Necesitas [Node.js](https://nodejs.org) 18 o superior.

```bash
npm install
npm start
```

Abre http://localhost:3000 en varias pestañas: crea una sala en una y únete
con el código de 4 letras en las demás. Para desarrollo, `npm run dev`
reinicia el servidor al cambiar archivos.

Al arrancar, el servidor imprime también las IPs de tu red local
(`http://192.168.x.x:3000`) para jugar desde el móvil en la misma wifi.

## Controles

| Acción | Teclado | Móvil |
| --- | --- | --- |
| Moverse | WASD o flechas | Joystick (toca la mitad izquierda) |

## Tests

```bash
npm test
```

Comprueban el mapa (todas las salas conectadas), la línea de visión y el
servidor con clientes WebSocket simulados.

## Estructura

```
server/   index.js (http + ws), rooms.js (salas), messages.js (validación),
          game.js (reglas, lógica pura), config.js (constantes)
client/   index.html, css/, js/ (main, network, input, map, render,
          mapview, vision, furniture, characters, players, ui, state, palette)
shared/   constants.js (lo que usan servidor y cliente)
tests/    tests con node:test y clientes simulados
```

## Licencia

[MIT](LICENSE)

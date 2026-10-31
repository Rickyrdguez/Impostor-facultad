# Impostor en la ESIT

Juego multijugador por navegador tipo "impostor", ambientado en la Escuela
Superior de Ingeniería y Tecnología (Universidad de La Laguna). Cada jugador
es un lenguaje de programación con birrete; uno de ellos es el impostor.

> Proyecto en desarrollo por fases. Ya se puede jugar una partida completa:
> lenguajes, roles, tareas, muertes, reuniones con chat y votación, y
> pantalla final. Falta el pulido (sonidos, animaciones, ajustes de móvil).

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

## Jugar online (desplegar en Render)

El servidor es un único proceso de Node que sirve la web y los WebSockets en
el mismo puerto, así que se puede desplegar gratis en
[Render](https://render.com) y jugar desde cualquier red (casa, datos
móviles, wifi de la facultad).

1. **Sube el proyecto a GitHub.** Crea un repositorio vacío en
   https://github.com/new (sin README ni .gitignore) y, en la carpeta del
   proyecto:

   ```bash
   git remote add origin https://github.com/TU_USUARIO/impostor-facultad.git
   git push -u origin main
   ```

2. **Crea el servicio en Render.** Entra en https://dashboard.render.com con
   tu cuenta de GitHub → **New** → **Web Service** → elige el repositorio.
   Rellena:
   - **Language / Runtime:** Node
   - **Branch:** main
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free

   (Alternativa: **New → Blueprint** usa el archivo `render.yaml` del
   repositorio y lo configura todo solo.)

3. **Espera al despliegue** (un par de minutos). Render te da una URL del tipo
   `https://impostor-facultad.onrender.com`.

4. **Comprueba que vive:** abre `https://TU-URL.onrender.com/health`; debe
   responder `ok`. Después abre la URL principal y crea una sala.

5. **Pasa el enlace a tus amigos.** Cada vez que hagas `git push`, Render
   vuelve a desplegar solo.

### Importante: el plan gratuito se duerme

Si nadie lo usa durante ~15 minutos, Render apaga el servidor. La siguiente
visita lo despierta, pero tarda entre 30 s y un minuto. **Abre el enlace (o
`/health`) unos minutos antes de jugar.** Al dormirse se pierden las salas
abiertas, nada más.

### Si se corta la conexión

Si a alguien se le bloquea la pantalla o cambia de wifi a datos, el juego
muestra "Reconectando…" y vuelve solo. Tiene 30 segundos para volver con su
mismo personaje; pasado ese tiempo sale de la sala. Recargar la página
también recupera la partida (dentro de esos 30 s y en la misma pestaña).

### Plan B: sin internet

- **Misma wifi:** ejecuta `npm start` en un portátil y abre en los móviles la
  IP que imprime el servidor (`http://192.168.x.x:3000`). Algunas redes, como
  la de la universidad, aíslan a los dispositivos entre sí; en ese caso usa
  la opción siguiente.
- **Hotspot del móvil:** activa la zona wifi en un móvil, conecta a ella el
  portátil y los demás móviles, y usa la IP que imprime el servidor.
- Si Windows pregunta por el firewall al arrancar Node, permite el acceso en
  redes privadas.

## Controles

| Acción | Teclado | Móvil |
| --- | --- | --- |
| Moverse | WASD o flechas | Joystick (toca la mitad izquierda) |
| Usar (tarea, botón de emergencia, trampilla, arreglar sabotaje) | E | **Usar** |
| Matar (impostor) | Q | **Matar** |
| Reportar un cuerpo | R | **Reportar** |
| Sabotear (impostor) | F | **Sabotear** |
| Ver el mapa | M | **Mapa** |

## Cómo se juega

- Entre 3 y 10 jugadores. El anfitrión crea la sala y pasa el código; cada
  uno elige su lenguaje en **Elegir lenguaje** y el anfitrión pulsa **Empezar**.
- Hay un impostor. Los demás son tripulantes y tienen 3 tareas repartidas por
  la facultad (las marca una flecha amarilla y salen en el mapa con la M).
  Cada tarea es un minijuego: despertar al que duerme en el sofá, fotocopiar
  apuntes, conectar los cables del proyector, pedir un barraquito…
  Si el equipo completa todas, ganan los tripulantes.
- El impostor mata con Q (cada 15 s) y deja un cuerpo. Quien lo encuentre lo
  reporta con R y empieza una reunión: 40 s para hablar por chat y votar.
  El más votado sale expulsado (con empate, nadie).
- Botón de emergencia en la mesa del gran pasillo: cada jugador puede
  convocar una reunión una vez por partida.
- El impostor puede moverse por trampillas (baños-laboratorio,
  secretaría-cafetería, relax-estudio, ascensor-clase-terraza) y sabotear:
  tirar el wifi (nadie ve sus tareas), apagar las luces (los tripulantes casi
  no ven) o provocar una fuga de radón (hay que cerrarla en el Laboratorio y
  en Secretaría antes de 45 s o gana el impostor).
- Ganan los tripulantes si expulsan al impostor o terminan las tareas. Gana
  el impostor si quedan tantos impostores como tripulantes o si el radón no
  se cierra a tiempo.
- Los muertos son fantasmas: atraviesan paredes, lo ven todo y, si eran
  tripulantes, pueden seguir haciendo tareas.
- Para probar con dos pestañas, baja `MIN_PLAYERS` en `server/config.js`.

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

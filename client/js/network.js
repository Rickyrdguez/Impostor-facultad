// Conexión WebSocket con el servidor, con detección de caídas y reconexión.

const SILENCE_MS = 4000; // sin mensajes del servidor durante este tiempo = conexión muerta
const RETRY_BASE_MS = 500; // espera inicial entre reintentos (se va duplicando)
const RETRY_MAX_MS = 5000;

const handlers = {};
let ws = null;
let lastMessageAt = 0;
let retryDelay = RETRY_BASE_MS;
let retryTimer = null;
let wantConnection = false; // true mientras estamos en una sala

// ws:// en http y wss:// en https, mismo host que la página.
function socketUrl() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${location.host}`;
}

// Registra la función que atiende un tipo de mensaje (o 'open' / 'lost').
export function on(type, fn) {
  handlers[type] = fn;
}

function emit(type, data) {
  if (handlers[type]) handlers[type](data);
}

function onMessage(ev) {
  lastMessageAt = Date.now();
  let msg;
  try {
    msg = JSON.parse(ev.data);
  } catch {
    return;
  }
  if (msg && typeof msg.t === 'string') emit(msg.t, msg);
}

function onClose(socket) {
  if (socket !== ws) return; // un socket viejo ya sustituido
  ws = null;
  if (wantConnection) {
    emit('lost');
    scheduleRetry();
  }
}

export function connect() {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(socketUrl());
    ws = socket;
    socket.onopen = () => {
      lastMessageAt = Date.now();
      retryDelay = RETRY_BASE_MS;
      resolve();
    };
    socket.onerror = () => reject(new Error('No se pudo conectar con el servidor.'));
    socket.onclose = () => onClose(socket);
    socket.onmessage = onMessage;
  });
}

// Reintenta con espera creciente; al conectar avisa con 'open'.
function scheduleRetry() {
  clearTimeout(retryTimer);
  retryTimer = setTimeout(async () => {
    if (!wantConnection) return;
    try {
      await connect();
      emit('open');
    } catch {
      retryDelay = Math.min(retryDelay * 2, RETRY_MAX_MS);
      if (!ws || ws.readyState !== WebSocket.OPEN) scheduleRetry();
    }
  }, retryDelay);
}

// Mientras estemos en una sala, la conexión se mantiene y se recupera sola.
export function keepConnected(value) {
  wantConnection = value;
  if (!value) clearTimeout(retryTimer);
}

export function isOpen() {
  return ws && ws.readyState === WebSocket.OPEN;
}

export function send(msg) {
  if (isOpen()) ws.send(JSON.stringify(msg));
}

export function close() {
  if (ws) ws.close();
}

// El servidor manda estado 20 veces/s: si se calla, la conexión está muerta
// (por ejemplo al cambiar de wifi a datos). Se fuerza el cierre para reconectar.
function watchdog() {
  if (isOpen() && wantConnection && Date.now() - lastMessageAt > SILENCE_MS) {
    const dead = ws;
    onClose(dead);
    dead.close();
  }
}

setInterval(watchdog, SILENCE_MS / 4);
addEventListener('online', watchdog);

// Conexión WebSocket con el servidor.

const handlers = {};
let ws = null;

// ws:// en http y wss:// en https, mismo host que la página.
function socketUrl() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${location.host}`;
}

// Registra la función que atiende un tipo de mensaje del servidor.
export function on(type, fn) {
  handlers[type] = fn;
}

function emit(type, data) {
  if (handlers[type]) handlers[type](data);
}

export function connect() {
  return new Promise((resolve, reject) => {
    ws = new WebSocket(socketUrl());
    ws.onopen = () => resolve();
    ws.onerror = () => reject(new Error('No se pudo conectar con el servidor'));
    ws.onclose = () => emit('close');
    ws.onmessage = (ev) => {
      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }
      if (msg && typeof msg.t === 'string') emit(msg.t, msg);
    };
  });
}

export function isOpen() {
  return ws && ws.readyState === WebSocket.OPEN;
}

export function send(msg) {
  if (isOpen()) ws.send(JSON.stringify(msg));
}

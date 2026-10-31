// Cliente WebSocket simulado para los tests.

import WebSocket from 'ws';
import { startServer } from '../../server/index.js';

// Arranca el servidor en un puerto libre.
export async function startTestServer() {
  const { server, wss } = await startServer(0, '127.0.0.1');
  const port = server.address().port;
  const close = () =>
    new Promise((resolve) => {
      for (const ws of wss.clients) ws.terminate();
      wss.close();
      server.close(resolve);
    });
  return { port, close };
}

export class FakeClient {
  constructor(port) {
    this.port = port;
    this.messages = [];
    this.waiters = [];
  }

  connect() {
    this.ws = new WebSocket(`ws://127.0.0.1:${this.port}`);
    this.ws.on('message', (data) => this.onMessage(JSON.parse(data.toString())));
    return new Promise((resolve, reject) => {
      this.ws.once('open', resolve);
      this.ws.once('error', reject);
    });
  }

  onMessage(msg) {
    const waiter = this.waiters.find((w) => w.match(msg));
    if (!waiter) return this.messages.push(msg);
    this.waiters.splice(this.waiters.indexOf(waiter), 1);
    waiter.resolve(msg);
  }

  send(msg) {
    this.ws.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }

  // Espera al siguiente mensaje que cumpla la condición (o del tipo dado).
  waitFor(match, timeoutMs = 2000) {
    const fn = typeof match === 'string' ? (m) => m.t === match : match;
    // Primero mira los mensajes ya recibidos y los consume.
    const index = this.messages.findIndex(fn);
    if (index >= 0) return Promise.resolve(this.messages.splice(0, index + 1).pop());
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`timeout esperando ${match}`)), timeoutMs);
      this.waiters.push({ match: fn, resolve: (m) => (clearTimeout(timer), resolve(m)) });
    });
  }

  close() {
    this.ws.close();
  }
}

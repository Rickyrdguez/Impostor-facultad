// Arranque: servidor HTTP (web + /health) y WebSocket en el mismo puerto.

import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { WebSocketServer } from 'ws';
import { handleMessage } from './messages.js';
import * as rooms from './rooms.js';
import { MAX_MESSAGE_BYTES, PING_INTERVAL_MS, TICK_MS } from './config.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLIENT_DIR = path.join(ROOT, 'client');
const SHARED_DIR = path.join(ROOT, 'shared');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
};

// Traduce la URL a un archivo de client/ o shared/, sin salirse de ellos.
function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]);
  const inShared = clean.startsWith('/shared/');
  const base = inShared ? SHARED_DIR : CLIENT_DIR;
  const rel = inShared ? clean.slice('/shared/'.length) : clean;
  const file = path.normalize(path.join(base, rel === '/' || rel === '' ? 'index.html' : rel));
  return file.startsWith(base + path.sep) ? file : null;
}

async function onRequest(req, res) {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('ok');
  }
  try {
    const file = resolveFile(req.url);
    if (!file) throw new Error('ruta no válida');
    const body = await readFile(file);
    const type = TYPES[path.extname(file)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('No encontrado');
  }
}

// Ping periódico: las conexiones que no responden se cierran.
function startKeepalive(wss) {
  return setInterval(() => {
    for (const ws of wss.clients) {
      if (!ws.isAlive) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, PING_INTERVAL_MS);
}

function onConnection(ws) {
  ws.isAlive = true;
  ws.on('pong', () => (ws.isAlive = true));
  ws.on('message', (data) => handleMessage(ws, data));
  ws.on('close', () => rooms.drop(ws));
  ws.on('error', () => ws.terminate());
}

export function startServer(port, host = '0.0.0.0') {
  const server = http.createServer(onRequest);
  const wss = new WebSocketServer({ server, maxPayload: MAX_MESSAGE_BYTES });
  wss.on('connection', onConnection);
  const timers = [startKeepalive(wss), setInterval(rooms.tickAll, TICK_MS)];
  server.on('close', () => timers.forEach(clearInterval));
  return new Promise((resolve) => server.listen(port, host, () => resolve({ server, wss })));
}

function localIps() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => i.address);
}

// Solo arranca solo si se ejecuta directamente (no al importarlo en tests).
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const port = Number(process.env.PORT) || 3000;
  await startServer(port);
  console.log(`Servidor listo en http://localhost:${port}`);
  for (const ip of localIps()) console.log(`  En tu red local: http://${ip}:${port}`);
}

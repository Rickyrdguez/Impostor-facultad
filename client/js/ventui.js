// Panel del impostor dentro de una trampilla: saltar a otra o salir.

import { state } from './state.js';
import * as net from './network.js';
import { connectedVents, ventById } from './places.js';

const $ = (id) => document.getElementById(id);
const els = {
  panel: $('vent-panel'),
  room: $('vent-room'),
  links: $('vent-links'),
  exit: $('btn-vent-exit'),
};

export function bindVentPanel() {
  els.exit.addEventListener('click', () => net.send({ t: 'vent' }));
}

// Llega 'vent' del servidor: entra, cambia de trampilla o sale.
export function onVent(id) {
  state.vent = id;
  state.hold = null;
  els.panel.classList.toggle('hidden', !id);
  if (!id) return;
  els.room.textContent = ventById(id).room;
  const buttons = connectedVents(id).map((v) => {
    const btn = document.createElement('button');
    btn.className = 'btn small secondary';
    btn.textContent = `→ ${v.room}`;
    btn.addEventListener('click', () => net.send({ t: 'vent-move', to: v.id }));
    return btn;
  });
  els.links.replaceChildren(...buttons);
}

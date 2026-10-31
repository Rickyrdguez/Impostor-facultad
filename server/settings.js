// Ajustes de la sala: solo el anfitrión los cambia, y solo en la sala de espera. Lógica pura.

import { defaultSettings, validSetting } from '../shared/settings.js';
import { roomInfo, toAll } from './info.js';

const MS = 1000;

export function createSettings() {
  return defaultSettings();
}

export function changeSetting(room, id, msg) {
  if (room.phase !== 'lobby' || room.hostId !== id) return [];
  const value = validSetting(msg.id, msg.value);
  if (value === null) return [];
  room.settings[msg.id] = value;
  return [toAll(roomInfo(room))];
}

// Atajos para que las reglas lean los ajustes en las unidades que usan.
export const killCooldownMs = (room) => room.settings.killCooldown * MS;
export const killRange = (room) => room.settings.killDistance;
export const meetingMs = (room) => room.settings.meetingTime * MS;
export const emergencyCooldownMs = (room) => room.settings.emergencyCooldown * MS;

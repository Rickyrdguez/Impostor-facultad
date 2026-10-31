// Efectos de sonido generados con Web Audio (sin archivos de audio).

const MUTE_KEY = 'impostor-silencio';
const MASTER_VOLUME = 0.5;

let ctx = null;
let master = null;
let muted = false;
try {
  muted = localStorage.getItem(MUTE_KEY) === '1';
} catch {}

// El navegador solo deja sonar audio tras un gesto del usuario.
function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = MASTER_VOLUME;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

addEventListener('pointerdown', audio, { once: true });
addEventListener('keydown', audio, { once: true });

// Una nota: frecuencia, forma de onda, duración (s), volumen, deslizamiento y retraso.
function tone({ freq, type = 'sine', dur = 0.15, vol = 0.25, slide = 0, delay = 0 }) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.linearRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

const notes = (list, dur = 0.12, type = 'triangle') =>
  list.map((freq, i) => ({ freq, dur, type, delay: i * dur * 0.9 }));

const SOUNDS = {
  click: [{ freq: 520, type: 'square', dur: 0.04, vol: 0.08 }],
  task: notes([660, 880, 1320], 0.09),
  vote: [{ freq: 440, type: 'square', dur: 0.06, vol: 0.12 }, { freq: 660, type: 'square', dur: 0.08, vol: 0.12, delay: 0.06 }],
  tick: [{ freq: 1100, type: 'sine', dur: 0.05, vol: 0.12 }],
  kill: [
    { freq: 320, type: 'sawtooth', dur: 0.35, vol: 0.3, slide: -250 },
    { freq: 90, type: 'square', dur: 0.4, vol: 0.2, delay: 0.05 },
  ],
  meeting: [...notes([880, 660, 880, 660, 880, 660], 0.14, 'square')].map((n) => ({ ...n, vol: 0.15 })),
  alarm: [
    { freq: 500, type: 'sawtooth', dur: 0.45, vol: 0.15, slide: 400 },
    { freq: 500, type: 'sawtooth', dur: 0.45, vol: 0.15, slide: 400, delay: 0.5 },
  ],
  beep: [{ freq: 760, type: 'square', dur: 0.08, vol: 0.06 }],
  eject: [{ freq: 600, type: 'sine', dur: 1.4, vol: 0.2, slide: -500 }],
  vent: [{ freq: 140, type: 'square', dur: 0.12, vol: 0.18, slide: -60 }],
  crew: notes([523, 659, 784], 0.16),
  impostor: notes([220, 207, 196], 0.28, 'sawtooth').map((n) => ({ ...n, vol: 0.18 })),
  win: notes([523, 659, 784, 1047], 0.15),
  lose: notes([392, 330, 262, 196], 0.2, 'sawtooth').map((n) => ({ ...n, vol: 0.15 })),
};

export function play(name) {
  if (muted || !SOUNDS[name]) return;
  for (const n of SOUNDS[name]) tone(n);
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {}
  return muted;
}

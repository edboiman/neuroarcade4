// Tiny WebAudio helper. Creates the audio context lazily after a user gesture,
// and suspends it shortly after sound stops so it does not keep the audio hardware awake.
import { store } from './store.js';

let ac = null;
let idleTimer = 0;

function ctx() {
  if (!store.settings().sound) return null;
  try {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ac = new AC();
    }
    if (ac.state === 'suspended') ac.resume();
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      try {
        ac.suspend();
      } catch {
        /* ignore */
      }
    }, 4000);
    return ac;
  } catch {
    return null;
  }
}

export function beep(freq = 440, ms = 120, vol = 0.12, type = 'sine', delayMs = 0) {
  const a = ctx();
  if (!a) return 0;
  const t0 = a.currentTime + delayMs / 1000;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + ms / 1000);
  o.connect(g).connect(a.destination);
  o.start(t0);
  o.stop(t0 + ms / 1000 + 0.05);
  return ms;
}

export const good = () => {
  beep(660, 90, 0.1);
  beep(880, 130, 0.1, 'sine', 90);
};
export const bad = () => beep(180, 220, 0.12, 'triangle');
export const tick = () => beep(520, 35, 0.05, 'square');

// Morse: dit = 1 unit, dah = 3 units, gap between symbols = 1 unit.
export function playMorse(code, unitMs = 90) {
  let t = 0;
  for (const ch of code) {
    const len = ch === '.' ? unitMs : unitMs * 3;
    beep(620, len, 0.14, 'sine', t);
    t += len + unitMs;
  }
  return t;
}

export function midiToFreq(m) {
  return 440 * Math.pow(2, (m - 69) / 12);
}

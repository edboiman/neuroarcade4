import { mulberry32 } from './games/rng.js';
const BAD = new Set(['__proto__', 'prototype', 'constructor']);
function encode(v, depth = 0) {
  if (depth > 14) throw Error('Save too deep');
  if (typeof v === 'function') return v.getState ? { $rng: v.getState() } : null;
  if (v instanceof Uint8Array) return { $bytes: Array.from(v) };
  if (v instanceof Set) return { $set: [...v].map(x => encode(x, depth + 1)) };
  if (Array.isArray(v)) return v.map(x => encode(x, depth + 1));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).filter(([k]) => k !== 'events' && !BAD.has(k)).map(([k,x]) => [k, encode(x, depth + 1)]));
  if (typeof v === 'number' && !Number.isFinite(v)) throw Error('Bad number');
  return v;
}
function decode(v, depth = 0) {
  if (depth > 14) throw Error('Bad save');
  if (typeof v === 'number' && (!Number.isFinite(v) || Math.abs(v) > 1e15)) throw Error('Bad number');
  if (typeof v === 'string' && v.length > 2000) throw Error('Bad text');
  if (!v || typeof v !== 'object') return v;
  if (Array.isArray(v)) { if (v.length > 600) throw Error('Bad array'); return v.map(x => decode(x, depth + 1)); }
  const keys = Object.keys(v);
  if (keys.length > 600 || keys.some(k => BAD.has(k))) throw Error('Bad keys');
  if (Object.hasOwn(v, '$rng')) { if (!Number.isInteger(v.$rng)) throw Error('Bad generator'); return mulberry32(v.$rng); }
  if (Object.hasOwn(v, '$bytes')) { if (!Array.isArray(v.$bytes) || v.$bytes.length > 600 || v.$bytes.some(x => !Number.isInteger(x) || x < 0 || x > 255)) throw Error('Bad tiles'); return Uint8Array.from(v.$bytes); }
  if (Object.hasOwn(v, '$set')) return new Set(decode(v.$set, depth + 1));
  return Object.fromEntries(keys.map(k => [k, decode(v[k], depth + 1)]));
}
export function snapshot(state, meta = {}) { return { version: 2, saved: Date.now(), state: encode(state), meta: encode(meta) }; }
export function restore(raw, validate) {
  try {
    if (!raw || raw.version !== 2 || !raw.state || !Number.isFinite(raw.saved)) return null;
    const state = decode(raw.state); state.events = [];
    if (state.over || !validate(state)) return null;
    return { state, meta: decode(raw.meta || {}) };
  } catch { return null; }
}
export function saveRun(store, id, state, meta) { if (!state || state.over) return; try { store.saveGame(id, snapshot(state, meta)); } catch { /* incomplete or full storage */ } }
export const saneInt = (x, lo, hi) => Number.isInteger(x) && x >= lo && x <= hi;

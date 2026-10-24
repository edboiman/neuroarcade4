// Local-only storage. Everything lives in this browser's localStorage; nothing is ever sent anywhere.
// All data read back (including imported files) is validated and clamped before use.
import { GAME_IDS, STORED_GAME_IDS } from './catalog.js';
import {emptyJournal,cleanJournal,recordJournal} from './games/cinderpath-journal.js';

const KEY = 'neuroarcade.v1';
const SAVE_PREFIX = 'neuroarcade.v1.save.';
const MAX_SESSIONS = 1500;
const MAX_CHECKINS = 300;
const MAX_SAVE_BYTES = 200000;
const MAX_IMPORT_BYTES = 1500000;
const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const num = (x, min, max, def) => {
  x = Number(x);
  return Number.isFinite(x) ? Math.min(max, Math.max(min, x)) : def;
};
const bool = (x, def) => (typeof x === 'boolean' ? x : def);
const safeKey = (k) => typeof k === 'string' && /^[a-z0-9_.-]{1,32}$/.test(k) && !BAD_KEYS.has(k);

export function defaults() {
  return {
    v: 1,
    created: Date.now(),
    settings: { saver: true, sound: true, haptics: true, reduce: false, largeText: false, reminders: false },
    sessions: [],
    checkins: [],
    skills: {},
    prefs: {},
    seenWeek: 0,
    onboarded: false,
    cinderpath: emptyJournal(),
  };
}

export function sanitize(raw) {
  const d = defaults();
  if (!raw || typeof raw !== 'object') return d;
  d.created = num(raw.created, 0, 4e12, d.created);
  d.seenWeek = num(raw.seenWeek, 0, 4e12, 0);
  d.onboarded = bool(raw.onboarded, false);
  d.cinderpath = cleanJournal(raw.cinderpath);
  const st = raw.settings && typeof raw.settings === 'object' ? raw.settings : {};
  d.settings = {
    saver: bool(st.saver, true),
    sound: bool(st.sound, true),
    haptics: bool(st.haptics, true),
    reduce: bool(st.reduce, false),
    largeText: bool(st.largeText, false),
    reminders: bool(st.reminders, false),
  };
  if (Array.isArray(raw.sessions)) {
    for (const s of raw.sessions.slice(-MAX_SESSIONS * 2)) {
      if (!s || typeof s !== 'object' || !STORED_GAME_IDS.includes(s.g)) continue;
      d.sessions.push({
        g: s.g,
        t: num(s.t, 0, 4e12, 0),
        d: num(s.d, 0, 86400, 0),
        s: num(s.s, 0, 1e9, 0),
        l: num(s.l, 0, 999, 0),
        a: s.a == null ? null : num(s.a, 0, 1, 0),
        c: bool(s.c, false),
        mode: typeof s.mode === 'string' && /^[a-z0-9_-]{1,64}$/.test(s.mode) ? s.mode : 'standard',
      });
    }
    d.sessions.sort((a, b) => a.t - b.t);
    d.sessions = d.sessions.slice(-MAX_SESSIONS);
  }
  if (Array.isArray(raw.checkins)) {
    for (const c of raw.checkins.slice(-MAX_CHECKINS * 2)) {
      if (!c || typeof c !== 'object') continue;
      d.checkins.push({
        t: num(c.t, 0, 4e12, 0),
        rt: c.rt == null ? null : num(c.rt, 50, 5000, null),
        sp: c.sp == null ? null : num(c.sp, 0, 30, null),
      });
    }
    d.checkins.sort((a, b) => a.t - b.t);
    d.checkins = d.checkins.slice(-MAX_CHECKINS);
  }
  if (raw.skills && typeof raw.skills === 'object') {
    for (const [id, sk] of Object.entries(raw.skills).slice(0, 40)) {
      if (!safeKey(id) || !sk || typeof sk !== 'object') continue;
      const box = {};
      if (sk.box && typeof sk.box === 'object') {
        for (const [k, v] of Object.entries(sk.box).slice(0, 600)) {
          if (safeKey(k)) box[k] = Math.round(num(v, 0, 4, 0));
        }
      }
      const reviews = {};
      if (sk.reviews && typeof sk.reviews === 'object') for (const [k, v] of Object.entries(sk.reviews).slice(0, 600)) {
        if (safeKey(k) && v && typeof v === 'object') reviews[k] = { due: num(v.due, 0, 4e12, 0), interval: num(v.interval, 0, 365, 0), last: num(v.last, 0, 4e12, 0) };
      }
      d.skills[id] = { rung: Math.round(num(sk.rung, 1, 20, 1)), box, reviews };
    }
  }
  if (raw.prefs && typeof raw.prefs === 'object') {
    for (const [id, p] of Object.entries(raw.prefs).slice(0, 20)) {
      if (!safeKey(id) || !p || typeof p !== 'object') continue;
      const out = {};
      for (const [k, v] of Object.entries(p).slice(0, 20)) {
        if (safeKey(k)) out[k] = num(v, -1e9, 1e9, 0);
      }
      d.prefs[id] = out;
    }
  }
  return d;
}

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

let mem = sanitize(read(KEY));
let persistFailed = false;
const volatileSaves = new Map();
const failedSaves = new Set();
const listeners = new Set();

function write() {
  try {
    localStorage.setItem(KEY, JSON.stringify(mem));
    persistFailed = false;
  } catch {
    persistFailed = true; // private mode or storage full: keep running in memory
  }
  for (const fn of listeners) fn();
}

export const store = {
  get data() {
    return mem;
  },
  get persistFailed() {
    return persistFailed || failedSaves.size > 0;
  },
  onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  settings() {
    return mem.settings;
  },
  setSetting(k, v) {
    if (k in mem.settings && typeof v === 'boolean') {
      mem.settings[k] = v;
      write();
    }
  },
  sessions() {
    return mem.sessions;
  },
  addSession(s) {
    if (!GAME_IDS.includes(s.g)) return;
    mem.sessions.push({
      g: s.g,
      t: num(s.t, 0, 4e12, Date.now()),
      d: num(s.d, 0, 86400, 0),
      s: Math.round(num(s.s, 0, 1e9, 0)),
      l: Math.round(num(s.l, 0, 999, 0)),
      a: s.a == null ? null : num(s.a, 0, 1, 0),
      c: !!s.c,
      mode: typeof s.mode === 'string' && /^[a-z0-9_-]{1,64}$/.test(s.mode) ? s.mode : 'standard',
    });
    if (mem.sessions.length > MAX_SESSIONS) mem.sessions.splice(0, mem.sessions.length - MAX_SESSIONS);
    write();
  },
  checkins() {
    return mem.checkins;
  },
  addCheckin(c) {
    mem.checkins.push({
      t: Date.now(),
      rt: c.rt == null ? null : num(c.rt, 50, 5000, null),
      sp: c.sp == null ? null : num(c.sp, 0, 30, null),
    });
    if (mem.checkins.length > MAX_CHECKINS) mem.checkins.shift();
    write();
  },
  skill(id) {
    if (!safeKey(id)) return { rung: 1, box: {} };
    if (!mem.skills[id]) mem.skills[id] = { rung: 1, box: {}, reviews: {} };
    return mem.skills[id];
  },
  saveSkills() {
    write();
  },
  pref(id, key, def) {
    const p = mem.prefs[id];
    return p && key in p ? p[key] : def;
  },
  setPref(id, key, val) {
    if (!safeKey(id) || !safeKey(key)) return;
    if (!mem.prefs[id]) mem.prefs[id] = {};
    mem.prefs[id][key] = num(val, -1e9, 1e9, 0);
    write();
  },
  markSeenWeek(wk) {
    mem.seenWeek = wk;
    mem.onboarded = true;
    write();
  },
  cinderJournal() { return cleanJournal(mem.cinderpath); },
  recordCinderpath(run) { mem.cinderpath = recordJournal(mem.cinderpath,run); write(); },
  // Resumable game saves are kept apart from the main record.
  saveGame(id, obj) {
    if (!safeKey(id)) return false;
    const wasFailed = failedSaves.has(id);
    try {
      const txt = JSON.stringify(obj);
      if (txt.length > MAX_SAVE_BYTES) return false;
      // Keep a bounded in-memory copy if device storage rejects this write.
      volatileSaves.set(id, JSON.parse(txt));
      localStorage.setItem(SAVE_PREFIX + id, txt);
      volatileSaves.delete(id);
      failedSaves.delete(id);
      if (wasFailed) for (const fn of listeners) fn();
      return true;
    } catch {
      failedSaves.add(id);
      if (!wasFailed) for (const fn of listeners) fn();
      return false;
    }
  },
  loadGame(id) {
    if (!STORED_GAME_IDS.includes(id)) return null;
    const raw = volatileSaves.has(id) ? volatileSaves.get(id) : read(SAVE_PREFIX + id);
    try { return JSON.stringify(raw).length <= MAX_SAVE_BYTES ? raw : null; } catch { return null; }
  },
  clearGame(id) {
    volatileSaves.delete(id);
    failedSaves.delete(id);
    try {
      localStorage.removeItem(SAVE_PREFIX + id);
    } catch {
      /* ignore */
    }
  },
  exportText() {
    const saves = {};
    for (const id of STORED_GAME_IDS) { const run = this.loadGame(id); if (run) saves[id] = run; }
    return JSON.stringify({ app: 'neuro-arcade', format: 2, exported: new Date().toISOString(), data: mem, saves }, null, 1);
  },
  importText(text) {
    if (typeof text !== 'string' || text.length > MAX_IMPORT_BYTES) return { ok: false, error: 'That file is too large to be a Neuro Arcade backup.' };
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { ok: false, error: 'That file is not valid backup data.' };
    }
    if (!parsed || parsed.app !== 'neuro-arcade' || !parsed.data) return { ok: false, error: 'That file is not a Neuro Arcade backup.' };
    mem = sanitize(parsed.data);
    for (const id of STORED_GAME_IDS) { this.clearGame(id); if (parsed.saves && Object.hasOwn(parsed.saves, id)) this.saveGame(id, parsed.saves[id]); }
    write();
    return { ok: true, sessions: mem.sessions.length };
  },
  reset() {
    mem = defaults();
    volatileSaves.clear();
    failedSaves.clear();
    persistFailed = false;
    try {
      localStorage.removeItem(KEY);
      for (const g of STORED_GAME_IDS) localStorage.removeItem(SAVE_PREFIX + g);
    } catch {
      /* ignore */
    }
    for (const fn of listeners) fn();
  },
  async requestPersistence() {
    try {
      if (navigator.storage && navigator.storage.persist) return await navigator.storage.persist();
    } catch {
      /* ignore */
    }
    return false;
  },
};

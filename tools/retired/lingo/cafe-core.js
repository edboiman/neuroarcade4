// Lingo Café rules engine. Pure functions, no DOM. Customers order in the language you are learning;
// you tap the items to serve them. What you get right or wrong feeds the spaced-repetition boxes.
import { itemById, sentence, english, englishLine, frameCount } from './cafe-data.js';
import { sceneById, PACES } from './lingo-scenes.js';
import { mulberry32, shuffle, weighted } from '../../../js/games/rng.js';
import { reviewOrder } from './reviews.js';

export const TABLES = 4;
export const HEARTS = 5;
export const TRAY_MAX = 12;
export const MAX_BOX = 4;
export const FACES = ['👩', '👨', '👵', '👴', '🧑', '👧', '🧔', '👱'];

export const customersForShift = (shift) => 10 + Math.min(shift, 8);
export const maxItemsFor = (shift) => (shift < 3 ? 1 : shift < 6 ? 2 : 3);
export const quantitiesOn = (shift) => shift >= 3;

// Which words to bring in this shift. box maps item id to 0..4 for words already introduced.
// Words learned in one scenario count in every scenario that uses them.
export function planNew(box, shift, sceneId = 'cafe') {
  const want = shift <= 1 ? 4 : 3;
  return sceneById(sceneId).items.filter((id) => !(id in box)).slice(0, want);
}

// The words on the tray: the new ones plus the weakest review words, up to TRAY_MAX.
export function buildTray(box, newIds, sceneId = 'cafe', reviews = null, now = Date.now()) {
  const order = sceneById(sceneId).items;
  const pos = (id) => order.indexOf(id);
  const known = Object.keys(box).filter((id) => order.includes(id) && !newIds.includes(id));
  known.sort((a, b) => box[a] - box[b] || pos(a) - pos(b));
  const room = Math.max(0, TRAY_MAX - newIds.length);
  const pick = (reviews ? reviewOrder(known, box, reviews, now) : known).slice(0, room);
  const ids = [...newIds, ...pick];
  // keep the tray in a stable order so buttons do not jump around between shifts
  return ids.sort((a, b) => pos(a) - pos(b));
}

// featured: the words taught in this shift's lesson. They are treated as new today, but keep the box the lesson gave them.
export function createShift({ lang = 'es', box = {}, shift = 1, seed = 1, featured = null, scene = 'cafe', pace = 'normal', reviews = null, now = Date.now() } = {}) {
  const rnd = mulberry32(seed);
  const sc = sceneById(scene);
  const newIds = featured ? featured.filter((id) => itemById(id) && sc.items.includes(id)) : planNew(box, shift, sc.id);
  const b = { ...box };
  for (const id of newIds) b[id] = b[id] ?? 0;
  const tray = buildTray(b, newIds, sc.id, reviews, now);
  const total = customersForShift(shift);
  return {
    seed,
    scene: sc.id,
    pace: PACES.find((p) => p.id === pace) || PACES[1],
    lang,
    shift,
    rnd,
    box: b,
    newIds,
    tray,
    total,
    spawned: 0,
    resolved: 0,
    served: 0,
    t: 0,
    nextArrival: 0.8,
    slots: Array.from({ length: TABLES }, () => null),
    selected: -1,
    score: 0,
    combo: 0,
    bestCombo: 0,
    hearts: HEARTS,
    mustFeature: newIds.slice(),
    rushAt: Math.floor(total * 0.45),
    rushLeft: 0,
    nextId: 1,
    over: false,
    reason: null,
    events: [],
    stats: {}, // per word: { hit, miss }
    assist: false,
  };
}

// ----- orders -----
function wordWeight(boxVal, isNew) {
  if (isNew) return 4;
  return [3, 3, 2, 1.4, 1][boxVal] ?? 1;
}

export function makeOrder(s) {
  const maxItems = Math.min(maxItemsFor(s.shift), s.tray.length);
  const nItems = 1 + Math.floor(s.rnd() * maxItems);
  const chosen = [];
  if (s.mustFeature.length) chosen.push(s.mustFeature.shift());
  while (chosen.length < nItems) {
    const pool = s.tray.filter((id) => !chosen.includes(id)).map((id) => [id, wordWeight(s.box[id], s.newIds.includes(id))]);
    if (!pool.length) break;
    chosen.push(weighted(s.rnd, pool));
  }
  const order = chosen.map((id) => {
    let qty = 1;
    if (quantitiesOn(s.shift) && s.rnd() < (s.shift >= 6 ? 0.3 : 0.22)) qty = s.shift >= 6 && s.rnd() < 0.35 ? 3 : 2;
    return { id, qty };
  });
  // never ask for more than 4 things at once
  let sum = order.reduce((n, o) => n + o.qty, 0);
  for (let i = order.length - 1; i >= 0 && sum > 4; i--) {
    while (order[i].qty > 1 && sum > 4) {
      order[i].qty--;
      sum--;
    }
  }
  return order;
}

export const orderTotal = (order) => order.reduce((n, o) => n + o.qty, 0);

function seat(s, slot) {
  const order = makeOrder(s);
  const qty = orderTotal(order);
  const vip = s.spawned > 3 && s.rnd() < 0.12;
  const max = Math.max(9, (24 + qty * 4.5 - Math.min(s.shift, 12) * 0.6) * (vip ? 0.7 : 1) * s.pace.patience);
  const c = {
    id: s.nextId++,
    slot,
    face: vip ? '🤵' : FACES[Math.floor(s.rnd() * FACES.length)],
    look: Math.floor(s.rnd() * 1e9), // seed for the drawn avatar
    vip,
    order,
    qty,
    frame: Math.floor(s.rnd() * frameCount(s.scene, s.lang)),
    patience: max,
    max,
    plate: [],
    state: 'waiting', // waiting | served | left
    leaveIn: 0,
    wrong: 0,
  };
  c.text = sentence(s.lang, order, c.frame, s.scene);
  c.en = english(order);
  c.enLine = englishLine(order, c.frame, s.scene);
  s.slots[slot] = c;
  s.spawned++;
  s.events.push({ type: 'arrive', slot, vip });
  if (s.selected < 0) select(s, slot);
  return c;
}

const waiting = (s) => s.slots.filter((c) => c && c.state === 'waiting');

export function select(s, slot) {
  const c = s.slots[slot];
  if (c && c.state === 'waiting') s.selected = slot;
}

function selectMostUrgent(s) {
  const w = waiting(s).sort((a, b) => a.patience / a.max - b.patience / b.max);
  s.selected = w.length ? w[0].slot : -1;
}

// ----- the clock -----
export function tick(s, dt) {
  if (s.over) return;
  dt = Math.min(dt, 0.25);
  s.t += dt;
  // arrivals
  if (s.spawned < s.total && s.t >= s.nextArrival) {
    const free = s.slots.findIndex((c) => !c);
    if (free >= 0) {
      seat(s, free);
      let gap = Math.max(3.2, 6.6 - s.shift * 0.28) * (0.75 + s.rnd() * 0.5) * s.pace.gap;
      if (s.spawned === s.rushAt) {
        s.rushLeft = 3;
        s.events.push({ type: 'rush' });
      }
      if (s.rushLeft > 0) {
        s.rushLeft--;
        gap = 1.8;
      }
      s.nextArrival = s.t + gap;
    } else s.nextArrival = s.t + 0.5;
  }
  for (const c of s.slots) {
    if (!c) continue;
    if (c.state === 'waiting') {
      if (s.pace.id !== 'practice') c.patience -= dt;
      if (c.patience <= 0) leave(s, c);
    } else {
      c.leaveIn -= dt;
      if (c.leaveIn <= 0) {
        s.slots[c.slot] = null;
        if (s.selected === c.slot) selectMostUrgent(s);
      }
    }
  }
  if (s.selected < 0 || !s.slots[s.selected] || s.slots[s.selected].state !== 'waiting') selectMostUrgent(s);
  if (s.hearts <= 0) {
    s.over = true;
    s.reason = 'closed';
    s.events.push({ type: 'over' });
  } else if (s.resolved >= s.total) {
    s.over = true;
    s.reason = 'done';
    s.score += s.hearts * 50;
    s.events.push({ type: 'over' });
  }
}

function bump(s, id, d) {
  const v = Math.max(0, Math.min(MAX_BOX, (s.box[id] ?? 0) + d));
  s.box[id] = v;
}
function stat(s, id, key) {
  (s.stats[id] ||= { hit: 0, miss: 0 })[key]++;
}

function leave(s, c) {
  c.state = 'left';
  c.leaveIn = 1.4;
  s.hearts--;
  s.resolved++;
  s.combo = 0;
  for (const o of c.order) {
    bump(s, o.id, -1);
    stat(s, o.id, 'miss');
  }
  s.events.push({ type: 'left', slot: c.slot });
}

// ----- serving -----
export function addToPlate(s, id) {
  if (s.over) return null;
  const c = s.slots[s.selected];
  if (!c || c.state !== 'waiting' || !s.tray.includes(id)) return null;
  if (c.plate.length >= c.qty) return null;
  c.plate.push(id);
  s.events.push({ type: 'plate', slot: c.slot });
  if (c.plate.length === c.qty) return evaluate(s, c);
  return { type: 'partial' };
}

export function clearPlate(s) {
  const c = s.slots[s.selected];
  if (c && c.state === 'waiting') c.plate = [];
}

function evaluate(s, c) {
  const want = {};
  for (const o of c.order) want[o.id] = o.qty;
  const got = {};
  for (const id of c.plate) got[id] = (got[id] || 0) + 1;
  const ok = Object.keys(want).every((id) => got[id] === want[id]) && Object.keys(got).every((id) => want[id] === got[id]);
  if (ok) {
    const frac = Math.max(0, c.patience / c.max);
    s.combo++;
    s.bestCombo = Math.max(s.bestCombo, s.combo);
    const pts = Math.round((60 + 40 * frac) * c.qty * (1 + 0.1 * Math.min(s.combo - 1, 8)) * (c.vip ? 2 : 1) * s.pace.points);
    s.score += pts;
    s.served++;
    s.resolved++;
    c.state = 'served';
    c.leaveIn = 1.3;
    for (const o of c.order) {
      if (!s.assist) bump(s, o.id, 1);
      stat(s, o.id, 'hit');
    }
    s.events.push({ type: 'served', slot: c.slot, pts, combo: s.combo, vip: c.vip });
    return { type: 'served', pts };
  }
  // wrong plate: the customer corrects you, patience drops, and the words you missed slip a box
  c.wrong++;
  s.combo = 0;
  c.patience = Math.max(1.5, c.patience - c.max * 0.22);
  for (const o of c.order) {
    if ((got[o.id] || 0) !== o.qty) {
      bump(s, o.id, -1);
      stat(s, o.id, 'miss');
    }
  }
  c.plate = [];
  s.events.push({ type: 'wrong', slot: c.slot, text: c.text, en: c.en, order: c.order.map((o) => ({ ...o })) });
  return { type: 'wrong', text: c.text, en: c.en };
}

export function summary(s) {
  const words = Object.entries(s.stats).map(([id, v]) => ({ id, ...v, box: s.box[id] }));
  words.sort((a, b) => b.miss - a.miss);
  const mastered = Object.values(s.box).filter((v) => v >= 3).length;
  return { words, mastered, known: Object.keys(s.box).length };
}

export function scoreOf(s) {
  return Math.round(s.score);
}

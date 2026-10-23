// Deep Delve: turn-based dungeon rules. Pure functions, no DOM, deterministic for a seed.
// Everything happens on a tile grid and the hero only ever moves one open tile at a time, so walls cannot be crossed.
import { mulberry32, shuffle } from './rng.js';

export const W = 11;
export const H = 15;
export const MAX_FLOOR = 10;
export const MAX_HP = 5;
export const LIGHT = 3; // how far the torch reaches along open tiles
export const WAKE = 6; // enemies notice you within this many steps

const idx = (x, y) => y * W + x;
const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export const previewSeconds = (floor) => Math.max(3, Math.round(9 - floor * 0.7));

// Breadth-first distances over open tiles. blocked is an optional Set of indices.
export function distances(tiles, from, blocked) {
  const d = new Int16Array(W * H).fill(-1);
  const q = [idx(from.x, from.y)];
  d[q[0]] = 0;
  for (let h = 0; h < q.length; h++) {
    const c = q[h];
    const cx = c % W;
    const cy = (c / W) | 0;
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (!inside(nx, ny)) continue;
      const n = idx(nx, ny);
      if (!tiles[n] || d[n] >= 0 || (blocked && blocked.has(n))) continue;
      d[n] = d[c] + 1;
      q.push(n);
    }
  }
  return d;
}

export function generateFloor(floor, seed) {
  const rnd = mulberry32((seed * 7919 + floor * 104729) | 0);
  const tiles = new Uint8Array(W * H);
  // maze on the odd cells
  const cw = (W - 1) / 2;
  const ch = (H - 1) / 2;
  const seen = new Set();
  const sx = Math.floor(rnd() * cw);
  const sy = Math.floor(rnd() * ch);
  const stack = [[sx, sy]];
  seen.add(sy * cw + sx);
  tiles[idx(1 + 2 * sx, 1 + 2 * sy)] = 1;
  while (stack.length) {
    const [cx, cy] = stack[stack.length - 1];
    const next = shuffle(rnd, DIRS).filter(([dx, dy]) => cx + dx >= 0 && cy + dy >= 0 && cx + dx < cw && cy + dy < ch && !seen.has((cy + dy) * cw + cx + dx));
    if (!next.length) {
      stack.pop();
      continue;
    }
    const [dx, dy] = next[0];
    const nx = cx + dx;
    const ny = cy + dy;
    tiles[idx(1 + 2 * cx + dx, 1 + 2 * cy + dy)] = 1;
    tiles[idx(1 + 2 * nx, 1 + 2 * ny)] = 1;
    seen.add(ny * cw + nx);
    stack.push([nx, ny]);
  }
  // knock out some walls to make loops so there is more than one way around
  let loops = 5 + Math.min(floor, 4);
  for (let tries = 0; tries < 200 && loops > 0; tries++) {
    const x = 1 + Math.floor(rnd() * (W - 2));
    const y = 1 + Math.floor(rnd() * (H - 2));
    if (tiles[idx(x, y)] || (x % 2 === 1) === (y % 2 === 1)) continue; // only walls between two cells
    const a = x % 2 === 0 ? [idx(x - 1, y), idx(x + 1, y)] : [idx(x, y - 1), idx(x, y + 1)];
    if (tiles[a[0]] && tiles[a[1]]) {
      tiles[idx(x, y)] = 1;
      loops--;
    }
  }

  // Connected 3x3 chambers break up the corridors and give the map memorable shapes.
  for(let n=0;n<2;n++){const cx=3+2*Math.floor(rnd()*3),cy=3+2*Math.floor(rnd()*5);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)tiles[idx(cx+dx,cy+dy)]=1;}
  const start = { x: 1, y: H - 2 };
  const d0 = distances(tiles, start);
  const open = [];
  for (let i = 0; i < W * H; i++) if (tiles[i]) open.push({ x: i % W, y: (i / W) | 0, d: d0[i] });
  // stairs: among the farthest tiles
  const far = open.slice().sort((a, b) => b.d - a.d);
  const stairs = far[Math.floor(rnd() * Math.min(3, far.length))];
  const taken = new Set([idx(start.x, start.y), idx(stairs.x, stairs.y)]);

  // traps, never blocking every route to the stairs
  const traps = [];
  const trapSet = new Set();
  const want = Math.min(2 + floor, 11);
  for (const c of shuffle(rnd, open)) {
    if (traps.length >= want) break;
    const k = idx(c.x, c.y);
    if (taken.has(k) || c.d < 3) continue;
    trapSet.add(k);
    const dd = distances(tiles, start, trapSet);
    if (dd[idx(stairs.x, stairs.y)] < 0) {
      trapSet.delete(k);
      continue;
    }
    traps.push({ x: c.x, y: c.y, revealed: false });
    taken.add(k);
  }
  const free = shuffle(rnd, open).filter((c) => !taken.has(idx(c.x, c.y)));
  const gems = [];
  for (const c of free) {
    if (gems.length >= 4 + Math.min(floor, 3)) break;
    if (c.d < 2) continue;
    gems.push({ x: c.x, y: c.y });
    taken.add(idx(c.x, c.y));
  }
  const hearts = [];
  if (floor >= 2 && rnd() < 0.6) {
    const c = free.find((q) => !taken.has(idx(q.x, q.y)) && q.d >= 4);
    if (c) {
      hearts.push({ x: c.x, y: c.y });
      taken.add(idx(c.x, c.y));
    }
  }
  const enemies = [];
  const nEn = floor < 2 ? 0 : Math.min(5, Math.floor(floor / 2) + (floor >= 6 ? 1 : 0));
  let id = 1;
  for (const c of free) {
    if (enemies.length >= nEn) break;
    if (taken.has(idx(c.x, c.y)) || c.d < 7) continue;
    const brute = floor >= 3 && rnd() < 0.35;
    enemies.push({ id: id++, x: c.x, y: c.y, kind: brute ? 'brute' : 'skeleton', hp: brute ? 3 : 2, rest: false, intent: null, cooldown: 0 });
    taken.add(idx(c.x, c.y));
  }
  const landmarks=far.filter(c=>!taken.has(idx(c.x,c.y))&&c.d>4).slice(0,3).map((c,i)=>({x:c.x,y:c.y,kind:i}));
  return { floor, tiles, start, landmarks, stairs: { x: stairs.x, y: stairs.y }, traps, gems, hearts, enemies, seen: new Uint8Array(W * H) };
}

// ----- game -----
export function createGame(seed = 1) {
  const g = {
    seed,
    floor: 1,
    hp: 3,
    maxHp: 3,
    gems: 0,
    kills: 0,
    turns: 0,
    hitsTaken: 0,
    over: false,
    reason: null,
    pos: { x: 1, y: H - 2 },
    level: null,
    preview: true,
    events: [],
    floorHurt: false,
    perfectFloors: 0,
    blocks: 0, riposte: false, guarding: false, scouts: 1, trapsHit: 0,
  };
  loadFloor(g);
  return g;
}

function loadFloor(g) {
  g.level = generateFloor(g.floor, g.seed);
  g.pos = { ...g.level.start };
  g.preview = true;
  g.floorHurt = false;
  g.scouts = 1;
  g.riposte = false;
  updateSeen(g);
}

export function endPreview(g) {
  g.preview = false;
}

// tiles the torch lights right now (open tiles within LIGHT steps, plus the walls around them)
export function litSet(g) {
  const d = distances(g.level.tiles, g.pos);
  const lit = new Set();
  for (let i = 0; i < W * H; i++) {
    if (d[i] >= 0 && d[i] <= LIGHT) {
      lit.add(i);
      const x = i % W;
      const y = (i / W) | 0;
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) if (inside(x + dx, y + dy)) lit.add(idx(x + dx, y + dy));
    }
  }
  return lit;
}
function updateSeen(g) {
  for (const i of litSet(g)) g.level.seen[i] = 1;
}
export const isSeen = (g, x, y) => g.level.seen[idx(x, y)] === 1;
export function visibleEnemies(g) {
  const d = distances(g.level.tiles, g.pos);
  return g.level.enemies.filter((e) => d[idx(e.x, e.y)] >= 0 && d[idx(e.x, e.y)] <= LIGHT);
}
export const isOpen = (g, x, y) => inside(x, y) && g.level.tiles[idx(x, y)] === 1;
export const enemyAt = (g, x, y) => g.level.enemies.find((e) => e.x === x && e.y === y);
const trapAt = (g, x, y) => g.level.traps.find((t) => t.x === x && t.y === y);

// ----- one player action -----
export function move(g, dx, dy) {
  if (g.over || g.preview) return { moved: false };
  const nx = g.pos.x + dx;
  const ny = g.pos.y + dy;
  if (Math.abs(dx) + Math.abs(dy) !== 1 || !isOpen(g, nx, ny)) return { moved: false };
  const e = enemyAt(g, nx, ny);
  const res = { moved: false, attacked: false };
  if (e) {
    const damage = g.riposte ? 2 : 1;
    e.hp -= damage;
    g.riposte = false;
    res.attacked = true;
    g.events.push({ type: 'hit', x: nx, y: ny });
    if (e.hp <= 0) {
      g.level.enemies = g.level.enemies.filter((q) => q !== e);
      g.kills++;
      g.events.push({ type: 'kill', x: nx, y: ny });
    }
  } else {
    g.pos.x = nx;
    g.pos.y = ny;
    res.moved = true;
    arrive(g, res);
    if (res.descended) return res;
  }
  afterAction(g);
  return res;
}

export function defend(g) {
  if (g.over || g.preview) return false;
  g.guarding = true;
  g.events.push({ type: 'guard' });
  afterAction(g);
  return true;
}
export function attack(g, id) {
  const e = g.level.enemies.find(e => e.id === id);
  if (!e || Math.abs(e.x - g.pos.x) + Math.abs(e.y - g.pos.y) !== 1) return false;
  return move(g, e.x - g.pos.x, e.y - g.pos.y).attacked;
}
export function scout(g) {
  if (g.over || g.preview || g.scouts <= 0) return false;
  g.scouts--; g.preview = true; return true;
}

export function wait(g) {
  if (g.over || g.preview) return false;
  afterAction(g);
  return true;
}

function arrive(g, res) {
  const { x, y } = g.pos;
  const t = trapAt(g, x, y);
  if (t && !t.revealed) {
    t.revealed = true;
    g.trapsHit++;
    hurt(g, 1, 'trap');
    res.trap = true;
  }
  const gi = g.level.gems.findIndex((q) => q.x === x && q.y === y);
  if (gi >= 0) {
    g.level.gems.splice(gi, 1);
    g.gems++;
    g.events.push({ type: 'gem', x, y });
  }
  const hi = g.level.hearts.findIndex((q) => q.x === x && q.y === y);
  if (hi >= 0) {
    g.level.hearts.splice(hi, 1);
    g.hp = Math.min(g.maxHp, g.hp + 1);
    g.events.push({ type: 'heal', x, y });
  }
  if (!g.over && x === g.level.stairs.x && y === g.level.stairs.y) {
    res.descended = true;
    descend(g);
  }
}

function descend(g) {
  if (!g.floorHurt) g.perfectFloors++;
  g.events.push({ type: 'descend', floor: g.floor });
  if (g.floor >= MAX_FLOOR) {
    g.over = true;
    g.reason = 'escaped';
    g.events.push({ type: 'win' });
    return;
  }
  g.floor++;
  if (g.floor % 3 === 0 && g.maxHp < MAX_HP) {
    g.maxHp++;
    g.hp = Math.min(g.maxHp, g.hp + 1);
    g.events.push({ type: 'maxhp' });
  }
  loadFloor(g);
}

function hurt(g, n, why) {
  g.hp -= n;
  g.hitsTaken += n;
  g.floorHurt = true;
  g.events.push({ type: 'hurt', why, x: g.pos.x, y: g.pos.y });
  if (g.hp <= 0) {
    g.hp = 0;
    g.over = true;
    g.reason = 'fallen';
    g.events.push({ type: 'lose' });
  }
}

function afterAction(g) {
  g.turns++;
  if (!g.over) enemyPhase(g);
  g.guarding = false;
  if (!g.over) updateSeen(g);
}

function enemyPhase(g) {
  const d = distances(g.level.tiles, g.pos);
  for (const e of g.level.enemies.slice()) {
    if (g.over) return;
    const here = d[idx(e.x, e.y)];
    if (e.intent) {
      const aimed = e.intent.x === g.pos.x && e.intent.y === g.pos.y && here === 1;
      if (aimed && g.guarding) {
        g.blocks++; g.riposte = true;
        g.events.push({ type: 'block', x: e.x, y: e.y });
      } else if (aimed) {
        hurt(g, 1, 'enemy');
        g.events.push({ type: 'strike', x: e.x, y: e.y });
      } else g.events.push({ type: 'dodge', x: e.x, y: e.y });
      e.intent = null; e.cooldown = 1; e.rest = true;
      continue;
    }
    if (e.cooldown > 0) { e.cooldown--; e.rest = true; continue; }
    e.rest = false;
    if (here < 0 || here > WAKE) continue;
    if (here !== 1) {
      let best = null;
      for (const [dx, dy] of DIRS) {
        const nx = e.x + dx, ny = e.y + dy;
        if (!isOpen(g, nx, ny) || enemyAt(g, nx, ny) || (nx === g.pos.x && ny === g.pos.y)) continue;
        const dd = d[idx(nx, ny)];
        if (dd >= 0 && dd < here && (!best || dd < best.dd)) best = { nx, ny, dd };
      }
      if (best) { e.x = best.nx; e.y = best.ny; g.events.push({ type: 'enemy-move', id: e.id }); }
    }
    if (Math.abs(e.x - g.pos.x) + Math.abs(e.y - g.pos.y) === 1) {
      e.intent = { x: g.pos.x, y: g.pos.y };
      g.events.push({ type: 'windup', x: e.x, y: e.y });
    }
  }
}

export function validGame(g) {
  const cell = p => p && Number.isInteger(p.x) && Number.isInteger(p.y) && p.x >= 0 && p.x < W && p.y >= 0 && p.y < H;
  const L = g.level;
  if (!Number.isInteger(g.seed) || !Number.isInteger(g.floor) || g.floor < 1 || g.floor > MAX_FLOOR || !L || L.floor !== g.floor || !cell(g.pos) || !cell(L.stairs)) return false;
  if (!(L.tiles instanceof Uint8Array) || L.tiles.length !== W * H || L.tiles.some(t => t > 1) || !(L.seen instanceof Uint8Array) || L.seen.length !== W * H || !L.tiles[idx(g.pos.x,g.pos.y)]) return false;
  if (!(g.hp > 0 && g.hp <= g.maxHp && g.maxHp <= MAX_HP) || !Number.isInteger(g.turns) || g.turns < 0) return false;
  for (const key of ['traps', 'gems', 'hearts', 'enemies']) if (!Array.isArray(L[key]) || L[key].length > 30 || !L[key].every(p => cell(p) && L.tiles[idx(p.x,p.y)])) return false;
  return L.enemies.every(e => ['skeleton','brute'].includes(e.kind) && e.hp > 0 && e.hp <= 3 && (!e.intent || cell(e.intent)));
}

// ----- tap to walk -----
// Path over tiles you have seen, avoiding traps you know about. Returns [{x,y}, ...] or null.
export function pathTo(g, tx, ty) {
  if (!isOpen(g, tx, ty) || !isSeen(g, tx, ty)) return null;
  const knownTraps = new Set(g.level.traps.filter((t) => t.revealed).map((t) => idx(t.x, t.y)));
  const prev = new Int32Array(W * H).fill(-2);
  const start = idx(g.pos.x, g.pos.y);
  prev[start] = -1;
  const q = [start];
  for (let h = 0; h < q.length; h++) {
    const c = q[h];
    if (c === idx(tx, ty)) break;
    const cx = c % W;
    const cy = (c / W) | 0;
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (!inside(nx, ny)) continue;
      const n = idx(nx, ny);
      if (prev[n] !== -2 || !g.level.tiles[n] || !g.level.seen[n]) continue;
      if (knownTraps.has(n) && n !== idx(tx, ty)) continue;
      if (enemyAt(g, nx, ny) && n !== idx(tx, ty)) continue;
      prev[n] = c;
      q.push(n);
    }
  }
  const goal = idx(tx, ty);
  if (prev[goal] === -2) return null;
  const path = [];
  for (let c = goal; c !== start; c = prev[c]) path.push({ x: c % W, y: (c / W) | 0 });
  return path.reverse();
}

export function scoreOf(g) {
  const win = g.reason === 'escaped';
  return Math.round((g.floor - 1) * 150 + (g.floor >= 1 && win ? 150 : 0) + g.gems * 10 + g.kills * 25 + g.perfectFloors * 40 + (win ? 500 + g.hp * 100 : 0));
}

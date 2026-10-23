// Block Fit rules engine. One game mode, with the original in-run rule changes.
import { mulberry32 as seeded } from './rng.js';
export const COLS = 10;
export const ROWS = 20;
export const TIME_LIMIT_MS = 180000;
export const LOCK_DELAY_MS = 450;

const BASE = {
  I: [[0, 1], [1, 1], [2, 1], [3, 1]],
  O: [[0, 0], [1, 0], [0, 1], [1, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
};
const SIZE = { I: 4, O: 2, T: 3, S: 3, Z: 3, J: 3, L: 3 };
export const TYPES = Object.keys(BASE);
export const COLOR_INDEX = { I: 1, O: 2, T: 3, S: 4, Z: 5, J: 6, L: 7 };
export const TWISTS = ['mirror', 'noghost', 'nonext', 'ccw'];
export const TWIST_TEXT = {
  mirror: 'Mirror: left and right are swapped',
  noghost: 'No guide: the landing outline is hidden',
  nonext: 'No preview: upcoming shapes are hidden',
  ccw: 'Reverse spin: rotation direction is flipped',
};

export const mulberry32 = seeded;

const rotCells = (cells, size, dir) => cells.map(([x, y]) => (dir > 0 ? [size - 1 - y, x] : [y, size - 1 - x]));

export function fits(board, cells, px, py) {
  for (const [cx, cy] of cells) {
    const gx = px + cx;
    const gy = py + cy;
    if (gx < 0 || gx >= COLS || gy >= ROWS) return false;
    if (gy >= 0 && board[gy][gx]) return false;
  }
  return true;
}

function drawType(g) {
  if (g.bag.length === 0) {
    const b = [...TYPES];
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(g.rng() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    g.bag = b;
  }
  return g.bag.pop();
}

function makePiece(t) {
  const cells = BASE[t].map((c) => [c[0], c[1]]);
  const size = SIZE[t];
  const minY = Math.min(...cells.map((c) => c[1]));
  return { t, size, cells, x: Math.floor((COLS - size) / 2), y: -minY };
}

function spawn(g, forced) {
  const t = forced || g.queue.shift();
  if (!forced) g.queue.push(drawType(g));
  g.cur = makePiece(t);
  g.acc = 0;
  g.lockMs = 0;
  g.lockResets = 0;
  if (!fits(g.board, g.cur.cells, g.cur.x, g.cur.y)) {
    g.over = true;
    g.reason = 'topout';
  }
}

export function createGame(seed = Date.now()) {
  const g = {
    rng: mulberry32(seed >>> 0),
    board: Array.from({ length: ROWS }, () => Array(COLS).fill(0)),
    bag: [],
    queue: [],
    cur: null,
    hold: null,
    canHold: true,
    score: 0,
    lines: 0,
    level: 1,
    pieces: 0,
    elapsed: 0,
    over: false,
    reason: null,
    acc: 0,
    lockMs: 0,
    lockResets: 0,
    soft: false,
    twist: null,
    nextTwistAt: 12,
    lastTwist: null,
    twistsSeen: 0,
    events: [],
  };
  for (let i = 0; i < 4; i++) g.queue.push(drawType(g));
  spawn(g);
  return g;
}

export function stackHeight(board) {
  for (let y = 0; y < ROWS; y++) if (board[y].some((v) => v)) return ROWS - y;
  return 0;
}

// Adaptive pacing: speed rises with level, but eases off when the stack gets dangerously high.
export function dropInterval(g) {
  let ms = Math.max(90, 850 * Math.pow(0.86, g.level - 1));
  const sh = stackHeight(g.board);
  if (sh >= 17) ms *= 1.8;
  else if (sh >= 14) ms *= 1.4;
  return g.soft ? Math.min(ms, 45) : ms;
}

const grounded = (g) => !fits(g.board, g.cur.cells, g.cur.x, g.cur.y + 1);

function touch(g) {
  if (grounded(g) && g.lockResets < 10) {
    g.lockMs = 0;
    g.lockResets++;
  }
}

export function tick(g, dtMs) {
  if (g.over) return;
  g.elapsed += dtMs;
  if (g.elapsed >= TIME_LIMIT_MS) {
    g.elapsed = TIME_LIMIT_MS;
    g.over = true;
    g.reason = 'time';
    return;
  }
  if (grounded(g)) {
    g.lockMs += dtMs;
    if (g.lockMs >= LOCK_DELAY_MS) lock(g);
    return;
  }
  g.acc += dtMs;
  const ms = dropInterval(g);
  while (g.acc >= ms) {
    g.acc -= ms;
    if (fits(g.board, g.cur.cells, g.cur.x, g.cur.y + 1)) {
      g.cur.y++;
      if (g.soft) g.score += 1;
    } else break;
  }
}

export function move(g, dx) {
  if (g.over) return false;
  if (g.twist && g.twist.kind === 'mirror') dx = -dx;
  const p = g.cur;
  if (fits(g.board, p.cells, p.x + dx, p.y)) {
    p.x += dx;
    touch(g);
    return true;
  }
  return false;
}

const KICKS = [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1]];
export function rotate(g, dir = 1) {
  if (g.over) return false;
  if (g.twist && g.twist.kind === 'ccw') dir = -dir;
  const p = g.cur;
  const cells = rotCells(p.cells, p.size, dir);
  for (const [kx, ky] of KICKS) {
    if (fits(g.board, cells, p.x + kx, p.y + ky)) {
      p.cells = cells;
      p.x += kx;
      p.y += ky;
      touch(g);
      return true;
    }
  }
  return false;
}

export function setSoft(g, on) {
  g.soft = !!on;
}

export function ghostY(g) {
  let y = g.cur.y;
  while (fits(g.board, g.cur.cells, g.cur.x, y + 1)) y++;
  return y;
}

export function hardDrop(g) {
  if (g.over) return 0;
  const y = ghostY(g);
  const n = y - g.cur.y;
  g.cur.y = y;
  g.score += 2 * n;
  lock(g);
  return n;
}

export function holdPiece(g) {
  if (g.over || !g.canHold) return false;
  const t = g.cur.t;
  if (g.hold) {
    const h = g.hold;
    g.hold = t;
    spawn(g, h);
  } else {
    g.hold = t;
    spawn(g);
  }
  g.canHold = false;
  return true;
}

function lock(g) {
  const p = g.cur;
  let aboveTop = false;
  for (const [cx, cy] of p.cells) {
    const gx = p.x + cx;
    const gy = p.y + cy;
    if (gy < 0) aboveTop = true;
    else g.board[gy][gx] = COLOR_INDEX[p.t];
  }
  // full rows, found before they are removed so the screen can flash them in place
  const rows = [];
  for (let y = 0; y < ROWS; y++) if (g.board[y].every((v) => v)) rows.push(y);
  const placed = p.cells.map(([cx, cy]) => [p.x + cx, p.y + cy]).filter(([, y]) => y >= 0);
  g.events.push({ type: 'lock', cells: placed, color: COLOR_INDEX[p.t] });
  let cleared = 0;
  for (let y = ROWS - 1; y >= 0; y--) {
    if (g.board[y].every((v) => v)) {
      g.board.splice(y, 1);
      g.board.unshift(Array(COLS).fill(0));
      cleared++;
      y++;
    }
  }
  g.pieces++;
  if (cleared) {
    // back-to-back clears build a combo worth a little extra each time
    g.combo = (g.combo || 0) + 1;
    const pts = [0, 100, 300, 500, 800][cleared] * g.level + (g.combo > 1 ? 50 * (g.combo - 1) * g.level : 0);
    g.score += pts;
    g.lines += cleared;
    g.level = 1 + Math.floor(g.lines / 6);
    g.bestCombo = Math.max(g.bestCombo || 0, g.combo);
    g.events.push({ type: 'clear', n: cleared, rows, pts, combo: g.combo });
  } else g.combo = 0;
  if (g.twist) {
    g.twist.left--;
    if (g.twist.left <= 0) {
      g.events.push({ type: 'twistEnd' });
      g.twist = null;
    }
  } else if (g.level >= 2 && g.pieces >= g.nextTwistAt) {
    const pool = TWISTS.filter((t) => t !== g.lastTwist);
    const kind = pool[Math.floor(g.rng() * pool.length)];
    g.twist = { kind, left: 8 };
    g.lastTwist = kind;
    g.nextTwistAt = g.pieces + 8 + 14;
    g.twistsSeen++;
    g.events.push({ type: 'twist', kind });
  }
  if (aboveTop) {
    g.over = true;
    g.reason = 'topout';
    return;
  }
  spawn(g);
  g.canHold = true;
}

export const absCells = (p) => p.cells.map(([x, y]) => [p.x + x, p.y + y]);
export const pieceShape = (t) => ({ cells: BASE[t], size: SIZE[t] });

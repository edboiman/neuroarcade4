// Holiday Horde touch input. Pure state, no DOM, so the whole path from pointer to aim can be tested.
//
// Auto-aim mode: one floating movement stick anywhere on the arena.
// Manual mode:   left half of the arena is the movement stick; touching and holding the right half
//                aims at the finger's position and fires continuously until the finger lifts.
//
// Coordinates passed in are CSS pixels relative to the arena canvas. The camera keeps the hero at
// the canvas center, so a canvas point maps to the world as hero + (point - center) / scale.

export const STICK_RADIUS = 44;
const DEAD = 6; // px of wobble ignored by the movement stick
const AIM_DEAD = 10; // px: a finger right on the hero keeps the last direction

export function createInput() {
  return { move: null, aim: null, lastAim: { x: 1, y: 0 } };
}

export function screenToWorld(px, py, view) {
  return { x: view.heroX + (px - view.w / 2) / view.scale, y: view.heroY + (py - view.h / 2) / view.scale };
}

// Returns which control the pointer took ('move' | 'aim'), or null if it was ignored.
export function pointerDown(st, { id, x, y, w, manual }) {
  const which = manual && x > w / 2 ? 'aim' : 'move';
  if (st[which]) return null; // that thumb is already down; extra fingers cannot hijack it
  st[which] = which === 'move' ? { id, ox: x, oy: y, x: 0, y: 0 } : { id, px: x, py: y };
  return which;
}

export function pointerMove(st, { id, x, y }) {
  if (st.aim && st.aim.id === id) {
    st.aim.px = x;
    st.aim.py = y;
    return 'aim';
  }
  const m = st.move;
  if (!m || m.id !== id) return null;
  let dx = x - m.ox;
  let dy = y - m.oy;
  const d = Math.hypot(dx, dy);
  if (d > STICK_RADIUS) {
    // the base follows the finger so you never run out of room
    const k = (d - STICK_RADIUS) / d;
    m.ox += dx * k;
    m.oy += dy * k;
    dx = x - m.ox;
    dy = y - m.oy;
  }
  const len = Math.hypot(dx, dy);
  m.x = len < DEAD ? 0 : dx / STICK_RADIUS;
  m.y = len < DEAD ? 0 : dy / STICK_RADIUS;
  return 'move';
}

export function pointerUp(st, id) {
  let hit = null;
  if (st.move && st.move.id === id) {
    st.move = null;
    hit = 'move';
  }
  if (st.aim && st.aim.id === id) {
    st.aim = null;
    hit = 'aim';
  }
  return hit;
}

// Blur, backgrounding, pause, level-up and scene changes: nothing may stay pressed.
export function releaseAll(st) {
  st.move = null;
  st.aim = null;
}

export function moveVector(st) {
  return st.move ? { x: st.move.x, y: st.move.y } : null;
}

// Unit direction from the hero to the finger, in world space, or null when not aiming.
// Recomputed every step, so it follows both the finger and the hero as they move.
export function aimVector(st, view) {
  if (!st.aim) return null;
  const p = screenToWorld(st.aim.px, st.aim.py, view);
  const dx = p.x - view.heroX;
  const dy = p.y - view.heroY;
  const d = Math.hypot(dx, dy);
  if (d * view.scale >= AIM_DEAD) st.lastAim = { x: dx / d, y: dy / d };
  return { ...st.lastAim };
}

// Split a frame into fixed-size steps so game speed and fire cadence do not depend on frame rate.
export function substeps(dt, step = 1 / 60, max = 0.25) {
  const out = [];
  let rem = Math.min(Math.max(dt, 0), max);
  while (rem > 1e-9) {
    const h = Math.min(step, rem);
    out.push(h);
    rem -= h;
  }
  return out;
}

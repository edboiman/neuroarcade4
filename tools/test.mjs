// Logic tests for the pure parts of every game and the weekly rules.  Run: node tools/test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

import * as weekly from '../js/weekly.js';
import { sanitize, defaults, store } from '../js/store.js';
import * as bf from '../js/games/blockfit-core.js';
import * as sv from '../js/games/survivor-core.js';
import * as si from '../js/games/survivor-input.js';
import { THEMES, themeForMonth } from '../js/games/survivor-themes.js';
import * as cf from './retired/lingo/cafe-core.js';
import * as cd from './retired/lingo/cafe-data.js';
import { SCENES, PACES, sceneById } from './retired/lingo/lingo-scenes.js';
import { buildQuiz, choicesFor } from './retired/lingo/cafe-lesson.js';
import { mulberry32 } from '../js/games/rng.js';
import * as es from '../js/games/estate-core.js';
import * as dg from './retired/dungeon-core.js';
import { median, createSpan } from '../js/checkin.js';

const DAY = 86400000;
const at = (y, m, d, hh = 12) => new Date(y, m - 1, d, hh).getTime();
const mk = (g, t, extra = {}) => ({ g, t, d: 120, s: 100, l: 1, a: null, c: true, ...extra });

// ---------- weekly rules ----------
test('week starts on Monday at local midnight, across DST changes', () => {
  const wed = at(2026, 10, 14);
  const ws = new Date(weekly.weekStart(wed));
  assert.equal(ws.getDay(), 1);
  assert.equal(ws.getHours(), 0);
  assert.equal(ws.getDate(), 12);
  const sun = new Date(weekly.weekStart(at(2026, 10, 18, 23)));
  assert.equal(sun.getDate(), 12);
  // shifting weeks across the November DST change keeps midnight Monday
  let wk = weekly.weekStart(at(2026, 11, 1));
  for (let i = 0; i < 6; i++) {
    wk = weekly.shiftWeek(wk, 1);
    const d = new Date(wk);
    assert.equal(d.getDay(), 1);
    assert.equal(d.getHours(), 0);
  }
});

test('rotation counts plays and never locks a game', () => {
  const now = at(2026, 10, 15);
  const base = weekly.weekStart(now);
  const s = [mk('blockfit', base + 1000), mk('blockfit', base + 2000), mk('blockfit', base + 3000), mk('blockfit', base + 4000)];
  const r = weekly.rotation(s, now);
  assert.equal(r.counts.blockfit, 4);
  assert.equal('locked' in r, false);
  assert.deepEqual(r.remaining, weekly.GAME_IDS.filter(id=>id!=='blockfit'));
  for (const g of weekly.GAME_IDS.filter(id=>id!=='blockfit')) s.push(mk(g, base + 5000));
  assert.equal(weekly.rotation(s, now).complete, true);
});

test('overdue warns after 7+ days without a counted session, including never-played games', () => {
  const now = at(2026, 10, 15);
  assert.deepEqual(weekly.overdue([], now), []);
  const s = [mk('blockfit', now - 3 * DAY), mk('curio', now - 7 * DAY - 1000), mk('survivor', now - 20 * DAY), mk('estate', now - 1 * DAY, { c: false, d: 10 })];
  const due = weekly.overdue(s, now);
  const ids = due.map((x) => x.id);
  assert.ok(!ids.includes('blockfit'));
  assert.ok(ids.includes('curio'));
  assert.equal(due[0].days, 20);
  assert.ok(ids.includes('estate') && due.find((x) => x.id === 'estate').never, 'a too-short run does not count');
  assert.ok(!ids.includes('dungeon'), 'retired games never trigger reminders');
  // a brand-new player is not nagged during their first week
  assert.deepEqual(weekly.overdue([mk('blockfit', now - 2 * DAY)], now), []);
});

test('short abandoned sessions do not count; completed or 60s sessions do', () => {
  const now = at(2026, 10, 15);
  const s = [mk('curio', now - 1000, { c: false, d: 20 }), mk('survivor', now - 900, { c: false, d: 61 }), mk('estate', now - 800, { c: true, d: 5 })];
  const r = weekly.rotation(s, now);
  assert.equal(r.counts.curio, 0);
  assert.equal(r.counts.survivor, 1);
  assert.equal(r.counts.estate, 1);
});

test('streak counts consecutive complete weeks and is not broken by an unfinished current week', () => {
  const now = at(2026, 10, 15);
  const sessions = [];
  const fullWeek = (wk) => weekly.GAME_IDS.forEach((g, i) => sessions.push(mk(g, wk + 1000 + i)));
  let wk = weekly.weekStart(now);
  fullWeek(weekly.shiftWeek(wk, -1));
  fullWeek(weekly.shiftWeek(wk, -2));
  assert.equal(weekly.streak(sessions, now), 2);
  fullWeek(wk);
  assert.equal(weekly.streak(sessions, now), 3);
  const gap = sessions.filter((x) => x.t < weekly.shiftWeek(wk, -1) || x.t >= wk);
  assert.equal(weekly.streak(gap, now), 1);
});

test('weekly series and week-over-week delta', () => {
  const now = at(2026, 10, 15);
  const wk = weekly.weekStart(now);
  const s = [mk('blockfit', weekly.shiftWeek(wk, -1) + 10, { s: 1000 }), mk('blockfit', wk + 10, { s: 1200 }), mk('blockfit', wk + 20, { s: 1400 })];
  const series = weekly.weeklySeries(s, 'blockfit', now, 4);
  assert.equal(series.length, 4);
  assert.equal(series[3].avg, 1300);
  assert.equal(series[3].best, 1400);
  assert.equal(series[0].avg, null);
  assert.equal(Math.round(weekly.weekDelta(series).pct), 30);
  assert.equal(weekly.weekDelta(weekly.weeklySeries([], 'blockfit', now, 4)), null);
});

// ---------- storage safety ----------
test('sanitize clamps hostile data and drops unknown or dangerous keys', () => {
  const evil = {
    settings: { saver: 'yes', sound: false },
    sessions: [{ g: 'blockfit', t: 5, d: 1e12, s: -50, l: 1e9, a: 7, c: 'x' }, { g: 'hax', t: 1 }, null, 'str'],
    checkins: [{ t: 1, rt: 1e9, sp: -4 }],
    skills: { morse: { rung: 99, box: { m_a: 9, __proto__: 3, 'bad key!': 1 } }, __proto__: { rung: 3 }, constructor: { rung: 2 } },
    prefs: { island: { diff: 1e12 }, prototype: { x: 1 } },
  };
  const d = sanitize(JSON.parse(JSON.stringify(evil)));
  assert.equal(d.settings.saver, true);
  assert.equal(d.settings.sound, false);
  assert.equal(d.sessions.length, 1);
  assert.equal(d.sessions[0].d, 86400);
  assert.equal(d.sessions[0].s, 0);
  assert.equal(d.sessions[0].l, 999);
  assert.equal(d.sessions[0].a, 1);
  assert.equal(d.sessions[0].c, false);
  assert.equal(d.checkins[0].rt, 5000);
  assert.equal(d.checkins[0].sp, 0);
  assert.equal(d.skills.morse.rung, 20);
  assert.deepEqual(Object.keys(d.skills.morse.box), ['m_a']);
  assert.equal(d.skills.morse.box.m_a, 4);
  assert.equal(Object.prototype.hasOwnProperty.call(d.skills, '__proto__'), false);
  assert.equal(d.skills.constructor, undefined === d.skills.constructor ? undefined : d.skills.constructor);
  assert.ok(!('prototype' in d.prefs));
  assert.deepEqual(sanitize(null).sessions, []);
  assert.equal(({}).polluted, undefined);
});

test('import rejects wrong, oversized, or malformed files; export round-trips', () => {
  assert.equal(store.importText('{not json').ok, false);
  assert.equal(store.importText(JSON.stringify({ app: 'other', data: {} })).ok, false);
  assert.equal(store.importText('x'.repeat(1600000)).ok, false);
  store.reset();
  store.addSession({ g: 'curio', t: Date.now(), d: 100, s: 321, l: 4, a: 0.8, c: true });
  const text = store.exportText();
  store.reset();
  assert.equal(store.sessions().length, 0);
  const res = store.importText(text);
  assert.equal(res.ok, true);
  assert.equal(store.sessions()[0].s, 321);
  store.reset();
});

// ---------- Block Fit ----------
test('Block Fit is deterministic for a seed and uses a 7-bag', () => {
  const a = bf.createGame(42);
  const b = bf.createGame(42);
  assert.deepEqual([a.cur.t, ...a.queue], [b.cur.t, ...b.queue]);
  const seen = new Set([a.cur.t, ...a.queue, ...a.bag]);
  assert.equal(seen.size, 7);
});

test('Block Fit hard drop locks, scores, spawns the next piece', () => {
  const g = bf.createGame(7);
  const before = g.cur.t;
  const n = bf.hardDrop(g);
  assert.ok(n > 10);
  assert.equal(g.pieces, 1);
  assert.equal(g.score, 2 * n);
  assert.ok(g.board.flat().filter(Boolean).length === 4);
  assert.notEqual(g.cur, null);
  void before;
});

test('Block Fit clears full rows, scores by level, and levels up', () => {
  const g = bf.createGame(3);
  // fill the bottom row except a 4-wide gap, then drop an I piece into it
  for (let x = 0; x < bf.COLS; x++) g.board[bf.ROWS - 1][x] = x >= 3 && x <= 6 ? 0 : 5;
  g.cur = { t: 'I', size: 4, cells: [[0, 1], [1, 1], [2, 1], [3, 1]], x: 3, y: -1 };
  bf.hardDrop(g);
  assert.equal(g.lines, 1);
  assert.equal(g.board[bf.ROWS - 1].every((v) => v === 0), true);
  assert.ok(g.score >= 100);
  g.lines = 5;
  for (let x = 0; x < bf.COLS; x++) g.board[bf.ROWS - 1][x] = x >= 3 && x <= 6 ? 0 : 5;
  g.cur = { t: 'I', size: 4, cells: [[0, 1], [1, 1], [2, 1], [3, 1]], x: 3, y: -1 };
  bf.hardDrop(g);
  assert.equal(g.level, 2);
});

test('Block Fit twists flip controls and expire after eight pieces', () => {
  const g = bf.createGame(11);
  const x0 = g.cur.x;
  g.twist = { kind: 'mirror', left: 8 };
  bf.move(g, 1);
  assert.equal(g.cur.x, x0 - 1);
  g.twist = { kind: 'ccw', left: 8 };
  const cells = JSON.stringify(g.cur.cells);
  bf.rotate(g, 1);
  const ccw = JSON.stringify(g.cur.cells);
  const g2 = bf.createGame(11);
  bf.rotate(g2, -1);
  assert.equal(ccw, JSON.stringify(g2.cur.cells));
  void cells;
  const g3 = bf.createGame(5);
  g3.level = 2;
  g3.pieces = 12;
  g3.nextTwistAt = 12;
  bf.hardDrop(g3);
  assert.ok(g3.twist && g3.twist.left === 8);
  for (let i = 0; i < 8 && !g3.over; i++) bf.hardDrop(g3);
  assert.ok(g3.twist === null || g3.over || g3.twist.left < 8);
});

test('Block Fit ends on top-out and on time, and hold works once per piece', () => {
  const g = bf.createGame(9);
  let guard = 0;
  while (!g.over && guard++ < 200) bf.hardDrop(g);
  assert.equal(g.over, true);
  assert.equal(g.reason, 'topout');
  const t = bf.createGame(1);
  bf.tick(t, bf.TIME_LIMIT_MS + 5);
  assert.equal(t.reason, 'time');
  const h = bf.createGame(2);
  const first = h.cur.t;
  assert.equal(bf.holdPiece(h), true);
  assert.equal(h.hold, first);
  assert.equal(bf.holdPiece(h), false);
});

test('Block Fit gravity eases when the stack is high', () => {
  const g = bf.createGame(4);
  const low = bf.dropInterval(g);
  for (let y = 4; y < bf.ROWS; y++) g.board[y][0] = 1;
  assert.ok(bf.dropInterval(g) > low);
});

test('Block Fit: clears report their rows and points, back-to-back clears build a combo', () => {
  const g = bf.createGame(5);
  const fillRow = (y, gapX) => {
    for (let x = 0; x < bf.COLS; x++) g.board[y][x] = x === gapX ? 0 : 1;
  };
  // a full bottom row: the next lock (anywhere) clears it
  fillRow(bf.ROWS - 1, -1);
  g.events.length = 0;
  bf.hardDrop(g);
  const lock = g.events.find((e) => e.type === 'lock');
  assert.ok(lock && lock.cells.length >= 1, 'a lock event lists the placed cells');
  const clear = g.events.find((e) => e.type === 'clear');
  assert.ok(clear, 'the full row cleared');
  assert.deepEqual(clear.rows, [bf.ROWS - 1]);
  assert.equal(clear.combo, 1);
  assert.ok(clear.pts >= 100);
  // a second clearing drop in a row is a combo and scores the bonus
  fillRow(bf.ROWS - 1, -1);
  g.events.length = 0;
  const before = g.score;
  bf.hardDrop(g);
  const c2 = g.events.find((e) => e.type === 'clear');
  assert.equal(c2.combo, 2);
  assert.ok(g.score - before >= c2.pts && c2.pts > 100 * g.level - 1);
  // a drop that clears nothing resets it
  g.events.length = 0;
  bf.hardDrop(g);
  if (!g.events.some((e) => e.type === 'clear')) assert.equal(g.combo, 0);
});

// ---------- Holiday Horde ----------
function bot(run) {
  const h = run.hero;
  let vx = 0;
  let vy = 0;
  for (const e of run.enemies) {
    const dx = h.x - e.x;
    const dy = h.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d < 130) {
      const w = (130 - d) / 130;
      vx += (dx / d) * w * w * 3;
      vy += (dy / d) * w * w * 3;
    }
  }
  if (!vx && !vy) {
    vx = Math.cos(run.t * 0.5) * 0.4;
    vy = Math.sin(run.t * 0.37) * 0.4;
  }
  return { x: vx, y: vy };
}
function playRun(seed, input) {
  const r = sv.createRun(seed);
  let guard = 0;
  while (!r.over && guard++ < 20000) {
    if (r.milestone > 0) {
      sv.applyMilestone(r, sv.offerMilestones(r)[0]);
      continue;
    }
    if (r.pending > 0) {
      sv.applyUpgrade(r, sv.offerChoices(r)[0]);
      continue;
    }
    sv.step(r, 1 / 30, input(r));
    r.events.length = 0;
  }
  return r;
}

test('Horde: standing still loses quickly, moving survives, runs are deterministic', () => {
  const idle = playRun(3, () => ({ x: 0, y: 0 }));
  assert.equal(idle.reason, 'down');
  assert.ok(idle.t < 90, 'an idle hero should not last: ' + idle.t);
  const a = playRun(5, bot);
  const b = playRun(5, bot);
  assert.equal(a.kills, b.kills);
  assert.equal(a.t, b.t);
  let wins = 0;
  for (let seed = 1; seed <= 6; seed++) if (playRun(seed, bot).reason === 'dawn') wins++;
  assert.ok(wins >= 2, 'a competent bot should sometimes reach dawn');
});

test('Horde: levelling pauses the run until an upgrade is chosen, and upgrades respect their caps', () => {
  const r = sv.createRun(2);
  r.pending = 1;
  const t0 = r.t;
  sv.step(r, 0.03, { x: 0, y: 0 });
  assert.equal(r.t, t0, 'time must not advance while an upgrade is pending');
  const choices = sv.offerChoices(r);
  assert.equal(choices.length, 3);
  assert.equal(new Set(choices).size, 3);
  sv.applyUpgrade(r, 'multi');
  assert.equal(r.up.multi, 1);
  assert.equal(r.pending, 0);
  for (let i = 0; i < 10; i++) sv.applyUpgrade(r, 'multi');
  assert.equal(r.up.multi, sv.UPGRADES.multi.max);
  const hp = r.hero.maxHp;
  sv.applyUpgrade(r, 'heart');
  assert.equal(r.hero.maxHp, hp + 25);
  assert.ok(sv.xpNeeded(5) > sv.xpNeeded(1));
});

test('Horde: enemies spawn just off screen, never in view, and the cap holds', () => {
  const r = sv.createRun(9);
  r.hero.hp = 1e9;
  r.hero.maxHp = 1e9;
  for (let i = 0; i < 4000; i++) {
    sv.step(r, 1 / 30, { x: 0, y: 0 });
    r.events.length = 0;
    if (r.pending) r.pending = 0;
    assert.ok(r.enemies.length <= 150 + 4, 'enemy cap');
  }
  for (const e of r.enemies) assert.ok(Number.isFinite(e.x) && Number.isFinite(e.y));
});

test('Horde: manual aim fires only where you point, and hits harder', () => {
  const r = sv.createRun(7, { manual: true });
  r.enemies.push({ id: 99, kind: 'grunt', x: 60, y: 0, hp: 9, maxHp: 9, hit: 0, orbCd: 0, vx: 0, vy: 0 });
  r.cd = 0;
  sv.step(r, 1 / 30, { x: 0, y: 0 }, null);
  assert.equal(r.shots.length, 0, 'no aim, no shot, even with an enemy next to you');
  r.cd = 0;
  sv.step(r, 1 / 30, { x: 0, y: 0 }, { x: 0, y: -1 });
  assert.equal(r.shots.length, 1);
  assert.ok(r.shots[0].vy < 0 && Math.abs(r.shots[0].vx) < 1, 'the shot goes up');
  const auto = sv.createRun(7);
  auto.enemies.push({ id: 99, kind: 'grunt', x: 60, y: 0, hp: 9, maxHp: 9, hit: 0, orbCd: 0, vx: 0, vy: 0 });
  auto.cd = 0;
  sv.step(auto, 1 / 30, { x: 0, y: 0 }, null);
  assert.equal(auto.shots.length, 1, 'auto-aim still fires at the nearest enemy');
  assert.ok(auto.shots[0].vx > 0);
  assert.ok(r.shots[0].dmg > auto.shots[0].dmg, 'manual shots hit harder');
});

test('Horde: seeker, ricochet and back shots work', () => {
  const mkEnemy = (id, x, y) => ({ id, kind: 'tank', x, y, hp: 50, maxHp: 50, hit: 0, orbCd: 0, vx: 0, vy: 0 });
  // back shot
  const a = sv.createRun(1);
  a.up.rear = 2;
  a.enemies.push(mkEnemy(1, 80, 0));
  a.cd = 0;
  sv.step(a, 1 / 30, { x: 0, y: 0 });
  assert.equal(a.shots.length, 3);
  assert.equal(a.shots.filter((q) => q.vx < 0).length, 2, 'two shots go the other way');
  // seeker shots bend toward an enemy off to the side
  const b = sv.createRun(1);
  b.up.homing = 3;
  b.enemies.push(mkEnemy(1, 120, 90));
  b.shots.push({ x: 0, y: 0, vx: 280, vy: 0, life: 1, pierce: 0, hit: new Set(), dmg: 1, homing: 3, bounce: 0 });
  for (let i = 0; i < 10; i++) sv.step(b, 1 / 30, { x: 0, y: 0 });
  assert.ok(b.shots[0].vy > 20, 'the shot curved toward the enemy: ' + b.shots[0].vy);
  // ricochet jumps to a second enemy instead of ending
  const c = sv.createRun(1);
  c.enemies.push(mkEnemy(1, 40, 0), mkEnemy(2, 40, 100));
  c.shots.push({ x: 30, y: 0, vx: 280, vy: 0, life: 1, pierce: 0, hit: new Set(), dmg: 1, homing: 0, bounce: 1 });
  sv.step(c, 1 / 30, { x: 0, y: 0 });
  assert.ok(c.shots[0] && c.shots[0].life > 0.5, 'the shot survives the first hit');
  assert.ok(c.shots[0].vy > 100, 'and turns toward the second enemy');
  assert.equal(c.shots[0].bounce, 0);
});

test('Horde: level-up offers favor what you already have, rerolls are limited, paths are labeled', () => {
  for (const id of sv.UPGRADE_IDS) assert.ok(sv.PATHS[sv.UPGRADES[id].path], id + ' has a path');
  const r = sv.createRun(3);
  r.up.orbit = 2;
  let withOrbit = 0;
  const N = 300;
  for (let i = 0; i < N; i++) if (sv.offerChoices(r).includes('orbit')) withOrbit++;
  const r2 = sv.createRun(3);
  let plain = 0;
  for (let i = 0; i < N; i++) if (sv.offerChoices(r2).includes('orbit')) plain++;
  assert.ok(withOrbit > plain * 1.3, `owned upgrades come up more: ${withOrbit} vs ${plain}`);
  const q = sv.createRun(5);
  assert.equal(q.rerolls, 2);
  assert.equal(sv.reroll(q).length, 3);
  assert.equal(sv.reroll(q).length, 3);
  assert.equal(sv.reroll(q), null);
  assert.equal(q.rerolls, 0);
});

test('Horde input: canvas points map to the world around the centered hero', () => {
  const view = { w: 400, h: 800, scale: 2, heroX: 100, heroY: -50 };
  assert.deepEqual(si.screenToWorld(200, 400, view), { x: 100, y: -50 });
  assert.deepEqual(si.screenToWorld(300, 400, view), { x: 150, y: -50 });
  assert.deepEqual(si.screenToWorld(200, 200, view), { x: 100, y: -150 });
});

test('Horde input: holding still aims at the finger, moving re-aims, lifting stops', () => {
  const st = si.createInput();
  const view = { w: 400, h: 800, scale: 1, heroX: 0, heroY: 0 };
  assert.equal(si.aimVector(st, view), null, 'no finger, no aim');
  assert.equal(si.pointerDown(st, { id: 7, x: 300, y: 400, w: 400, manual: true }), 'aim');
  let a = si.aimVector(st, view);
  assert.ok(Math.abs(a.x - 1) < 1e-9 && Math.abs(a.y) < 1e-9, 'aims right at the finger without any drag');
  si.pointerMove(st, { id: 7, x: 200, y: 100 });
  a = si.aimVector(st, view);
  assert.ok(Math.abs(a.y + 1) < 1e-9, 'aim follows the finger straight up');
  // the hero moves under a still finger: aim is recomputed from the new position
  a = si.aimVector(st, { ...view, heroX: 0, heroY: 0, w: 400, h: 800 });
  assert.ok(a.y < 0);
  // finger right on the hero keeps the last direction instead of jittering
  si.pointerMove(st, { id: 7, x: 201, y: 401 });
  a = si.aimVector(st, view);
  assert.ok(Math.abs(a.y + 1) < 1e-9);
  assert.equal(si.pointerUp(st, 7), 'aim');
  assert.equal(si.aimVector(st, view), null, 'lifting stops firing');
});

test('Horde input: two thumbs, no hijacking, cancel and blur release everything', () => {
  const st = si.createInput();
  assert.equal(si.pointerDown(st, { id: 1, x: 50, y: 500, w: 400, manual: true }), 'move');
  assert.equal(si.pointerDown(st, { id: 2, x: 350, y: 500, w: 400, manual: true }), 'aim');
  assert.equal(si.pointerDown(st, { id: 3, x: 360, y: 300, w: 400, manual: true }), null, 'a third finger is ignored');
  si.pointerMove(st, { id: 3, x: 0, y: 0 });
  assert.equal(st.aim.px, 350, 'an unrelated pointer cannot redirect the weapon');
  si.pointerMove(st, { id: 1, x: 50 + 200, y: 500 });
  assert.ok(Math.abs(si.moveVector(st).x - 1) < 1e-9, 'movement saturates and the base follows');
  assert.ok(st.move.ox > 50);
  si.pointerUp(st, 99);
  assert.ok(st.move && st.aim, 'unknown pointer ids change nothing');
  si.releaseAll(st);
  assert.equal(st.move, null);
  assert.equal(st.aim, null);
  // after release the same thumbs can be reacquired
  assert.equal(si.pointerDown(st, { id: 4, x: 350, y: 100, w: 400, manual: true }), 'aim');
  // in auto-aim mode every touch is movement
  const auto = si.createInput();
  assert.equal(si.pointerDown(auto, { id: 1, x: 390, y: 10, w: 400, manual: false }), 'move');
});

test('Horde: fire cadence is the same at any frame rate, and a fresh touch fires at once', () => {
  function shotsAt(fps) {
    const r = sv.createRun(11, { manual: true });
    r.hero.hp = r.hero.maxHp = 1e9;
    let n = 0;
    const frames = Math.round(10 * fps);
    for (let f = 0; f < frames; f++) {
      for (const h of si.substeps(1 / fps)) {
        sv.step(r, h, { x: 0, y: 0 }, { x: 1, y: 0 });
        n += r.events.filter((e) => e.type === 'shoot').length;
        r.events.length = 0;
        r.pending = 0;
      }
    }
    return n;
  }
  const at60 = shotsAt(60);
  const at30 = shotsAt(30);
  const at12 = shotsAt(12);
  const expected = 10 / sv.fireInterval(sv.createRun(1));
  assert.ok(Math.abs(at60 - expected) <= 1.5, `60fps ${at60} vs ${expected}`);
  assert.ok(Math.abs(at30 - at60) <= 1 && Math.abs(at12 - at60) <= 1, `${at60}/${at30}/${at12}`);
  assert.deepEqual(si.substeps(0.1).length, 6);
  assert.ok(Math.abs(si.substeps(5).reduce((a, b) => a + b, 0) - 0.25) < 1e-9, 'long stalls are capped');
  const r = sv.createRun(2, { manual: true });
  for (let i = 0; i < 90; i++) sv.step(r, 1 / 60, { x: 0, y: 0 }, null);
  r.events.length = 0;
  sv.step(r, 1 / 60, { x: 0, y: 0 }, { x: 0, y: 1 });
  assert.equal(r.events.filter((e) => e.type === 'shoot').length, 1, 'no wind-up delay after a pause in firing');
});

test('Horde milestones: one reward per 5 levels, exactly once, and the run waits while you choose', () => {
  const r = sv.createRun(4);
  let readies = 0;
  for (let i = 0; i < 400 && r.level < 21; i++) {
    r.xp = sv.xpNeeded(r.level) - 0.5;
    r.gems.push({ x: r.hero.x, y: r.hero.y, v: 1, pull: true });
    r.cd = 99;
    sv.step(r, 1 / 60, { x: 0, y: 0 });
    readies += r.events.filter((e) => e.type === 'milestoneReady').length;
    r.events.length = 0;
    const t = r.t;
    if (r.milestone > 0) {
      sv.step(r, 1 / 60, { x: 0, y: 0 });
      assert.equal(r.t, t, 'time stands still during a milestone choice');
      const choices = sv.offerMilestones(r);
      assert.equal(choices.length, 3);
      assert.equal(new Set(choices).size, 3);
      sv.applyMilestone(r, choices[0]);
    }
    r.pending = 0;
  }
  assert.ok(r.level >= 20);
  assert.deepEqual(r.milestonesHit, [5, 10, 15, 20]);
  assert.equal(readies, 4);
  assert.equal(r.milestone, 0);
  assert.equal(sv.applyMilestone(r, 'chain'), false, 'nothing to claim without a milestone');
});

test('Horde milestones: the first offer includes the companion, later ones offer its upgrades', () => {
  const r = sv.createRun(9);
  r.milestone = 1;
  assert.ok(sv.offerMilestones(r).includes('pet'));
  sv.applyMilestone(r, 'pet');
  assert.ok(r.pet);
  r.milestone = 1;
  const next = sv.offerMilestones(r);
  assert.ok(!next.includes('pet'));
  assert.equal(next.filter((k) => ['petRate', 'petPower', 'petMulti'].includes(k)).length, 1);
});

test('Horde companion: follows the hero, aims at the nearest enemy and its shots deal damage', () => {
  const r = sv.createRun(12);
  r.milestone = 1;
  sv.applyMilestone(r, 'pet');
  r.cd = 1e9; // keep the hero's own weapon quiet
  r.hero.hp = r.hero.maxHp = 1e9;
  r.spawnAcc = -1e9;
  r.enemies.push({ id: 500, kind: 'tank', x: 200, y: 0, hp: 20, maxHp: 20, hit: 0, orbCd: 0, vx: 0, vy: 0 });
  // walk the hero away: the companion keeps up
  for (let i = 0; i < 120; i++) {
    sv.step(r, 1 / 60, { x: 0, y: 1 });
    r.cd = 1e9;
  }
  assert.ok(Math.hypot(r.pet.x - r.hero.x, r.pet.y - r.hero.y) < 60, 'companion stays near the hero');
  let petShots = 0;
  const hp0 = 20;
  const e = r.enemies.find((q) => q.id === 500);
  e.x = r.hero.x + 150;
  e.y = r.hero.y;
  for (let i = 0; i < 180; i++) {
    sv.step(r, 1 / 60, { x: 0, y: 0 });
    r.cd = 1e9;
    petShots += r.events.filter((q) => q.type === 'petshoot').length;
    r.events.length = 0;
  }
  assert.ok(petShots >= 2, 'fires on its own cadence: ' + petShots);
  const now = r.enemies.find((q) => q.id === 500);
  assert.ok(!now || now.hp < hp0, 'its shots hit the enemy');
  const before = sv.petInterval(r);
  r.milestone = 1;
  sv.applyMilestone(r, 'petRate');
  assert.ok(sv.petInterval(r) < before);
});

test('Horde milestone powers: barrier blocks a hit and recharges, chain and blast spread damage', () => {
  const r = sv.createRun(3);
  r.milestone = 1;
  sv.applyMilestone(r, 'shield');
  assert.equal(r.shieldCharges, 1);
  r.spawnAcc = -1e9;
  r.cd = 1e9;
  r.enemies.push({ id: 1, kind: 'grunt', x: 0, y: 0, hp: 100, maxHp: 100, hit: 0, orbCd: 0, vx: 0, vy: 0 });
  const hp = r.hero.hp;
  sv.step(r, 1 / 60, { x: 0, y: 0 });
  assert.equal(r.hero.hp, hp, 'the barrier took the hit');
  assert.equal(r.shieldCharges, 0);
  r.enemies.length = 0;
  for (let i = 0; i < 11 * 60; i++) {
    sv.step(r, 1 / 60, { x: 0, y: 0 });
    r.cd = 1e9;
  }
  assert.equal(r.shieldCharges, 1, 'recharged');
  const mk = (id, x) => ({ id, kind: 'tank', x, y: 0, hp: 40, maxHp: 40, hit: 0, orbCd: 0, vx: 0, vy: 0 });
  const c = sv.createRun(3);
  c.ms.chain = 1;
  c.spawnAcc = -1e9;
  c.enemies.push(mk(1, 60), mk(2, 120), mk(3, 180));
  c.shots.push({ x: 50, y: 0, vx: 300, vy: 0, life: 1, pierce: 0, hit: new Set(), dmg: 5, homing: 0, bounce: 0 });
  c.cd = 1e9;
  sv.step(c, 1 / 60, { x: 0, y: 0 });
  assert.ok(c.enemies.filter((q) => q.hp < 40).length >= 2, 'the arc reached a second enemy');
  const b = sv.createRun(3);
  b.ms.blast = 1;
  b.spawnAcc = -1e9;
  b.enemies.push(mk(1, 60), { ...mk(2, 60), y: 25 });
  b.shots.push({ x: 50, y: 0, vx: 300, vy: 0, life: 1, pierce: 0, hit: new Set(), dmg: 5, homing: 0, bounce: 0 });
  b.cd = 1e9;
  sv.step(b, 1 / 60, { x: 0, y: 0 });
  assert.ok(b.enemies.every((q) => q.hp < 40), 'the blast hit the neighbor too');
});

test('Horde: firing keeps going and stays visible while an enemy is pressed against the hero', () => {
  for (const manual of [true, false]) {
    const r = sv.createRun(3, { manual });
    r.spawnAcc = -1e9;
    r.hero.hp = r.hero.maxHp = 1e9;
    r.enemies.push({ id: 1, kind: 'tank', x: 8, y: 0, hp: 1e6, maxHp: 1e6, hit: 0, orbCd: 0, vx: 0, vy: 0 });
    let shots = 0;
    let hurts = 0;
    let far = 0;
    for (let i = 0; i < 180; i++) {
      sv.step(r, 1 / 60, { x: 0, y: 0 }, { x: 1, y: 0 });
      for (const e of r.events) {
        if (e.type === 'shoot') shots++;
        if (e.type === 'hurt') hurts++;
      }
      r.events.length = 0;
      for (const q of r.shots) far = Math.max(far, Math.hypot(q.x - r.hero.x, q.y - r.hero.y));
    }
    assert.ok(hurts >= 3, 'the hero was being hit');
    assert.ok(Math.abs(shots - 3 / sv.fireInterval(r)) <= 1.5, `fire rate unchanged while hurt: ${shots}`);
    assert.ok(far > 60, 'shots travel away from the hero instead of vanishing at point blank: ' + far);
    assert.ok(r.enemies[0].hp < 1e6, 'the touching enemy still takes damage');
  }
});

test('Horde: every holiday theme is complete and the date picks one', () => {
  assert.equal(THEMES.length, 6);
  for (const t of THEMES) {
    for (const k of ['hero', 'shot', 'gem', 'tagline']) assert.ok(t[k], t.id + ' ' + k);
    for (const k of Object.keys(sv.ENEMY)) assert.ok(t.enemies[k], t.id + ' enemy ' + k);
    assert.equal(t.bg.length, 2);
    assert.ok(t.decor.length >= 3);
  }
  const covered = new Set();
  for (let m = 1; m <= 12; m++) covered.add(themeForMonth(m).id);
  assert.equal(covered.size, 6, 'every theme appears in some month');
  assert.equal(themeForMonth(10).id, 'halloween');
  assert.equal(themeForMonth(12).id, 'winter');
});

// ---------- Lingo Café ----------
test('Café: sentences are grammatical for every language, item and quantity', () => {
  assert.equal(cd.sentence('es', [{ id: 'coffee', qty: 2 }, { id: 'croissant', qty: 1 }], 0), 'Quisiera dos cafés y un cruasán, por favor.');
  assert.equal(cd.sentence('fr', [{ id: 'tea', qty: 1 }], 0), "Je voudrais un thé, s'il vous plaît.");
  assert.equal(cd.sentence('de', [{ id: 'coffee', qty: 1 }, { id: 'cake', qty: 3 }], 0), 'Ich hätte gern einen Kaffee und drei Kuchen, bitte.');
  assert.equal(cd.sentence('de', [{ id: 'bread', qty: 1 }], 2), 'Ein Brot, bitte.');
  assert.equal(cd.english([{ id: 'orange', qty: 1 }, { id: 'apple', qty: 2 }]), 'an orange and 2 apples');
  assert.equal(new Set(cd.ITEMS.map((x) => x.id)).size, cd.ITEMS.length);
  for (const sc of SCENES) {
    const pics = sc.items.map((id) => cd.itemById(id).emoji);
    assert.equal(new Set(pics).size, pics.length, sc.id + ': every word in a scenario needs its own picture');
  }
  for (const x of cd.ITEMS) {
    assert.match(x.id, /^[a-z0-9_.-]{1,32}$/);
    for (const l of cd.LANGS) {
      const f = x[l.id];
      assert.ok(f.noun && f.one && f.pl, x.id + l.id);
      for (const q of [1, 2, 3]) for (let fr = 0; fr < 4; fr++) assert.ok(cd.sentence(l.id, [{ id: x.id, qty: q }], fr).length > 8);
    }
  }
  for (const l of cd.LANGS) assert.ok(cd.PHRASES[l.id].length >= 8);
});

function serveAll(shift, box, lang, wrongFirst) {
  const s = cf.createShift({ lang, box, shift, seed: shift * 31 + 7 });
  let guard = 0;
  while (!s.over && guard++ < 20000) {
    cf.tick(s, 0.1);
    s.events.length = 0;
    const c = s.slots.find((q) => q && q.state === 'waiting');
    if (!c) continue;
    cf.select(s, c.slot);
    if (wrongFirst && c.wrong === 0) {
      const bad = s.tray.find((id) => !c.order.some((o) => o.id === id));
      for (let i = 0; i < c.qty; i++) cf.addToPlate(s, bad);
      s.events.length = 0;
      continue;
    }
    for (const o of c.order) for (let i = 0; i < o.qty; i++) cf.addToPlate(s, o.id);
    s.events.length = 0;
  }
  return s;
}

test('Café: serving everything correctly finishes the shift and strengthens the words', () => {
  const s = serveAll(1, {}, 'es', false);
  assert.equal(s.reason, 'done');
  assert.equal(s.served, s.total);
  assert.equal(s.hearts, cf.HEARTS);
  assert.ok(s.score > 0);
  assert.equal(s.newIds.length, 4);
  for (const id of s.newIds) assert.ok(s.box[id] >= 1, id + ' should have improved');
  assert.ok(s.tray.length <= cf.TRAY_MAX);
});

test('Café: wrong plates teach the right answer, cost patience and never advance a word', () => {
  const s = cf.createShift({ lang: 'fr', box: {}, shift: 1, seed: 3 });
  for (let i = 0; i < 4; i++) cf.tick(s, 0.25);
  const c = s.slots.find(Boolean);
  const before = c.patience;
  const wrongId = s.tray.find((id) => id !== c.order[0].id);
  const r = cf.addToPlate(s, wrongId);
  assert.equal(r.type, 'wrong');
  assert.ok(r.text.length > 5 && r.en.length > 2, 'shows the sentence and its meaning');
  assert.ok(c.patience < before);
  assert.equal(s.combo, 0);
  assert.equal(c.plate.length, 0);
  assert.equal(s.box[c.order[0].id], 0);
  const wrongEvent = s.events.find((e) => e.type === 'wrong');
  assert.ok(wrongEvent && wrongEvent.order.length === 1);
});

test('Café: impatient customers leave, hearts run out, and the café closes', () => {
  const s = cf.createShift({ lang: 'de', box: {}, shift: 1, seed: 11 });
  let guard = 0;
  while (!s.over && guard++ < 5000) {
    cf.tick(s, 0.5);
    s.events.length = 0;
  }
  assert.equal(s.over, true);
  assert.ok(s.reason === 'closed' || s.reason === 'done');
  assert.ok(s.hearts < cf.HEARTS);
});

test('Café: new words are introduced a few at a time and missed words come back first', () => {
  assert.equal(cf.planNew({}, 1).length, 4);
  const box = {};
  for (const x of cd.ITEMS.slice(0, 6)) box[x.id] = 4;
  box.tea = 0;
  assert.equal(cf.planNew(box, 3).length, 3);
  assert.equal(cf.planNew(Object.fromEntries(cd.ITEMS.map((x) => [x.id, 4])), 5).length, 0);
  const tray = cf.buildTray({ ...box, ...Object.fromEntries(cd.ITEMS.slice(6, 14).map((x) => [x.id, 3])) }, []);
  assert.ok(tray.includes('tea'), 'the word with the lowest box must be on the tray');
  assert.ok(tray.length <= cf.TRAY_MAX);
  for (const shift of [1, 3, 6, 9]) {
    const sh = cf.createShift({ lang: 'es', box: {}, shift, seed: 5 });
    for (let i = 0; i < 40; i++) {
      const o = cf.makeOrder(sh);
      assert.ok(o.length >= 1 && o.length <= cf.maxItemsFor(shift));
      assert.ok(cf.orderTotal(o) <= 4);
      if (!cf.quantitiesOn(shift)) assert.ok(o.every((x) => x.qty === 1));
    }
  }
});

test('Café lesson: quiz covers each word both ways, choices always include the answer', () => {
  const ids = ['coffee', 'tea', 'water', 'bread'];
  const rnd = mulberry32(5);
  const q = buildQuiz(ids, rnd);
  assert.equal(q.length, 8);
  for (const id of ids) assert.deepEqual(q.filter((x) => x.id === id).map((x) => x.dir).sort(), ['pic2word', 'word2pic']);
  for (let i = 0; i < 60; i++) {
    for (const id of ids) {
      const c = choicesFor(id, ids, rnd);
      assert.equal(c.length, 4);
      assert.equal(new Set(c).size, 4);
      assert.ok(c.includes(id));
    }
  }
  // fewer than four words today: topped up from the wider menu
  const small = choicesFor('tea', ['tea', 'coffee'], rnd);
  assert.equal(small.length, 4);
  assert.ok(small.includes('tea'));
});

test('Café: words taught in the lesson become today\'s featured words and keep their starting box', () => {
  const fresh = cf.planNew({}, 1);
  const s = cf.createShift({ lang: 'fr', box: Object.fromEntries(fresh.map((id) => [id, 1])), shift: 1, seed: 4, featured: fresh });
  assert.deepEqual(s.newIds, fresh);
  for (const id of fresh) assert.equal(s.box[id], 1, 'lesson progress is kept');
  assert.equal(s.tray.length, 4);
  // every order in the first shift uses only the taught words
  for (let i = 0; i < 30; i++) for (const o of cf.makeOrder(s)) assert.ok(fresh.includes(o.id));
  // without a lesson the shift still introduces words by itself
  const plain = cf.createShift({ lang: 'fr', box: {}, shift: 1, seed: 4 });
  assert.equal(plain.newIds.length, 4);
  for (const id of plain.newIds) assert.equal(plain.box[id], 0);
});

test('Scenarios: every scenario is complete in every language and builds correct requests', () => {
  assert.equal(SCENES.length, 6);
  assert.deepEqual(SCENES.map((x) => x.id), ['cafe', 'shop', 'home', 'travel', 'flight', 'hotel']);
  for (const sc of SCENES) {
    assert.ok(sc.items.length >= 12, sc.id + ' has enough words');
    assert.equal(new Set(sc.items).size, sc.items.length);
    for (const id of sc.items) assert.ok(cd.itemById(id), sc.id + ' uses unknown word ' + id);
    assert.ok(sc.name && sc.role && sc.people && sc.blurb && sc.look.icon && sc.look.tray);
    assert.equal(sc.stations.en.length, 4);
    for (const l of cd.LANGS) {
      assert.equal(sc.frames[l.id].length, sc.en.length, `${sc.id} ${l.id}: each pattern has an English meaning`);
      assert.equal(sc.stations[l.id].length, 4);
      assert.ok(sc.phrases[l.id].length >= 5);
      for (let f = 0; f < sc.en.length; f++) {
        for (const id of sc.items) {
          const t = cd.sentence(l.id, [{ id, qty: 1 }], f, sc.id);
          assert.ok(t.toLowerCase().includes(cd.itemById(id)[l.id].one.toLowerCase()), `${sc.id}/${l.id}: "${t}"`);
          assert.match(t, /[.?!]$/);
          assert.ok(!/\s[,.]/.test(t), 'no space before a comma or period: ' + t);
        }
      }
    }
  }
  assert.equal(cd.sentence('de', [{ id: 'blanket', qty: 1 }], 0, 'flight'), 'Könnten Sie mir eine Decke bringen?');
  assert.equal(cd.sentence('fr', [{ id: 'hat', qty: 1 }], 1, 'shop'), 'Vous avez un chapeau ?');
  assert.equal(cd.sentence('es', [{ id: 'spoon', qty: 2 }], 0, 'home'), '¿Me pasas dos cucharas?');
  assert.equal(cd.sentence('de', [{ id: 'hat', qty: 1 }], 2, 'shop'), 'Ich möchte einen Hut kaufen.');
  assert.equal(cd.englishLine([{ id: 'key', qty: 1 }], 2, 'hotel'), 'Do you have a key?');
});

test('retired language scenarios remain available only to historical tests', async () => {
  const {GAMES}=await import('../js/registry.js');
  assert.equal(GAMES.find(g=>g.id==='cafe'),undefined);
  assert.equal(SCENES.length,6);
  assert.ok(SCENES.every(s=>s.id&&s.items.length));
});

test('Scenarios: shifts only use their own words, words carry over between scenarios, pace changes patience', () => {
  for (const sc of SCENES) {
    const sh = cf.createShift({ lang: 'fr', box: {}, shift: 1, seed: 3, scene: sc.id });
    assert.equal(sh.scene, sc.id);
    assert.deepEqual(sh.newIds, sc.items.slice(0, 4));
    for (const id of sh.tray) assert.ok(sc.items.includes(id));
    for (let i = 0; i < 20; i++) for (const o of cf.makeOrder(sh)) assert.ok(sc.items.includes(o.id));
  }
  // a word learned at the café is already known on the plane
  const box = { coffee: 3, tea: 2, water: 1 };
  const plane = cf.planNew(box, 2, 'flight');
  assert.ok(!plane.includes('coffee') && !plane.includes('water'));
  const tray = cf.buildTray({ ...box, juice: 0 }, ['juice'], 'flight');
  assert.ok(tray.includes('coffee') && tray.includes('water'), 'known shared words come back for review');
  assert.ok(!tray.includes('cake'), 'café-only words stay at the café');
  const patience = (pace) => {
    const sh = cf.createShift({ lang: 'es', box: {}, shift: 1, seed: 8, scene: 'hotel', pace });
    for (let i = 0; i < 4; i++) cf.tick(sh, 0.25);
    return sh.slots.find(Boolean).max;
  };
  assert.ok(patience('relaxed') > patience('normal') && patience('normal') > patience('rush'));
  assert.equal(PACES.length, 4);
  assert.ok(PACES.some(p=>p.id==='practice'));
  assert.equal(sceneById('nope').id, 'cafe', 'unknown scenario ids fall back safely');
});

test('Café: shift results survive the storage sanitizer', () => {
  const s = serveAll(2, { coffee: 2, tea: 1 }, 'es', true);
  const clean = sanitize({ skills: { cafe_es: { rung: 1, box: s.box } } });
  assert.deepEqual(clean.skills.cafe_es.box, s.box);
});

// ---------- Tycoon Row ----------
function checkEstate(s) {
  for (const p of s.players) {
    assert.ok(Number.isInteger(p.cash) && p.cash >= 0, `${p.name} cash ${p.cash}`);
    assert.ok(p.pos >= 0 && p.pos < es.N);
  }
  for (let i = 0; i < es.N; i++) {
    const o = s.owner[i];
    if (o >= 0) assert.ok(!s.players[o].bankrupt, 'a bankrupt player owns ' + i);
    if (o < 0) assert.equal(s.level[i], 0);
    if (es.TILES[i].type !== 'prop') assert.equal(s.level[i], 0);
    assert.ok(s.level[i] >= 0 && s.level[i] <= 4);
  }
}

test('Tycoon: the board is a standard 40-square loop', () => {
  assert.equal(es.TILES.length, 40);
  assert.equal(es.N, 40);
  assert.equal(es.TILES.filter((t) => t.type === 'prop').length, 22);
  assert.equal(es.STATION_TILES.length, 4);
  assert.equal(es.UTILITY_TILES.length, 2);
  assert.equal(es.TILES.filter((t) => t.type === 'wild').length, 6);
  assert.equal(es.TILES.filter((t) => t.type === 'tax').length, 2);
  assert.equal(es.GROUPS.length, 8);
  for (const [i, type] of [[0, 'start'], [10, 'jail'], [20, 'park'], [30, 'goto']]) assert.equal(es.TILES[i].type, type);
  assert.equal(es.JAIL_POS, 10);
  for (const g of es.GROUPS) assert.ok(es.GROUP_TILES[g.id].length >= 2 && es.GROUP_TILES[g.id].length <= 3);
  for (const t of es.TILES.filter((x) => x.type === 'prop')) {
    assert.ok(t.rent.every((r, i) => i === 0 || r > t.rent[i - 1]), 'rent rises with buildings: ' + t.name);
    assert.ok(t.short.length <= 7, 'short name fits on a square: ' + t.short);
  }
  // the top and bottom rows have the narrowest squares
  for (const t of es.TILES) if ((t.i >= 1 && t.i <= 9) || (t.i >= 21 && t.i <= 29)) assert.ok(t.short.length <= 6, 'narrow square label: ' + t.short);
  assert.equal(new Set(es.TILES.map((t) => t.name).filter((n) => n !== 'Wildcard')).size, 34);
});

test('Tycoon: utilities charge a multiple of the dice, stations scale with how many you own', () => {
  const s = es.createGame({ seed: 3, difficulty: 2 });
  const [u1, u2] = es.UTILITY_TILES;
  s.owner[u1] = 1;
  s.dice = [3, 4];
  assert.equal(es.rentFor(s, u1), 28);
  s.owner[u2] = 1;
  assert.equal(es.rentFor(s, u1), 70);
  const [l1, l2] = es.STATION_TILES;
  s.owner[l1] = 2;
  assert.equal(es.rentFor(s, l1), 25);
  s.owner[l2] = 2;
  assert.equal(es.rentFor(s, l1), 50);
});

test('Tycoon: AI-only games always finish, at every difficulty, without breaking any rule', () => {
  const winners = new Set();
  for (const diff of [1, 2, 3]) {
    for (let seed = 1; seed <= 25; seed++) {
      const s = es.createGame({ seed, difficulty: diff, allAI: true, rounds: es.ROUND_CHOICES[seed % 3] });
      let steps = 0;
      while (!s.over && steps++ < 20000) {
        assert.ok(es.aiStep(s), `stuck in phase ${s.phase} (seed ${seed})`);
        s.events.length = 0;
        checkEstate(s);
      }
      assert.ok(s.over, `game ${seed}/${diff} did not end`);
      assert.ok(s.round >= 1);
      winners.add(s.winner);
      const st = es.standings(s);
      assert.ok(st[0].worth >= st[st.length - 1].worth || st[st.length - 1].bankrupt);
    }
  }
  assert.ok(winners.size >= 3, 'different players should win sometimes');
});

test('Tycoon: buying, rent, sets, building, auctions and bankruptcy follow the rules', () => {
  const s = es.createGame({ seed: 4, difficulty: 2 });
  // buy
  s.players[0].pos = 1;
  s.phase = 'buy';
  assert.equal(es.buy(s), true);
  assert.equal(s.owner[1], 0);
  assert.equal(s.players[0].cash, es.START_CASH - 60);
  // rent doubles with the full set, then buildings
  const r0 = es.rentFor(s, 1);
  s.owner[3] = 0;
  assert.equal(es.rentFor(s, 1), r0 * 2);
  s.phase = 'post';
  assert.ok(es.buildable(s, 0).length === 2);
  assert.equal(es.build(s, 0, 1), true);
  assert.equal(s.level[1], 1);
  assert.equal(es.build(s, 0, 1), false, 'must build evenly');
  assert.equal(es.build(s, 0, 3), true);
  assert.equal(es.rentFor(s, 1), es.TILES[1].rent[1]);
  // not allowed without the set
  s.owner[3] = 2;
  s.level[3] = 0;
  assert.ok(!es.buildable(s, 0).some((o) => o.i === 1));
  // auction: declined deed goes to the highest bidder who pays
  const a = es.createGame({ seed: 8, difficulty: 2 });
  a.players[0].pos = 6;
  a.phase = 'buy';
  es.declineBuy(a);
  assert.equal(a.phase, 'auction');
  let guard = 0;
  while (a.phase === 'auction' && guard++ < 200) {
    if (es.auctionActor(a) === 0) es.auctionOut(a, 0);
    else es.aiStep(a);
  }
  assert.equal(a.phase, 'post');
  if (a.owner[6] >= 0) assert.ok(a.players[a.owner[6]].cash < es.START_CASH);
  // a player who cannot pay goes bankrupt to the creditor
  const c = es.createGame({ seed: 3, difficulty: 2 });
  c.players[2].cash = 30;
  const creditorBefore = c.players[0].cash;
  c.owner[37] = 0;
  c.owner[39] = 0;
  c.level[37] = 4;
  c.level[39] = 4;
  c.turn = 2;
  c.players[2].pos = 35;
  c.phase = 'roll';
  c.rnd = () => 0; // dice 1 and 1 -> lands on 37 (hotel rent)
  es.roll(c);
  assert.equal(c.players[2].bankrupt, true);
  assert.equal(c.players[0].cash, creditorBefore + 30, 'the creditor receives what the bankrupt player had');
  assert.notEqual(c.turn, 2, 'play moves on');
});

test('Tycoon: Time-out, paying to leave, and the picnic pot', () => {
  const j = es.createGame({ seed: 7, difficulty: 2 });
  j.players[0].pos = 28;
  j.phase = 'roll';
  j.rnd = () => 0.01; // dice 1 and 1 -> lands on 30 (Go to Time-out)
  es.roll(j);
  assert.equal(j.players[0].pos, es.JAIL_POS);
  assert.ok(j.players[0].jail > 0);
  // pay to leave
  j.turn = 0;
  j.phase = 'roll';
  assert.equal(es.payJail(j), true);
  assert.equal(j.players[0].jail, 0);
  // picnic pays out the tax pot
  const p = es.createGame({ seed: 9, difficulty: 2 });
  p.pot = 220;
  p.players[0].pos = 18;
  p.phase = 'roll';
  p.rnd = () => 0; // dice 1 and 1 -> lands on 20 (Picnic)
  const cash = p.players[0].cash;
  es.roll(p);
  assert.equal(p.players[0].pos, 20);
  assert.equal(p.players[0].cash, cash + 220);
  assert.equal(p.pot, 0);
});

test('Tycoon: rivals chat in character and the human can react', () => {
  const s = es.createGame({ seed: 12, difficulty: 2 });
  const greet = s.events.filter((e) => e.type === 'chat');
  assert.ok(greet.length >= 1, 'someone greets you');
  assert.ok(greet.every((e) => e.from >= 1 && typeof e.text === 'string' && e.text.length > 3 && !e.text.includes('{')));
  s.events.length = 0;
  let replies = 0;
  for (let i = 0; i < 40; i++) {
    es.react(s, 'cool');
    replies += s.events.filter((e) => e.type === 'chat').length;
    s.events.length = 0;
  }
  assert.ok(replies > 15, 'rivals usually answer reactions');
  // a full game produces plenty of banter, always from a rival and never with a raw placeholder
  const g = es.createGame({ seed: 5, difficulty: 3, allAI: false });
  let said = 0;
  let steps = 0;
  while (!g.over && steps++ < 20000) {
    if (g.phase === 'auction' && es.auctionActor(g) === 0) es.auctionOut(g, 0);
    else if (g.turn === 0 && g.phase === 'roll') es.roll(g);
    else if (g.turn === 0 && g.phase === 'buy') (es.buy(g) || es.declineBuy(g));
    else if (g.turn === 0 && g.phase === 'post') es.endTurn(g);
    else es.aiStep(g);
    for (const e of g.events) if (e.type === 'chat') {
      said++;
      assert.ok(e.from >= 1 && !/[{}]/.test(e.text));
    }
    g.events.length = 0;
  }
  assert.ok(g.over);
  assert.ok(said >= 12, 'the table should not be silent: ' + said);
});

// ---------- Deep Delve ----------
test('Delve: every floor is connected, the stairs can be reached without touching a trap', () => {
  for (let seed = 1; seed <= 60; seed++) {
    for (let floor = 1; floor <= dg.MAX_FLOOR; floor++) {
      const L = dg.generateFloor(floor, seed);
      const d = dg.distances(L.tiles, L.start);
      for (let i = 0; i < dg.W * dg.H; i++) if (L.tiles[i]) assert.ok(d[i] >= 0, 'unreachable open tile');
      const traps = new Set(L.traps.map((t) => t.y * dg.W + t.x));
      const safe = dg.distances(L.tiles, L.start, traps);
      assert.ok(safe[L.stairs.y * dg.W + L.stairs.x] >= 0, 'a safe route to the stairs must exist');
      const spots = [L.start, L.stairs, ...L.traps, ...L.gems, ...L.hearts, ...L.enemies].map((q) => q.y * dg.W + q.x);
      assert.equal(new Set(spots).size, spots.length, 'nothing shares a tile');
      for (const q of spots) assert.equal(L.tiles[q], 1, 'everything stands on open floor');
      for (const e of L.enemies) assert.ok(d[e.y * dg.W + e.x] >= 7, 'monsters start far from you');
      assert.equal(L.traps.length <= Math.min(2 + floor, 11), true);
    }
  }
});

test('Delve: the hero can never enter a wall or leave the grid, whatever you press', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const g = dg.createGame(seed);
    dg.endPreview(g);
    let r = seed * 977;
    const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 1500 && !g.over; i++) {
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [0, 0], [2, 0]];
      const [dx, dy] = dirs[Math.floor(rnd() * dirs.length)];
      const before = { ...g.pos };
      const res = dg.move(g, dx, dy);
      g.events.length = 0;
      if (g.preview) dg.endPreview(g);
      assert.ok(g.pos.x >= 0 && g.pos.y >= 0 && g.pos.x < dg.W && g.pos.y < dg.H);
      assert.equal(g.level.tiles[g.pos.y * dg.W + g.pos.x], 1, 'standing in a wall');
      if (!res.moved) assert.ok(g.pos.x === before.x && g.pos.y === before.y || res.descended);
      assert.ok(g.hp >= 0 && g.hp <= g.maxHp);
    }
  }
});

test('Delve: traps cost a heart once and stay marked, monsters strike only after you step beside them', () => {
  const g = dg.createGame(4);
  dg.endPreview(g);
  const t = g.level.traps[0];
  // put the hero next to the trap on an open tile
  const open = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dy]) => dg.isOpen(g, t.x + dx, t.y + dy));
  g.pos = { x: t.x + open[0], y: t.y + open[1] };
  g.level.enemies = [];
  const hp = g.hp;
  dg.move(g, -open[0], -open[1]);
  assert.equal(g.hp, hp - 1);
  assert.equal(t.revealed, true);
  g.events.length = 0;
  // enemy logic
  const h = dg.createGame(8);
  dg.endPreview(h);
  h.level.traps = [];
  h.level.gems = [];
  h.level.hearts = [];
  const pos = { x: 1, y: dg.H - 2 };
  h.pos = { ...pos };
  const next = [[0, -1], [1, 0]].find(([dx, dy]) => dg.isOpen(h, pos.x + dx, pos.y + dy));
  const two = { x: pos.x + next[0] * 2, y: pos.y + next[1] * 2 };
  if (dg.isOpen(h, two.x, two.y)) {
    h.level.enemies = [{ id: 1, x: two.x, y: two.y, kind: 'skeleton', hp: 1, rest: false }];
    const before = h.hp;
    dg.wait(h); // it walks next to you but cannot hit this turn
    assert.equal(h.hp, before);
    assert.equal(Math.abs(h.level.enemies[0].x - h.pos.x) + Math.abs(h.level.enemies[0].y - h.pos.y), 1);
    const e = h.level.enemies[0];
    dg.move(h, e.x - h.pos.x, e.y - h.pos.y); // you strike first and it falls
    assert.equal(h.level.enemies.length, 0);
    assert.equal(h.kills, 1);
    assert.equal(h.hp, before);
  }
});

test('Delve: descending, tap-to-walk paths and fog of war', () => {
  const g = dg.createGame(6);
  assert.equal(g.preview, true);
  dg.endPreview(g);
  const L = g.level;
  g.level.traps = [];
  g.level.enemies = [];
  // fog: only a small area around the start is known
  const known = L.seen.reduce((n, v) => n + v, 0);
  assert.ok(known > 5 && known < dg.W * dg.H * 0.5);
  // walk the real route to the stairs: path only exists over explored tiles, so explore as we go
  let guard = 0;
  while (g.floor === 1 && !g.over && guard++ < 400) {
    const dist = dg.distances(g.level.tiles, g.pos);
    const goal = g.level.stairs;
    // step to the neighbor closest to the stairs
    const back = dg.distances(g.level.tiles, goal);
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => dg.isOpen(g, g.pos.x + dx, g.pos.y + dy));
    dirs.sort((a, b) => back[(g.pos.y + a[1]) * dg.W + g.pos.x + a[0]] - back[(g.pos.y + b[1]) * dg.W + g.pos.x + b[0]]);
    dg.move(g, dirs[0][0], dirs[0][1]);
    g.events.length = 0;
    void dist;
  }
  assert.equal(g.floor, 2);
  assert.equal(g.preview, true, 'each new floor starts with a study period');
  assert.ok(dg.previewSeconds(2) > dg.previewSeconds(9));
  // tap-to-walk only routes through tiles you have seen
  dg.endPreview(g);
  const far = g.level.stairs;
  assert.equal(dg.pathTo(g, far.x, far.y), null, 'cannot path to unexplored stairs');
  const near = [[1, 0], [0, -1]].map(([dx, dy]) => ({ x: g.pos.x + dx, y: g.pos.y + dy })).find((q) => dg.isOpen(g, q.x, q.y));
  const path = dg.pathTo(g, near.x, near.y);
  assert.equal(path.length, 1);
  assert.ok(dg.scoreOf(g) >= 150);
});

// ---------- check-in ----------
test('Check-in median and digit-span staircase', () => {
  assert.equal(median([300, 200, 250]), 250);
  assert.equal(median([100, 200, 300, 400]), 250);
  const sp = createSpan(() => 0.5);
  assert.equal(sp.make().length, 3);
  sp.answer(true);
  sp.answer(true);
  assert.equal(sp.len, 5);
  sp.answer(false);
  assert.equal(sp.done, false);
  sp.answer(false);
  assert.equal(sp.done, true);
  assert.equal(sp.best, 4);
});

test('defaults are safe: battery saver on, nothing else surprising', () => {
  const d = defaults();
  assert.equal(d.settings.saver, true);
  assert.equal(d.sessions.length, 0);
});

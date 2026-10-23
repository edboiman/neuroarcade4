// Holiday Horde: the rules engine. Pure functions, no DOM, fully deterministic for a seed.
// World units are "logical pixels"; the screen shows about 400 units across its shorter side.
import { mulberry32, weighted } from './rng.js';

export const RUN_SECONDS = 240;
export const HERO_R = 10;
const MAX_ENEMIES = 240;
const MAX_GEMS = 260;

export const ENEMY = {
  grunt: { hp: 1.5, speed: 40, dmg: 6, r: 11, xp: 1, size: 26 },
  swift: { hp: 1, speed: 80, dmg: 5, r: 9, xp: 1, size: 22 },
  tank: { hp: 8, speed: 30, dmg: 12, r: 15, xp: 3, size: 38 },
  swarm: { hp: 1, speed: 56, dmg: 4, r: 8, xp: 1, size: 20 },
  boss: { hp: 80, speed: 34, dmg: 16, r: 24, xp: 6, size: 64 },
};

// path: gun = how you shoot, guard = how you survive up close, move = how you travel and collect.
export const PATHS = { gun: 'Gunner', guard: 'Guardian', move: 'Runner' };
export const UPGRADES = {
  axes: { path: 'gun', name: 'Crescent axes', icon: '☾', max: 4, text: 'Lob spinning blades into the horde. Evolution: Lv 4 + Hit harder Lv 3.' },
  storm: { path: 'gun', name: 'Stormcall', icon: 'ϟ', max: 4, text: 'Lightning strikes nearby enemies. Evolution: Lv 4 + Magnet Lv 3.' },
  tome: { path: 'guard', name: 'Ember scripture', icon: '♨', max: 4, text: 'Scorch the ground beneath enemies. Evolution: Lv 4 + Recover Lv 2.' },
  multi: { path: 'gun', name: 'Extra shot', icon: '🎯', max: 4, text: 'Fire one more projectile at once.' },
  rate: { path: 'gun', name: 'Quick hands', icon: '⚡', max: 5, text: 'Shoot 15% faster.' },
  power: { path: 'gun', name: 'Hit harder', icon: '💪', max: 5, text: 'Shots do more damage.' },
  pierce: { path: 'gun', name: 'Pierce', icon: '🏹', max: 3, text: 'Shots pass through one more enemy.' },
  homing: { path: 'gun', name: 'Seeker shots', icon: '🧭', max: 3, text: 'Shots curve toward nearby enemies.' },
  bounce: { path: 'gun', name: 'Ricochet', icon: '🔁', max: 3, text: 'A shot that hits jumps to another enemy.' },
  rear: { path: 'gun', name: 'Back shot', icon: '↩️', max: 2, text: 'Also fire behind you.' },
  orbit: { path: 'guard', name: 'Orbit blades', icon: '🛡️', max: 4, text: 'Blades circle you. Evolution: Lv 4 + Light feet Lv 3.' },
  nova: { path: 'guard', name: 'Shock pulse', icon: '💥', max: 4, text: 'A pulse around you. Evolution: Lv 4 + Tough Lv 3.' },
  heart: { path: 'guard', name: 'Tough', icon: '❤️', max: 5, text: '+25 max health and heal 25.' },
  regen: { path: 'guard', name: 'Recover', icon: '🩹', max: 4, text: 'Slowly heal over time.' },
  speed: { path: 'move', name: 'Light feet', icon: '👟', max: 5, text: 'Move 9% faster.' },
  magnet: { path: 'move', name: 'Magnet', icon: '🧲', max: 4, text: 'Pick up gems from farther away.' },
};
export const UPGRADE_IDS = Object.keys(UPGRADES);

export const xpNeeded = (level) => 4 + level * 3;

// ----- milestone rewards: every MILESTONE_EVERY levels, a bigger pick from three -----
export const MILESTONE_EVERY = 5;
export const MILESTONES = {
  pet: { name: 'Companion', icon: '🦉', text: 'A companion follows you and shoots the nearest enemy on its own.' },
  petRate: { name: 'Companion: quick wings', icon: '💨', text: 'Your companion fires 30% faster.', needs: 'pet', max: 3 },
  petPower: { name: 'Companion: sharp eyes', icon: '🎯', text: 'Companion shots hit much harder and reach farther.', needs: 'pet', max: 3 },
  petMulti: { name: 'Companion: twin shot', icon: '✌️', text: 'Your companion fires one more shot at a time.', needs: 'pet', max: 2 },
  chain: { name: 'Chain lightning', icon: '⚡', text: 'Every hit arcs to nearby enemies. Picking it again adds an arc.', max: 3 },
  blast: { name: 'Blast shots', icon: '💣', text: 'Shots burst on impact and hurt everything close by.', max: 3 },
  shield: { name: 'Barrier', icon: '🔰', text: 'Blocks a hit, then recharges every 10 seconds. Again: one more charge.', max: 3 },
  frenzy: { name: 'Frenzy', icon: '🔥', text: 'All your weapons fire 25% faster.', max: 2 },
  surge: { name: 'Gem surge', icon: '💎', text: 'Gems give 30% more experience.', max: 2 },
  feast: { name: 'Feast', icon: '🍗', text: 'Heal fully and gain 30 max health.', max: 99 },
};
export const MILESTONE_IDS = Object.keys(MILESTONES);
const PET_IDS = ['petRate', 'petPower', 'petMulti'];

const MUZZLE = 12;
const POINT_BLANK = 0.08;
export const MANUAL_BONUS = 1.35; // aiming yourself is harder, so it hits harder
export const REROLLS = 2;

export function createRun(seed = 1, { manual = false, duration = RUN_SECONDS, modern = false } = {}) {
  const rnd = mulberry32(seed);
  return {
    seed,
    rnd,
    manual,
    duration, modern, chests: [], pools: [], weaponCd: {axes:1,storm:2,tome:3}, evolutions: [],
    rerolls: REROLLS,
    t: 0,
    over: false,
    reason: null,
    hero: { x: 0, y: 0, hp: 100, maxHp: 100, iframe: 0, face: 1 },
    view: { hw: 200, hh: 360 },
    enemies: [],
    shots: [],
    gems: [],
    kills: 0,
    level: 1,
    xp: 0,
    pending: 0,
    up: Object.fromEntries(UPGRADE_IDS.map((k) => [k, 0])),
    cd: 0.4,
    novaCd: 6,
    orbAngle: 0,
    spawnAcc: 0,
    waveDone: {},
    bossDone: {},
    events: [],
    nextId: 1,
    hurtTotal: 0,
    milestone: 0, // milestone rewards waiting to be chosen
    milestonesHit: [], // levels that already gave one, so each fires exactly once
    ms: Object.fromEntries(MILESTONE_IDS.map((k) => [k, 0])),
    pet: null,
    shieldCd: 0,
    shieldCharges: 0,
    hazards: [], hazardNext: 25,
  };
}

// ----- derived stats -----
export const heroSpeed = (r) => 108 * (1 + 0.09 * r.up.speed);
export const fireInterval = (r) => 0.62 * Math.pow(0.86, r.up.rate) * Math.pow(0.8, r.ms ? r.ms.frenzy : 0);
export const shotCount = (r) => 1 + r.up.multi;
export const shotDamage = (r) => 1.5 + 0.6 * r.up.power;
export const shotPierce = (r) => r.up.pierce;
export const magnetRadius = (r) => 46 * (1 + 0.45 * r.up.magnet);
export const orbCount = (r) => r.up.orbit + (r.evolutions?.includes('orbit') ? 2 : 0);
export const novaInterval = (r) => 7.5 - r.up.nova * 1.1;
export const regenRate = (r) => 0.6 * r.up.regen;
const hpScale = (t) => 1 + t / 110;
const speedScale = (t) => 1 + t / 300;
const spawnRate = (t) => 1.1 + t * 0.02;

// ----- level-up choices -----
// Upgrades you already have are more likely to come back, so a build can take shape.
export function offerChoices(run, n = 3) {
  const open = UPGRADE_IDS.filter((k) => run.up[k] < UPGRADES[k].max);
  const picks = [];
  while (picks.length < n && open.length) {
    const items = open.map((k) => [k, run.up[k] > 0 ? 2.6 : 1]);
    const k = weighted(run.rnd, items);
    picks.push(k);
    open.splice(open.indexOf(k), 1);
  }
  return picks.length ? picks : ['heal'];
}

export function reroll(run) {
  if (run.rerolls <= 0) return null;
  run.rerolls--;
  return offerChoices(run);
}

export function applyUpgrade(run, id) {
  if (run.pending > 0) run.pending--;
  if (id === 'heal') {
    run.hero.hp = Math.min(run.hero.maxHp, run.hero.hp + 30);
    return;
  }
  const def = UPGRADES[id];
  if (!def || run.up[id] >= def.max) return;
  run.up[id]++;
  if (id === 'heart') {
    run.hero.maxHp += 25;
    run.hero.hp = Math.min(run.hero.maxHp, run.hero.hp + 25);
  }
}

// ----- spawning -----
function edgePoint(run, margin) {
  const a = run.rnd() * Math.PI * 2;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const tx = Math.abs(c) < 1e-6 ? Infinity : (run.view.hw + margin) / Math.abs(c);
  const ty = Math.abs(s) < 1e-6 ? Infinity : (run.view.hh + margin) / Math.abs(s);
  const d = Math.min(tx, ty);
  return { x: run.hero.x + c * d, y: run.hero.y + s * d };
}

function addEnemy(run, kind, x, y) {
  if (run.enemies.length >= MAX_ENEMIES && kind !== 'boss') return null;
  const def = ENEMY[kind];
  const hp = def.hp * (kind === 'boss' ? 1 + run.t / 100 : hpScale(run.t));
  // elites: rare tougher versions after the first minute, worth more experience
  const elite = (kind === 'grunt' || kind === 'tank' || kind === 'swift') && run.t > 45 && run.rnd() < 0.035;
  const mult = elite ? 4 : 1;
  const e = { id: run.nextId++, kind, x, y, hp: hp * mult, maxHp: hp * mult, hit: 0, orbCd: 0, vx: 0, vy: 0, elite };
  run.enemies.push(e);
  return e;
}

function chooseKind(run) {
  const t = run.t;
  const r = run.rnd();
  if (t > 70 && r < 0.09) return 'tank';
  if (t > 28 && r < 0.3) return 'swift';
  return 'grunt';
}

function spawnLogic(run, dt) {
  run.spawnAcc += spawnRate(run.t) * (run.modern ? 1.9 : 1) * dt;
  while (run.spawnAcc >= 1) {
    run.spawnAcc -= 1;
    const p = edgePoint(run, 34);
    addEnemy(run, chooseKind(run), p.x, p.y);
  }
  for (const at of (run.modern ? [40,85,140,200,260,320,380,440,500,550] : [55,105,155,200])) {
    if (run.t >= at && !run.waveDone[at]) {
      run.waveDone[at] = true;
      const n = Math.min(65,16 + Math.floor(at / 12));
      const r = Math.max(run.view.hw, run.view.hh) * 1.12;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        addEnemy(run, 'swarm', run.hero.x + Math.cos(a) * r, run.hero.y + Math.sin(a) * r);
      }
      run.events.push({ type: 'wave' });
    }
  }
  for (const at of (run.modern ? [110,230,350,470,570] : [95,190])) {
    if (run.t >= at && !run.bossDone[at]) {
      run.bossDone[at] = true;
      const p = edgePoint(run, 60);
      addEnemy(run, 'boss', p.x, p.y);
      run.events.push({ type: 'boss' });
    }
  }
}

// ----- the step -----
export function step(run, dt, input, aim) {
  if (run.over || run.pending > 0 || run.milestone > 0) return;
  dt = Math.min(dt, 0.05);
  run.t += dt;
  const hero = run.hero;
  const h = run.hero;

  // movement
  let ix = input ? input.x : 0;
  let iy = input ? input.y : 0;
  const m = Math.hypot(ix, iy);
  if (m > 1) {
    ix /= m;
    iy /= m;
  }
  const sp = heroSpeed(run);
  h.x += ix * sp * dt;
  h.y += iy * sp * dt;
  if (Math.abs(ix) > 0.05) h.face = ix > 0 ? 1 : -1;
  if (h.iframe > 0) h.iframe -= dt;
  if (regenRate(run) > 0) h.hp = Math.min(h.maxHp, h.hp + regenRate(run) * dt);

  spawnLogic(run, dt);

  // enemies chase and separate
  const cell = 48;
  const grid = new Map();
  const key = (cx, cy) => cx * 73856093 ^ cy * 19349663;
  for (let i = 0; i < run.enemies.length; i++) {
    const e = run.enemies[i];
    const k = key(Math.floor(e.x / cell), Math.floor(e.y / cell));
    let arr = grid.get(k);
    if (!arr) grid.set(k, (arr = []));
    arr.push(i);
  }
  const sc = speedScale(run.t) * (run.practice ? .78 : 1);
  for (const e of run.enemies) {
    const def = ENEMY[e.kind];
    const dx = h.x - e.x;
    const dy = h.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    let vx = (dx / d) * def.speed * sc;
    let vy = (dy / d) * def.speed * sc;
    const cx = Math.floor(e.x / cell);
    const cy = Math.floor(e.y / cell);
    for (let gx = cx - 1; gx <= cx + 1; gx++) {
      for (let gy = cy - 1; gy <= cy + 1; gy++) {
        const arr = grid.get(key(gx, gy));
        if (!arr) continue;
        for (const j of arr) {
          const o = run.enemies[j];
          if (o === e) continue;
          const ox = e.x - o.x;
          const oy = e.y - o.y;
          const od = Math.hypot(ox, oy);
          const min = def.r + ENEMY[o.kind].r - 2;
          if (od > 0 && od < min) {
            const push = ((min - od) / min) * 55;
            vx += (ox / od) * push;
            vy += (oy / od) * push;
          }
        }
      }
    }
    // enemies crowd around the hero at contact range instead of stacking inside it
    const touch = def.r + HERO_R - 4;
    if (d < touch) {
      vx = (-dx / d) * (touch - d) * 20;
      vy = (-dy / d) * (touch - d) * 20;
    }
    e.x += vx * dt;
    e.y += vy * dt;
    if(run.modern&&(Math.abs(e.x-h.x)>run.view.hw*2.4||Math.abs(e.y-h.y)>run.view.hh*2.4)){const p=edgePoint(run,70);e.x=p.x;e.y=p.y;}
    if (e.hit > 0) e.hit -= dt;
    if (e.orbCd > 0) e.orbCd -= dt;
  }

  // hero is hurt by contact
  if (h.iframe <= 0) {
    for (const e of run.enemies) {
      const def = ENEMY[e.kind];
      if (Math.hypot(e.x - h.x, e.y - h.y) < def.r + HERO_R - 2) {
        h.iframe = 0.5;
        if (run.shieldCharges > 0) {
          run.shieldCharges--;
          run.events.push({ type: 'block' });
          break;
        }
        const dmg = def.dmg * (e.elite ? 1.5 : 1) * (run.practice ? .5 : 1);
        h.hp -= dmg;
        run.hurtTotal += dmg;
        run.events.push({ type: 'hurt' });
        break;
      }
    }
  }

  seasonalStep(run, dt);

  // barrier recharge
  if (run.ms.shield > 0 && run.shieldCharges < run.ms.shield) {
    run.shieldCd -= dt;
    if (run.shieldCd <= 0) {
      run.shieldCharges++;
      run.shieldCd = 10;
      run.events.push({ type: 'shieldup' });
    }
  }

  // companion: follows a little behind and fires on its own cadence
  if (run.pet) petStep(run, dt);

  // firing: auto-aim at the nearest enemy, or manual aim with the second stick
  run.cd -= dt;
  if (run.cd <= 0) {
    let base = null;
    if (run.manual) {
      if (aim && Math.hypot(aim.x, aim.y) > 0.3) base = Math.atan2(aim.y, aim.x);
    } else if (run.enemies.length) {
      let best = null;
      let bd = 320 * 320;
      for (const e of run.enemies) {
        const d2 = (e.x - h.x) ** 2 + (e.y - h.y) ** 2;
        if (d2 < bd) {
          bd = d2;
          best = e;
        }
      }
      if (best) base = Math.atan2(best.y - h.y, best.x - h.x);
    }
    if (base === null) run.cd = 0; // ready: the next touch or target fires at once
    else {
      // carry the remainder so the cadence is exact at any frame rate
      run.cd = Math.max(run.cd + fireInterval(run), 0.01);
      const dmg = shotDamage(run) * (run.manual ? MANUAL_BONUS : 1);
      const spd = run.manual ? 330 : 280;
      // shots leave from a muzzle point ahead of the hero, so an enemy pressed against you cannot swallow them unseen
      const mk = (a) => ({ x: h.x + Math.cos(a) * MUZZLE, y: h.y + Math.sin(a) * MUZZLE, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, life: 1.05, age: 0, pierce: shotPierce(run), hit: new Set(), dmg, homing: run.up.homing, bounce: run.up.bounce });
      const n = shotCount(run);
      for (let i = 0; i < n; i++) run.shots.push(mk(base + (i - (n - 1) / 2) * 0.2));
      for (let i = 0; i < run.up.rear; i++) run.shots.push(mk(base + Math.PI + (i - (run.up.rear - 1) / 2) * 0.35));
      run.events.push({ type: 'shoot', a: base });
    }
  }

  // shots
  for (const s of run.shots) {
    if (s.homing > 0) steer(run, s, dt);
    if (s.age > 0) {
      // a brand-new shot is checked where it appears first, so point-blank enemies are hit
      s.x += s.vx * dt;
      s.y += s.vy * dt;
    }
    s.life -= dt;
    s.age = (s.age || 0) + dt;
    if (s.life <= 0) continue;
    const cx = Math.floor(s.x / cell);
    const cy = Math.floor(s.y / cell);
    outer: for (let gx = cx - 1; gx <= cx + 1; gx++) {
      for (let gy = cy - 1; gy <= cy + 1; gy++) {
        const arr = grid.get(key(gx, gy));
        if (!arr) continue;
        for (const j of arr) {
          const e = run.enemies[j];
          if (e.hp <= 0 || s.hit.has(e.id)) continue;
          if (Math.hypot(e.x - s.x, e.y - s.y) < ENEMY[e.kind].r + 5) {
            hurtEnemy(run, e, s.dmg);
            s.hit.add(e.id);
            onHitExtras(run, s, e);
            if (s.bounce > 0) {
              const t = nearestEnemy(run, s.x, s.y, 150, s.hit);
              if (t) {
                const a = Math.atan2(t.y - s.y, t.x - s.x);
                const sp = Math.hypot(s.vx, s.vy);
                s.vx = Math.cos(a) * sp;
                s.vy = Math.sin(a) * sp;
                s.bounce--;
                s.life = Math.max(s.life, 0.55);
                break outer;
              }
            }
            if (s.age < POINT_BLANK) continue; // point-blank hits never end the shot, so it is always seen leaving
            if (s.pierce <= 0) {
              s.life = 0;
              break outer;
            }
            s.pierce--;
          }
        }
      }
    }
  }

  // guardians
  const orbs = orbCount(run);
  if (orbs > 0) {
    run.orbAngle += 2.7 * dt;
    for (let i = 0; i < orbs; i++) {
      const a = run.orbAngle + (i / orbs) * Math.PI * 2;
      const ox = h.x + Math.cos(a) * 52;
      const oy = h.y + Math.sin(a) * 52;
      for (const e of run.enemies) {
        if (e.hp <= 0 || e.orbCd > 0) continue;
        if (Math.hypot(e.x - ox, e.y - oy) < ENEMY[e.kind].r + 9) {
          hurtEnemy(run, e, (0.8 + 0.3 * run.up.power) * (run.evolutions?.includes('orbit')?2:1));
          e.orbCd = 0.35;
        }
      }
    }
  }

  // shock pulse
  if (run.up.nova > 0) {
    run.novaCd -= dt;
    if (run.novaCd <= 0) {
      run.novaCd = novaInterval(run);
      const rad = 105 + run.up.nova * 12 + (run.evolutions?.includes('nova')?55:0);
      for (const e of run.enemies) if (e.hp > 0 && Math.hypot(e.x - h.x, e.y - h.y) < rad + ENEMY[e.kind].r) hurtEnemy(run, e, (2.5 + 0.5 * run.up.nova) * (run.evolutions?.includes('nova')?2:1));
      run.events.push({ type: 'nova', r: rad });
    }
  }

  arsenalStep(run, dt);

  // clean up
  run.shots = run.shots.filter((s) => s.life > 0);
  run.enemies = run.enemies.filter((e) => e.hp > 0);

  // gems
  const mr = magnetRadius(run);
  for (let i = run.gems.length - 1; i >= 0; i--) {
    const g = run.gems[i];
    const dx = h.x - g.x;
    const dy = h.y - g.y;
    const d = Math.hypot(dx, dy);
    if (d < mr) {
      g.pull = true;
    }
    if (g.pull) {
      const sp2 = 300;
      g.x += (dx / (d || 1)) * sp2 * dt;
      g.y += (dy / (d || 1)) * sp2 * dt;
    }
    if (d < 13) {
      run.gems.splice(i, 1);
      gainXp(run, g.v);
    }
  }

  if (h.hp <= 0) {
    h.hp = 0;
    run.over = true;
    run.reason = 'down';
    run.events.push({ type: 'lose' });
  } else if (run.t >= (run.duration || RUN_SECONDS)) {
    run.t = run.duration || RUN_SECONDS;
    run.over = true;
    run.reason = 'dawn';
    run.events.push({ type: 'win' });
  }
}

// ----- milestones -----
export function offerMilestones(run, n = 3) {
  const avail = MILESTONE_IDS.filter((k) => {
    const d = MILESTONES[k];
    if (k === 'pet') return !run.pet;
    if (d.needs === 'pet' && !run.pet) return false;
    return run.ms[k] < (d.max ?? 1);
  });
  const picks = [];
  // the first milestone always offers the companion; later ones offer one companion upgrade if you have it
  if (avail.includes('pet')) picks.push('pet');
  else {
    const pu = avail.filter((k) => PET_IDS.includes(k));
    if (pu.length) picks.push(pu[Math.floor(run.rnd() * pu.length)]);
  }
  const rest = avail.filter((k) => !picks.includes(k) && !PET_IDS.includes(k));
  while (picks.length < n && rest.length) picks.push(rest.splice(Math.floor(run.rnd() * rest.length), 1)[0]);
  return picks;
}

export function applyMilestone(run, id) {
  if (run.milestone <= 0 || !MILESTONES[id]) return false;
  run.milestone--;
  if (id === 'pet') {
    run.pet = { x: run.hero.x - 30, y: run.hero.y + 20, cd: 0.4, angle: 0 };
    run.ms.pet = 1;
  } else run.ms[id]++;
  if (id === 'shield') {
    run.shieldCharges = Math.min(run.ms.shield, run.shieldCharges + 1);
    run.shieldCd = 10;
  }
  if (id === 'feast') {
    run.hero.maxHp += 30;
    run.hero.hp = run.hero.maxHp;
  }
  run.events.push({ type: 'milestone', id });
  return true;
}

export const petInterval = (r) => 0.9 * Math.pow(0.7, r.ms.petRate) * Math.pow(0.8, r.ms.frenzy);
export const petDamage = (r) => 1.4 + 1.1 * r.ms.petPower + 0.3 * r.up.power;
export const petRange = (r) => 240 + 50 * r.ms.petPower;

function petStep(run, dt) {
  const p = run.pet;
  const h = run.hero;
  p.angle += dt * 1.3;
  const tx = h.x + Math.cos(p.angle) * 34 - 4;
  const ty = h.y + Math.sin(p.angle) * 18 - 30;
  const k = Math.min(1, dt * 6);
  p.x += (tx - p.x) * k;
  p.y += (ty - p.y) * k;
  p.cd -= dt;
  if (p.cd > 0) return;
  const t = nearestEnemy(run, p.x, p.y, petRange(run));
  if (!t) {
    p.cd = 0;
    return;
  }
  p.cd = Math.max(p.cd + petInterval(run), 0.01);
  const base = Math.atan2(t.y - p.y, t.x - p.x);
  const n = 1 + run.ms.petMulti;
  for (let i = 0; i < n; i++) {
    const a = base + (i - (n - 1) / 2) * 0.16;
    run.shots.push({ x: p.x, y: p.y, vx: Math.cos(a) * 340, vy: Math.sin(a) * 340, life: 1, pierce: 0, hit: new Set(), dmg: petDamage(run), homing: 0, bounce: 0, pet: true });
  }
  run.events.push({ type: 'petshoot' });
}

function onHitExtras(run, s, e) {
  if (run.ms.blast > 0) {
    const rad = 30 + 10 * run.ms.blast;
    for (const o of run.enemies) {
      if (o === e || o.hp <= 0) continue;
      if (Math.hypot(o.x - s.x, o.y - s.y) < rad + ENEMY[o.kind].r) hurtEnemy(run, o, s.dmg * 0.45);
    }
    run.events.push({ type: 'blast', x: s.x, y: s.y, r: rad });
  }
  if (run.ms.chain > 0) {
    const seen = new Set([e.id]);
    let from = e;
    const pts = [{ x: e.x, y: e.y }];
    for (let i = 0; i < 1 + run.ms.chain; i++) {
      const t = nearestEnemy(run, from.x, from.y, 95, seen);
      if (!t) break;
      seen.add(t.id);
      hurtEnemy(run, t, s.dmg * 0.6);
      pts.push({ x: t.x, y: t.y });
      from = t;
    }
    if (pts.length > 1) run.events.push({ type: 'chain', pts });
  }
}

function nearestEnemy(run, x, y, range, skip) {
  let best = null;
  let bd = range * range;
  for (const e of run.enemies) {
    if (e.hp <= 0 || (skip && skip.has(e.id))) continue;
    const d2 = (e.x - x) ** 2 + (e.y - y) ** 2;
    if (d2 < bd) {
      bd = d2;
      best = e;
    }
  }
  return best;
}

function steer(run, s, dt) {
  const t = nearestEnemy(run, s.x, s.y, 170, s.hit);
  if (!t) return;
  const cur = Math.atan2(s.vy, s.vx);
  let d = Math.atan2(t.y - s.y, t.x - s.x) - cur;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  const turn = Math.max(-1, Math.min(1, d * 4)) * s.homing * 2.6 * dt;
  const a = cur + turn;
  const sp = Math.hypot(s.vx, s.vy);
  s.vx = Math.cos(a) * sp;
  s.vy = Math.sin(a) * sp;
}

function hurtEnemy(run, e, dmg) {
  if(e.hp<=0)return;
  if(run.modern)run.events.push({type:'damage',x:e.x,y:e.y,value:Math.ceil(dmg)});
  e.hp -= dmg;
  e.hit = 0.1;
  if (e.hp <= 0) {
    run.kills++;
    if(run.modern&&(e.kind==='boss'||e.elite)){if(run.chests.length>=64)run.chests.shift();run.chests.push({x:e.x,y:e.y});}
    const def = ENEMY[e.kind];
    if (e.kind === 'boss') {
      for (let i = 0; i < 3; i++) dropGem(run, e.x + (i - 1) * 14, e.y, def.xp);
    } else dropGem(run, e.x, e.y, def.xp * (e.elite ? 4 : 1));
    run.events.push({ type: 'kill', kind: e.kind, x: e.x, y: e.y, elite: !!e.elite });
  }
}

function dropGem(run, x, y, v) {
  if (run.gems.length >= MAX_GEMS) {
    gainXp(run, v);
    return;
  }
  run.gems.push({ x, y, v, pull: false });
}

function gainXp(run, v) {
  run.xp += v * (1 + 0.3 * run.ms.surge);
  while (run.xp >= xpNeeded(run.level)) {
    run.xp -= xpNeeded(run.level);
    run.level++;
    run.pending++;
    run.events.push({ type: 'levelup' });
    if (run.level % MILESTONE_EVERY === 0 && !run.milestonesHit.includes(run.level)) {
      run.milestonesHit.push(run.level);
      run.milestone++;
      run.events.push({ type: 'milestoneReady', level: run.level });
    }
  }
}

export function scoreOf(run) {
  const win = run.reason === 'dawn';
  return Math.round(run.kills * 10 + Math.floor(run.t) * 5 + (run.level - 1) * 100 + (win ? 1000 + run.hero.hp * 5 : 0));
}

export const SEASON_RULES = {
 halloween: { name: 'Haunted ground', radius: 46, windup: 2.2, damage: 9 },
 harvest: { name: 'Falling branches', radius: 35, windup: 2, damage: 8 },
 winter: { name: 'Icefall', radius: 58, windup: 2.6, damage: 10 },
 valentine: { name: 'Thorn bloom', radius: 42, windup: 2.2, damage: 8 },
 spring: { name: 'Spore cloud', radius: 66, windup: 2.8, damage: 7 },
 summer: { name: 'High tide', radius: 72, windup: 3, damage: 8 },
};
export function seasonalStep(run, dt) {
 const rule=SEASON_RULES[run.season];if(!rule)return;
 run.hazards ||= [];
 if(run.t>=run.hazardNext){
  run.hazardNext=run.t+14;
  run.hazards.push({x:run.hero.x+(run.rnd()-.5)*90,y:run.hero.y+(run.rnd()-.5)*90,r:rule.radius,t:0,windup:rule.windup,hit:false});
  run.events.push({type:'hazard',name:rule.name});
 }
 for(const z of run.hazards){
  z.t+=dt;
  if(z.t>=z.windup&&!z.hit&&Math.hypot(run.hero.x-z.x,run.hero.y-z.y)<z.r&&run.hero.iframe<=0){
   z.hit=true;run.hero.iframe=.8;
   if(run.shieldCharges>0){run.shieldCharges--;run.events.push({type:'block'});}
   else{const dmg=rule.damage*(run.practice?.5:1);run.hero.hp-=dmg;run.hurtTotal+=dmg;run.events.push({type:'hurt'});}
  }
 }
 run.hazards=run.hazards.filter(z=>z.t<z.windup+.7);
}


export const EVOLUTIONS={axes:{name:'Reaper crescents',need:'power',rank:3},storm:{name:'Tempest crown',need:'magnet',rank:3},tome:{name:'Infernal codex',need:'regen',rank:2},orbit:{name:'Solar procession',need:'speed',rank:3},nova:{name:'Black star',need:'heart',rank:3}};
export function migrateRun(r){r.modern=true;r.duration ||= RUN_SECONDS;r.chests ||= [];r.pools ||= [];r.weaponCd ||= {axes:1,storm:2,tome:3};r.evolutions ||= [];for(const k of UPGRADE_IDS)r.up[k] ||= 0;return r;}
export function openChest(r){migrateRun(r);const ready=Object.keys(EVOLUTIONS).find(k=>r.up[k]>=UPGRADES[k].max&&r.up[EVOLUTIONS[k].need]>=EVOLUTIONS[k].rank&&!r.evolutions.includes(k));if(ready){r.evolutions.push(ready);r.events.push({type:'evolution',name:EVOLUTIONS[ready].name});return ready;}const owned=UPGRADE_IDS.filter(k=>r.up[k]>0&&r.up[k]<UPGRADES[k].max);if(owned.length){const k=owned[Math.floor(r.rnd()*owned.length)];const pending=r.pending;applyUpgrade(r,k);r.pending=pending;r.events.push({type:'treasure',name:UPGRADES[k].name});}r.hero.hp=Math.min(r.hero.maxHp,r.hero.hp+30);return null;}
function arsenalStep(r,dt){if(!r.modern)return;const h=r.hero,has=k=>r.evolutions.includes(k),damage=1+r.up.power*.18;
 for(let i=r.chests.length-1;i>=0;i--)if(Math.hypot(r.chests[i].x-h.x,r.chests[i].y-h.y)<32){r.chests.splice(i,1);openChest(r);}
 for(const k of ['axes','storm','tome']){if(!r.up[k])continue;r.weaponCd[k]-=dt;if(r.weaponCd[k]>0)continue;const target=nearestEnemy(r,h.x,h.y,340);if(!target){r.weaponCd[k]=0;continue;}const rank=r.up[k],evolved=has(k);r.weaponCd[k]=({axes:2.4,storm:3.8,tome:4.2}[k]-.15*rank)*Math.pow(.8,r.ms.frenzy);
 if(k==='axes'){const a=Math.atan2(target.y-h.y,target.x-h.x);for(let i=0;i<1+Math.floor(rank/2)+(evolved?2:0);i++){const angle=a+(i-(Math.floor(rank/2)+(evolved?2:0))/2)*.3;r.shots.push({x:h.x,y:h.y,vx:Math.cos(angle)*205,vy:Math.sin(angle)*205,life:1.8,age:0,pierce:evolved?25:2+rank,hit:new Set(),dmg:(2+rank)*damage*(evolved?1.8:1),homing:0,bounce:0,axe:true});}}
 if(k==='storm'){const targets=[...r.enemies].filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-h.x,a.y-h.y)-Math.hypot(b.x-h.x,b.y-h.y)).slice(0,rank+(evolved?4:0));for(const e of targets){hurtEnemy(r,e,(3+rank)*damage*(evolved?1.8:1));r.events.push({type:'lightning',x:e.x,y:e.y});}}
 if(k==='tome')r.pools.push({x:target.x,y:target.y,r:36+rank*8+(evolved?30:0),life:3+rank*.3,cd:0,dmg:(1+rank*.5)*damage*(evolved?2:1)});
 }
 for(const p of r.pools){p.life-=dt;p.cd-=dt;if(p.cd<=0){p.cd=.45;for(const e of r.enemies)if(e.hp>0&&Math.hypot(e.x-p.x,e.y-p.y)<p.r+ENEMY[e.kind].r)hurtEnemy(r,e,p.dmg);}}
 r.pools=r.pools.filter(p=>p.life>0);
}

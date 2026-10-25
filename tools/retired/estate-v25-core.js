// Tycoon Row: a fast property-trading board game with an original board, names and cards.
// Pure rules engine plus rival AI. No DOM. Deterministic for a seed.
import { mulberry32, shuffle } from '../../js/games/rng.js';
import { PERSONAS, AI_KEYS } from '../../js/games/estate-chat.js';

export const START_CASH = 1500;
export const PAYDAY = 200;
export const MAX_ROUNDS = 20; // the default; createGame can pick 12, 20 or 30
export const ROUND_CHOICES = [12, 20, 30];
export const JAIL_FEE = 50;
export const JAIL_POS = 10;
export const N = 40;

export const GROUPS = [
  { id: 0, name: 'Dockside', color: '#a8714a', house: 50 },
  { id: 1, name: 'Walks', color: '#6fd3e8', house: 50 },
  { id: 2, name: 'Streets', color: '#e86aa8', house: 100 },
  { id: 3, name: 'Avenues', color: '#f39a3d', house: 100 },
  { id: 4, name: 'Boulevards', color: '#ef4b55', house: 150 },
  { id: 5, name: 'Courts', color: '#f4d03f', house: 150 },
  { id: 6, name: 'Rows', color: '#3fbf6a', house: 200 },
  { id: 7, name: 'Plazas', color: '#4a6cf0', house: 200 },
];

function prop(name, short, group, price) {
  const base = Math.round(price * 0.14);
  return { type: 'prop', name, short, group, price, rent: [base, Math.round(price * 0.6), Math.round(price * 1.6), Math.round(price * 3), Math.round(price * 4.2)] };
}
const station = (name, short) => ({ type: 'station', name, short, price: 200 });
const utility = (name, short, emoji) => ({ type: 'utility', name, short, price: 150, emoji });
const wild = () => ({ type: 'wild', name: 'Wildcard', short: 'Wild' });

// A standard 40-square loop: four corners, ten squares along each side.
export const TILES = [
  { type: 'start', name: 'Payday', short: 'Payday' },
  prop('Pier Lane', 'Pier', 0, 60),
  wild(),
  prop('Net Alley', 'Net', 0, 60),
  { type: 'tax', name: 'Income Tax', short: 'Tax', amount: 200 },
  station('North Line', 'North'),
  prop('Cedar Walk', 'Cedar', 1, 100),
  wild(),
  prop('Elm Walk', 'Elm', 1, 100),
  prop('Maple Walk', 'Maple', 1, 120),
  { type: 'jail', name: 'Time-out', short: 'Time-out' },
  prop('Coral Street', 'Coral', 2, 140),
  utility('Sun Power', 'Power', '💡'),
  prop('Shell Street', 'Shell', 2, 140),
  prop('Pearl Street', 'Pearl', 2, 160),
  station('East Line', 'East'),
  prop('Brass Avenue', 'Brass', 3, 180),
  wild(),
  prop('Copper Avenue', 'Copper', 3, 180),
  prop('Iron Avenue', 'Iron', 3, 200),
  { type: 'park', name: 'Picnic', short: 'Picnic' },
  prop('Ruby Boulevard', 'Ruby', 4, 220),
  wild(),
  prop('Poppy Boulevard', 'Poppy', 4, 220),
  prop('Cherry Boulevard', 'Cherry', 4, 240),
  station('South Line', 'South'),
  prop('Daisy Court', 'Daisy', 5, 260),
  prop('Amber Court', 'Amber', 5, 260),
  utility('Spring Water', 'Water', '💧'),
  prop('Lemon Court', 'Lemon', 5, 280),
  { type: 'goto', name: 'Go to Time-out', short: 'Detour' },
  prop('Garden Row', 'Garden', 6, 300),
  prop('Fern Row', 'Fern', 6, 300),
  wild(),
  prop('Orchard Row', 'Orchard', 6, 320),
  station('West Line', 'West'),
  wild(),
  prop('Summit Plaza', 'Summit', 7, 350),
  { type: 'tax', name: 'Luxury Tax', short: 'Lux tax', amount: 100 },
  prop('Skyline Plaza', 'Skyline', 7, 400),
];
TILES.forEach((t, i) => (t.i = i));
export const GROUP_TILES = GROUPS.map((g) => TILES.filter((t) => t.group === g.id).map((t) => t.i));
export const STATION_TILES = TILES.filter((t) => t.type === 'station').map((t) => t.i);
export const UTILITY_TILES = TILES.filter((t) => t.type === 'utility').map((t) => t.i);

// Wildcards
const CARDS = [
  { id: 'bank', text: 'Bank error in your favor. Collect $100.' },
  { id: 'birthday', text: "It's your birthday! Collect $25 from every player." },
  { id: 'repairs', text: 'Pay $50 for repairs.' },
  { id: 'payday', text: 'Advance to Payday and collect $200.' },
  { id: 'jail', text: 'Go to Time-out. Do not pass Payday.' },
  { id: 'free', text: 'Get out of Time-out free. Keep this card.' },
  { id: 'streetwork', text: 'Street work: pay $20 for every building you own.' },
  { id: 'fwd3', text: 'Move forward 3 spaces.' },
  { id: 'back3', text: 'Move back 3 spaces.' },
  { id: 'line', text: 'Advance to the nearest Line. If owned, pay double rent.' },
  { id: 'raffle', text: 'You won a raffle. Collect $75.' },
  { id: 'doctor', text: "Doctor's bill. Pay $40." },
];

// ----- setup -----
export function createGame({ seed = 1, difficulty = 2, humanName = 'You', allAI = false, rounds = MAX_ROUNDS } = {}) {
  const rnd = mulberry32(seed);
  const players = [
    { id: 0, key: 'human', name: humanName, face: '🙂', color: '#4db4ff', style: 'human', ai: allAI },
    ...AI_KEYS.map((k, i) => ({ id: i + 1, key: k, name: PERSONAS[k].name, face: PERSONAS[k].face, color: PERSONAS[k].color, style: PERSONAS[k].style, ai: true })),
  ];
  if (allAI) players[0].style = 'collector';
  for (const p of players) Object.assign(p, { cash: START_CASH, pos: 0, jail: 0, cards: 0, bankrupt: false });
  const s = {
    seed,
    rnd,
    diff: Math.max(1, Math.min(3, difficulty)),
    players,
    owner: Array(N).fill(-1),
    level: Array(N).fill(0),
    turn: 0,
    round: 1,
    maxRounds: rounds,
    phase: 'roll', // roll | buy | auction | post | over
    dice: [0, 0],
    doubles: 0,
    extra: false,
    built: 0,
    pot: 0,
    deck: shuffle(rnd, CARDS.map((c) => c.id)),
    deckPos: 0,
    auction: null,
    over: false,
    winner: -1,
    events: [],
    log: [],
    lastLine: {},
    stats: { rentPaid: 0, rentEarned: 0, built: 0, bought: 0 },
  };
  chat(s, 1 + Math.floor(rnd() * 3), 'greeting', {}, 1);
  return s;
}

// ----- helpers -----
const cur = (s) => s.players[s.turn];
const alive = (s) => s.players.filter((p) => !p.bankrupt);
const emit = (s, e) => s.events.push(e);
function note(s, text) {
  s.log.push(text);
  if (s.log.length > 60) s.log.shift();
  emit(s, { type: 'log', text });
}
const $ = (n) => '$' + n;

export function ownedBy(s, pi) {
  const out = [];
  for (let i = 0; i < N; i++) if (s.owner[i] === pi) out.push(i);
  return out;
}
export const countInGroup = (s, g, pi) => GROUP_TILES[g].filter((i) => s.owner[i] === pi).length;
export const ownsGroup = (s, g, pi) => countInGroup(s, g, pi) === GROUP_TILES[g].length;
export const stationsOwned = (s, pi) => STATION_TILES.filter((i) => s.owner[i] === pi).length;
export const utilitiesOwned = (s, pi) => UTILITY_TILES.filter((i) => s.owner[i] === pi).length;

export function rentFor(s, i) {
  const t = TILES[i];
  const o = s.owner[i];
  if (o < 0) return 0;
  if (t.type === 'station') return 25 * Math.pow(2, stationsOwned(s, o) - 1);
  if (t.type === 'utility') return (utilitiesOwned(s, o) >= 2 ? 10 : 4) * Math.max(2, s.dice[0] + s.dice[1]);
  if (t.type !== 'prop') return 0;
  const lv = s.level[i];
  if (lv > 0) return t.rent[lv];
  return ownsGroup(s, t.group, o) ? t.rent[0] * 2 : t.rent[0];
}

export function netWorth(s, pi) {
  const p = s.players[pi];
  if (p.bankrupt) return 0;
  let w = p.cash;
  for (const i of ownedBy(s, pi)) {
    w += TILES[i].price;
    if (TILES[i].group != null) w += s.level[i] * GROUPS[TILES[i].group].house;
  }
  return w;
}

export function standings(s) {
  return s.players
    .map((p) => ({ id: p.id, name: p.name, worth: netWorth(s, p.id), bankrupt: p.bankrupt }))
    .sort((a, b) => (a.bankrupt === b.bankrupt ? b.worth - a.worth : a.bankrupt ? 1 : -1));
}

// ----- chat (rival banter) -----
export function chat(s, pi, kind, vars = {}, prob = 1) {
  const p = s.players[pi];
  if (!p || p.key === 'human' || p.bankrupt && kind !== 'bankrupt') return;
  if (s.rnd() >= prob) return;
  const lines = PERSONAS[p.key].lines[kind];
  if (!lines || !lines.length) return;
  const lastKey = p.key + kind;
  let line = lines[Math.floor(s.rnd() * lines.length)];
  if (lines.length > 1 && line === s.lastLine[lastKey]) line = lines[(lines.indexOf(line) + 1) % lines.length];
  s.lastLine[lastKey] = line;
  line = line.replace('{name}', 'friend').replace('{tile}', vars.tile || 'this').replace('{amt}', vars.amt != null ? $(vars.amt) : '');
  emit(s, { type: 'chat', from: pi, text: line });
}
function someAI(s, exclude = -1) {
  const list = alive(s).filter((p) => p.key !== 'human' && p.id !== exclude);
  return list.length ? list[Math.floor(s.rnd() * list.length)].id : -1;
}
// The human taps a reaction emoji; one rival may reply.
export function react(s, kind) {
  const pi = someAI(s);
  if (pi >= 0) chat(s, pi, 'react_' + kind, {}, 0.75);
}

// ----- money -----
function raise(s, pi, need) {
  const p = s.players[pi];
  while (p.cash < need) {
    const owned = ownedBy(s, pi);
    const built = owned.filter((i) => s.level[i] > 0).sort((a, b) => s.level[b] - s.level[a]);
    if (built.length) {
      const i = built[0];
      s.level[i]--;
      const refund = Math.floor(GROUPS[TILES[i].group].house / 2);
      p.cash += refund;
      emit(s, { type: 'sell', p: pi, tile: i, what: 'building', amount: refund });
      note(s, `${p.name} sold a building on ${TILES[i].name} for ${$(refund)}.`);
      continue;
    }
    if (!owned.length) break;
    owned.sort((a, b) => TILES[a].price - TILES[b].price);
    const i = owned[0];
    const amt = Math.floor(TILES[i].price / 2);
    s.owner[i] = -1;
    p.cash += amt;
    emit(s, { type: 'sell', p: pi, tile: i, what: 'deed', amount: amt });
    note(s, `${p.name} sold ${TILES[i].name} back to the bank for ${$(amt)}.`);
  }
}

function pay(s, from, to, amount, why) {
  const p = s.players[from];
  if (amount <= 0) return true;
  if (p.cash < amount) raise(s, from, amount);
  if (p.cash >= amount) {
    p.cash -= amount;
    if (to >= 0) s.players[to].cash += amount;
    else if (why === 'tax') s.pot += amount;
    return true;
  }
  // not enough even after selling everything
  const rest = p.cash;
  p.cash = 0;
  if (to >= 0) s.players[to].cash += rest;
  goBankrupt(s, from, to);
  return false;
}

function goBankrupt(s, pi, creditor) {
  const p = s.players[pi];
  p.bankrupt = true;
  for (const i of ownedBy(s, pi)) {
    s.level[i] = 0;
    s.owner[i] = creditor >= 0 ? creditor : -1;
  }
  p.cash = 0;
  emit(s, { type: 'bankrupt', p: pi, to: creditor });
  note(s, `${p.name} is bankrupt and out of the game.`);
  chat(s, pi, 'bankrupt', {}, 1);
  if (alive(s).length <= 1) gameOver(s);
  else if (s.turn === pi && s.phase !== 'over') {
    // their turn ends right away
    s.phase = 'post';
    s.extra = false;
    endTurn(s);
  }
}

// ----- movement and landing -----
function sendToJail(s, pi) {
  const p = s.players[pi];
  const from = p.pos;
  p.pos = JAIL_POS;
  p.jail = 1;
  s.doubles = 0;
  s.extra = false;
  s.phase = 'post';
  emit(s, { type: 'move', p: pi, from, to: JAIL_POS, jump: true });
  emit(s, { type: 'jail', p: pi });
  note(s, `${p.name} goes to Time-out.`);
  chat(s, pi, 'jail', {}, 0.9);
}

function moveTo(s, pi, pos, { forward = true } = {}) {
  const p = s.players[pi];
  const from = p.pos;
  const passed = forward && pos < from;
  p.pos = pos;
  emit(s, { type: 'move', p: pi, from, to: pos });
  if (passed) {
    p.cash += PAYDAY;
    emit(s, { type: 'payday', p: pi, amount: PAYDAY });
    note(s, `${p.name} collects ${$(PAYDAY)} for passing Payday.`);
    if (pos === 0) chat(s, pi, 'payday', {}, 0.35);
  }
}

function moveAndLand(s, steps) {
  const p = cur(s);
  const to = (p.pos + steps + N) % N;
  moveTo(s, p.id, to, { forward: steps > 0 });
  land(s, p.id, 1);
}

function land(s, pi, rentMult) {
  const p = s.players[pi];
  const t = TILES[p.pos];
  if (t.type === 'prop' || t.type === 'station' || t.type === 'utility') {
    const o = s.owner[p.pos];
    if (o === -1) {
      if (p.cash >= t.price) {
        s.phase = 'buy';
        emit(s, { type: 'offer', p: pi, tile: p.pos });
      } else startAuction(s, p.pos);
      return;
    }
    if (o !== pi) {
      const amt = rentFor(s, p.pos) * rentMult;
      emit(s, { type: 'rent', from: pi, to: o, amount: amt, tile: p.pos });
      note(s, `${p.name} pays ${s.players[o].name} ${$(amt)} rent on ${t.name}.`);
      const paid = pay(s, pi, o, amt, 'rent');
      if (paid) {
        s.stats.rentPaid += pi === 0 ? amt : 0;
        s.stats.rentEarned += o === 0 ? amt : 0;
        if (o !== 0 && pi === 0) chat(s, o, 'rent_collect', { tile: t.name }, 0.7);
        else if (pi !== 0 && o === 0) chat(s, pi, 'rent_pay', { tile: t.name }, 0.85);
        else if (pi !== 0) chat(s, pi, 'rent_pay', { tile: t.name }, 0.35);
      }
      if (p.bankrupt) return;
    }
    s.phase = 'post';
    return;
  }
  if (t.type === 'tax') {
    emit(s, { type: 'tax', p: pi, amount: t.amount });
    note(s, `${p.name} pays ${$(t.amount)} in tax.`);
    if (!pay(s, pi, -1, t.amount, 'tax')) return;
    s.phase = 'post';
    return;
  }
  if (t.type === 'park') {
    if (s.pot > 0) {
      p.cash += s.pot;
      emit(s, { type: 'picnic', p: pi, amount: s.pot });
      note(s, `${p.name} finds a picnic basket with ${$(s.pot)} from the tax pot.`);
      s.pot = 0;
    }
    s.phase = 'post';
    return;
  }
  if (t.type === 'goto') {
    sendToJail(s, pi);
    return;
  }
  if (t.type === 'wild') {
    drawCard(s, pi);
    return;
  }
  s.phase = 'post';
}

function drawCard(s, pi) {
  const p = s.players[pi];
  if (s.deckPos >= s.deck.length) {
    s.deck = shuffle(s.rnd, CARDS.map((c) => c.id));
    s.deckPos = 0;
  }
  const id = s.deck[s.deckPos++];
  const card = CARDS.find((c) => c.id === id);
  emit(s, { type: 'card', p: pi, text: card.text });
  note(s, `${p.name} draws a Wildcard: ${card.text}`);
  s.phase = 'post';
  switch (id) {
    case 'bank':
      p.cash += 100;
      break;
    case 'raffle':
      p.cash += 75;
      break;
    case 'birthday':
      for (const o of alive(s)) {
        if (o.id === pi || s.over) continue;
        pay(s, o.id, pi, 25, 'gift');
      }
      break;
    case 'repairs':
      pay(s, pi, -1, 50, 'tax');
      break;
    case 'doctor':
      pay(s, pi, -1, 40, 'tax');
      break;
    case 'streetwork': {
      let n = 0;
      for (const i of ownedBy(s, pi)) n += s.level[i];
      if (n) pay(s, pi, -1, 20 * n, 'tax');
      break;
    }
    case 'payday':
      moveTo(s, pi, 0, { forward: true });
      land(s, pi, 1);
      break;
    case 'jail':
      sendToJail(s, pi);
      break;
    case 'free':
      p.cards++;
      break;
    case 'fwd3':
      moveTo(s, pi, (p.pos + 3) % N, { forward: true });
      land(s, pi, 1);
      break;
    case 'back3':
      moveTo(s, pi, (p.pos - 3 + N) % N, { forward: false });
      land(s, pi, 1);
      break;
    case 'line': {
      let to = STATION_TILES.find((i) => i > p.pos);
      if (to === undefined) to = STATION_TILES[0];
      moveTo(s, pi, to, { forward: true });
      land(s, pi, 2);
      break;
    }
    default:
  }
}

// ----- turns -----
function rollDie(s) {
  return 1 + Math.floor(s.rnd() * 6);
}

export function roll(s) {
  if (s.phase !== 'roll' || s.over) return false;
  const p = cur(s);
  const d1 = rollDie(s);
  const d2 = rollDie(s);
  s.dice = [d1, d2];
  const dbl = d1 === d2;
  emit(s, { type: 'roll', p: p.id, d1, d2 });
  if (p.jail > 0) {
    if (dbl) {
      p.jail = 0;
      s.extra = false;
      note(s, `${p.name} rolled doubles and leaves Time-out.`);
      moveAndLand(s, d1 + d2);
    } else {
      p.jail++;
      if (p.jail > 3) {
        note(s, `${p.name} pays ${$(JAIL_FEE)} and leaves Time-out.`);
        p.jail = 0;
        if (!pay(s, p.id, -1, JAIL_FEE, 'tax')) return true;
        moveAndLand(s, d1 + d2);
      } else {
        note(s, `${p.name} rolled ${d1 + d2} and stays in Time-out.`);
        s.phase = 'post';
      }
    }
    return true;
  }
  if (dbl) {
    s.doubles++;
    if (s.doubles >= 3) {
      note(s, `${p.name} rolled three doubles in a row. Straight to Time-out.`);
      sendToJail(s, p.id);
      return true;
    }
    s.extra = true;
    chat(s, p.id, 'doubles', {}, 0.45);
  } else s.extra = false;
  note(s, `${p.name} rolled ${d1} and ${d2}.`);
  moveAndLand(s, d1 + d2);
  return true;
}

export function payJail(s) {
  const p = cur(s);
  if (s.phase !== 'roll' || p.jail <= 0 || p.cash < JAIL_FEE) return false;
  p.cash -= JAIL_FEE;
  s.pot += JAIL_FEE;
  p.jail = 0;
  note(s, `${p.name} pays ${$(JAIL_FEE)} to leave Time-out.`);
  emit(s, { type: 'jailpay', p: p.id });
  return true;
}
export function useJailCard(s) {
  const p = cur(s);
  if (s.phase !== 'roll' || p.jail <= 0 || p.cards <= 0) return false;
  p.cards--;
  p.jail = 0;
  note(s, `${p.name} uses a Get out of Time-out card.`);
  return true;
}

export function buy(s) {
  if (s.phase !== 'buy') return false;
  const p = cur(s);
  const t = TILES[p.pos];
  if (p.cash < t.price) return false;
  p.cash -= t.price;
  s.owner[p.pos] = p.id;
  s.stats.bought += p.id === 0 ? 1 : 0;
  emit(s, { type: 'buy', p: p.id, tile: p.pos, price: t.price });
  note(s, `${p.name} buys ${t.name} for ${$(t.price)}.`);
  afterAcquire(s, p.id, p.pos);
  s.phase = 'post';
  return true;
}

function afterAcquire(s, pi, tile) {
  const t = TILES[tile];
  if (pi === 0) {
    const completed = t.group != null && ownsGroup(s, t.group, 0);
    const ai = someAI(s);
    if (ai >= 0) {
      if (completed) chat(s, ai, 'you_set', {}, 0.85);
      else chat(s, ai, 'you_buy', { tile: t.name }, 0.3);
    }
  } else chat(s, pi, 'buy', { tile: t.name }, 0.5);
}

export function declineBuy(s) {
  if (s.phase !== 'buy') return false;
  startAuction(s, cur(s).pos);
  return true;
}

// ----- auction -----
function startAuction(s, tile) {
  const order = [];
  for (let k = 1; k <= s.players.length; k++) {
    const p = s.players[(s.turn + k) % s.players.length];
    if (!p.bankrupt) order.push(p.id);
  }
  s.auction = { tile, bid: 0, leader: -1, order, idx: 0, out: [], max: {} };
  s.phase = 'auction';
  emit(s, { type: 'auction', tile });
  note(s, `${TILES[tile].name} goes to auction.`);
}
export const auctionActor = (s) => (s.auction ? s.auction.order[s.auction.idx] : -1);
export const minBid = (s) => (s.auction ? s.auction.bid + 10 : 10);

function auctionAdvance(s) {
  const a = s.auction;
  const left = a.order.filter((id) => !a.out.includes(id));
  if (left.length === 0) {
    emit(s, { type: 'unsold', tile: a.tile });
    note(s, `Nobody bids. ${TILES[a.tile].name} stays with the bank.`);
    s.auction = null;
    s.phase = 'post';
    return;
  }
  if (left.length === 1 && a.leader === left[0]) {
    const w = s.players[a.leader];
    w.cash -= a.bid;
    s.owner[a.tile] = w.id;
    emit(s, { type: 'sold', p: w.id, tile: a.tile, price: a.bid });
    note(s, `${w.name} wins ${TILES[a.tile].name} at auction for ${$(a.bid)}.`);
    chat(s, w.id, 'auction_win', { tile: TILES[a.tile].name }, 0.6);
    afterAcquire(s, w.id, a.tile);
    s.auction = null;
    s.phase = 'post';
    return;
  }
  let k = a.idx;
  do {
    k = (k + 1) % a.order.length;
  } while (a.out.includes(a.order[k]));
  a.idx = k;
}

export function auctionBid(s, pi, amount) {
  const a = s.auction;
  if (s.phase !== 'auction' || !a || auctionActor(s) !== pi) return false;
  amount = Math.round(amount);
  if (amount < a.bid + 10 || amount > s.players[pi].cash) return false;
  a.bid = amount;
  a.leader = pi;
  emit(s, { type: 'bid', p: pi, amount });
  if (pi !== 0) chat(s, pi, 'bid', { amt: amount }, 0.3);
  auctionAdvance(s);
  return true;
}
export function auctionOut(s, pi) {
  const a = s.auction;
  if (s.phase !== 'auction' || !a || auctionActor(s) !== pi) return false;
  a.out.push(pi);
  emit(s, { type: 'out', p: pi });
  if (pi !== 0) chat(s, pi, 'out', {}, 0.2);
  auctionAdvance(s);
  return true;
}

// ----- building -----
export function buildCost(i) {
  return GROUPS[TILES[i].group].house;
}
export function buildable(s, pi) {
  const p = s.players[pi];
  const out = [];
  for (const g of GROUPS) {
    if (!ownsGroup(s, g.id, pi)) continue;
    const tiles = GROUP_TILES[g.id];
    const lo = Math.min(...tiles.map((i) => s.level[i]));
    for (const i of tiles) {
      if (s.level[i] >= 4 || s.level[i] > lo) continue;
      if (p.cash < g.house) continue;
      out.push({ i, cost: g.house, level: s.level[i], gain: TILES[i].rent[s.level[i] + 1] - (s.level[i] === 0 ? TILES[i].rent[0] * 2 : TILES[i].rent[s.level[i]]) });
    }
  }
  return out;
}
export function build(s, pi, i) {
  if (s.over || s.turn !== pi || (s.phase !== 'roll' && s.phase !== 'post')) return false;
  const opt = buildable(s, pi).find((o) => o.i === i);
  if (!opt) return false;
  s.players[pi].cash -= opt.cost;
  s.level[i]++;
  s.stats.built += pi === 0 ? 1 : 0;
  s.built++;
  emit(s, { type: 'build', p: pi, tile: i, level: s.level[i] });
  note(s, `${s.players[pi].name} builds on ${TILES[i].name} (${s.level[i] === 4 ? 'hotel' : 'level ' + s.level[i]}).`);
  if (pi !== 0) chat(s, pi, 'build', {}, s.level[i] === 4 ? 0.7 : 0.35);
  return true;
}

export function endTurn(s) {
  if (s.over || s.phase !== 'post') return false;
  const p = cur(s);
  if (!p.bankrupt && s.extra && p.jail === 0) {
    s.extra = false;
    s.phase = 'roll';
    s.built = 0;
    emit(s, { type: 'turn', p: p.id, again: true });
    return true;
  }
  s.doubles = 0;
  s.extra = false;
  let k = s.turn;
  let wrapped = false;
  do {
    k = (k + 1) % s.players.length;
    if (k === 0) wrapped = true;
  } while (s.players[k].bankrupt);
  s.turn = k;
  if (wrapped) s.round++;
  s.built = 0;
  if (s.round > s.maxRounds) {
    gameOver(s);
    return true;
  }
  s.phase = 'roll';
  emit(s, { type: 'turn', p: k, round: s.round });
  if (k !== 0 || s.players[0].ai) chat(s, k, 'idle', {}, 0.07);
  return true;
}

function gameOver(s) {
  if (s.over) return;
  s.over = true;
  s.phase = 'over';
  const st = standings(s);
  s.winner = st[0].id;
  emit(s, { type: 'over', winner: s.winner });
  for (const p of s.players) {
    if (p.key === 'human' || p.bankrupt) continue;
    chat(s, p.id, p.id === s.winner ? 'win' : 'lose', {}, 1);
  }
}
export function resign(s) {
  if (s.over) return;
  goBankrupt(s, 0, -1);
  if (!s.over) gameOver(s);
}

// ----- rival AI -----
const RESERVE = { cautious: 320, bold: 90, collector: 200, human: 200 };

function valueFor(s, pi, i) {
  const t = TILES[i];
  const p = s.players[pi];
  let v = t.price;
  if (t.type === 'station') v = t.price * (1 + 0.2 * stationsOwned(s, pi));
  else if (t.type === 'utility') v = t.price * (0.9 + 0.2 * utilitiesOwned(s, pi));
  else {
    const g = t.group;
    const mine = countInGroup(s, g, pi);
    const size = GROUP_TILES[g].length;
    if (mine === size - 1) v *= 1.9;
    else if (mine > 0) v *= 1.25;
    for (const q of s.players) {
      if (q.id === pi || q.bankrupt) continue;
      if (mine === 0 && countInGroup(s, g, q.id) === size - 1) v *= 1.5; // block a rival's set
    }
    const owners = new Set(GROUP_TILES[g].map((x) => s.owner[x]).filter((o) => o >= 0 && o !== pi));
    if (mine === 0 && owners.size >= 2) v *= 0.75;
    if (p.style === 'collector' && mine > 0) v *= 1.25;
  }
  if (p.style === 'bold') v *= 1.15;
  if (p.style === 'cautious') v *= 0.92;
  if (s.diff === 1) v *= 0.65 + s.rnd() * 0.7;
  else if (s.diff === 2) v *= 0.88 + s.rnd() * 0.24;
  return Math.round(v);
}

function reserveFor(s, pi) {
  const base = RESERVE[s.players[pi].style] ?? 200;
  return Math.round(base * (s.diff === 1 ? 0.7 : s.diff === 3 ? 1.1 : 1));
}

function wantsToBuy(s, pi) {
  const p = s.players[pi];
  const t = TILES[p.pos];
  if (p.cash < t.price) return false;
  const v = valueFor(s, pi, p.pos);
  let reserve = reserveFor(s, pi);
  if (t.group != null && countInGroup(s, t.group, pi) === GROUP_TILES[t.group].length - 1) reserve = Math.round(reserve / 3);
  if (s.round <= 3) reserve = Math.round(reserve / 2);
  if (p.cash - t.price < reserve) return false;
  if (s.diff === 1 && s.rnd() < 0.25) return false;
  return v >= t.price * 0.9;
}

function bestBuild(s, pi) {
  const opts = buildable(s, pi);
  if (!opts.length) return null;
  const reserve = Math.round(reserveFor(s, pi) * 0.9);
  const ok = opts.filter((o) => s.players[pi].cash - o.cost >= reserve);
  if (!ok.length) return null;
  ok.sort((a, b) => b.gain / b.cost - a.gain / a.cost);
  return s.diff === 1 && s.rnd() < 0.4 ? null : ok[0];
}

// Perform one action for whoever must act. Returns false when it is a human's decision.
export function aiStep(s) {
  if (s.over) return false;
  if (s.phase === 'auction') {
    const pi = auctionActor(s);
    const p = s.players[pi];
    if (!p.ai) return false;
    const a = s.auction;
    if (a.max[pi] == null) a.max[pi] = Math.min(valueFor(s, pi, a.tile), p.cash - Math.round(reserveFor(s, pi) / 4));
    const cap = Math.min(a.max[pi], p.cash);
    if (a.bid + 10 <= cap) {
      const inc = [10, 10, 20, 30][Math.floor(s.rnd() * 4)];
      return auctionBid(s, pi, Math.min(cap, Math.max(a.bid + 10, a.bid + inc)));
    }
    return auctionOut(s, pi);
  }
  const p = cur(s);
  if (!p.ai) return false;
  if (s.phase === 'roll') {
    if (p.jail > 0) {
      if (p.cards > 0 && useJailCard(s)) return true;
      if (p.cash > 450 && s.round < 11 && s.rnd() < 0.8 && payJail(s)) return true;
    }
    if (s.built < 2) {
      const b = bestBuild(s, p.id);
      if (b && build(s, p.id, b.i)) return true;
    }
    return roll(s);
  }
  if (s.phase === 'buy') return wantsToBuy(s, p.id) ? buy(s) : declineBuy(s);
  if (s.phase === 'post') {
    if (s.built < 2) {
      const b = bestBuild(s, p.id);
      if (b && build(s, p.id, b.i)) return true;
    }
    return endTurn(s);
  }
  return false;
}

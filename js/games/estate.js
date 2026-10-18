// Tycoon Row: board UI for estate-core.js. Rivals move on their own, talk in a chat feed, and wait on you for decisions.
import * as core from './estate-core.js';
import { PERSONAS } from './estate-chat.js';
import { h, s as svgEl, haptic, fill } from '../ui.js';
import { gameTop, hud, overlay } from './common.js';

// a drawn ivory die with rounded corners, a lit top and a shaded side
const PIPS = { 1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[26, 26], [50, 50], [74, 74]], 4: [[28, 28], [72, 28], [28, 72], [72, 72]], 5: [[26, 26], [74, 26], [50, 50], [26, 74], [74, 74]], 6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]] };
function dieArt(n, rolling = false) {
  return svgEl(
    'svg',
    { class: 'die' + (rolling ? ' rolling' : ''), viewBox: '0 0 100 108', 'aria-hidden': 'true' },
    svgEl('rect', { x: 4, y: 12, width: 92, height: 92, rx: 22, fill: '#b9bfd3' }),
    svgEl('rect', { x: 4, y: 4, width: 92, height: 92, rx: 22, fill: '#fbfbff' }),
    svgEl('rect', { x: 10, y: 8, width: 80, height: 30, rx: 15, fill: '#fff', opacity: 0.9 }),
    ...PIPS[n].map(([x, y]) => svgEl('circle', { cx: x, cy: y + 2, r: 9, fill: n === 1 ? '#e0344f' : '#1d2340' })),
  );
}
const TILE_EMOJI = { start: '🏁', jail: '🔒', park: '🧺', goto: '👮', wild: '❓', tax: '💸', station: '🚇', utility: '💡' };

// board index (0 = Payday, bottom-right, clockwise) to grid column and row on the 11 x 11 grid
function cellOf(i) {
  if (i <= 10) return [10 - i, 10];
  if (i <= 20) return [0, 20 - i];
  if (i <= 30) return [i - 20, 0];
  return [10, i - 30];
}
// which edge a square sits on decides where its color band goes (always on the inner edge, toward the middle)
function sideOf(i) {
  const [c, r] = cellOf(i);
  if (r === 10 && c > 0 && c < 10) return 'bottom';
  if (r === 0 && c > 0 && c < 10) return 'top';
  if (c === 0 && r > 0 && r < 10) return 'left';
  if (c === 10 && r > 0 && r < 10) return 'right';
  return 'corner';
}
const money = (n) => '$' + n.toLocaleString();

export function mount(root, ctx) {
  const store = ctx.store;
  let diff = Math.max(1, Math.min(3, Math.round(store.pref('estate', 'diff', 2))));
  let rounds = (() => {
    const r = Math.round(store.pref('estate', 'rounds', core.MAX_ROUNDS));
    return core.ROUND_CHOICES.includes(r) ? r : core.MAX_ROUNDS;
  })();
  let s = null;
  let dead = false;
  let paused = false;
  let driving = false;
  let fast = false;
  let state = 'ready'; // ready | play | paused | over
  let pauseOv = null;
  let reactReady = true;

  const round = hud('Round', '1/' + rounds);
  const worth = hud('Your cash', money(core.START_CASH));
  const speedBtn = h('button', { class: 'icon-btn es-speed', type: 'button', 'aria-label': 'Speed', onclick: () => ((fast = !fast), (speedBtn.textContent = fast ? '2×' : '1×')) }, '1×');
  const top = gameTop({ title: 'Tycoon Row', onMenu: () => openPause(), right: h('div', { class: 'hud-row' }, speedBtn, round.el, worth.el) });

  const chips = h('div', { class: 'es-players' });
  const board = h('div', { class: 'es-board', role: 'grid', 'aria-label': 'Game board' });
  const status = h('div', { class: 'es-status', role: 'status', 'aria-live': 'polite' }, 'Welcome to Tycoon Row.');
  const diceEl = h('div', { class: 'es-dice', 'aria-hidden': 'true' }, dieArt(5), dieArt(3));
  const feed = h('div', { class: 'es-feed', 'aria-live': 'off' });
  const meta = h('div', { class: 'es-meta' });
  const logo = h('div', { class: 'es-logo' }, h('b', null, 'TYCOON'), h('span', null, 'ROW'));
  const center = h('div', { class: 'es-center' }, logo, meta, status, diceEl, feed);
  board.append(center);
  const actions = h('div', { class: 'es-actions' });
  const reacts = h(
    'div',
    { class: 'es-react', role: 'group', 'aria-label': 'Quick chat' },
    [['cool', '😎'], ['oops', '😅'], ['deal', '🤝'], ['mad', '😤']].map(([k, e]) => h('button', { class: 'react-btn', type: 'button', 'aria-label': 'Say ' + e, onclick: () => sendReact(k, e) }, e)),
  );
  const el = h('div', { class: 'es' }, top, chips, h('div', { class: 'es-boardwrap' }, board), actions, reacts);
  root.append(el);

  // ----- board tiles -----
  const tileEls = [];
  const tokenEls = [];
  for (const t of core.TILES) {
    const [c, r] = cellOf(t.i);
    const side = sideOf(t.i);
    const band = t.type === 'prop' ? h('i', { class: 't-band', style: { background: core.GROUPS[t.group].color } }) : null;
    const tokens = h('span', { class: 't-tokens' });
    const pips = h('span', { class: 't-pips' });
    const owner = h('span', { class: 't-owner' });
    const emoji = t.emoji || TILE_EMOJI[t.type];
    const tile = h(
      'button',
      {
        class: 'es-tile ' + t.type + ' side-' + side,
        type: 'button',
        style: { 'grid-column': String(c + 1), 'grid-row': String(r + 1) },
        'aria-label': t.name,
        onclick: () => showTile(t.i),
      },
      band,
      emoji ? h('span', { class: 't-emoji' }, emoji) : null,
      h('span', { class: 't-name' }, t.short),
      t.price ? h('span', { class: 't-price' }, '$' + t.price) : null,
      pips,
      owner,
      tokens,
    );
    tile._pips = pips;
    tile._owner = owner;
    tile._tokens = tokens;
    tileEls[t.i] = tile;
    board.append(tile);
  }

  function refreshTiles() {
    for (const t of core.TILES) {
      const tile = tileEls[t.i];
      const o = s.owner[t.i];
      if (o >= 0) {
        tile.classList.add('owned');
        tile.style.setProperty('--own', s.players[o].color);
        if (tile._ownedBy !== o) {
          tile._owner.textContent = s.players[o].face;
          tile._ownedBy = o;
          tile.classList.remove('flash');
          void tile.offsetWidth;
          tile.classList.add('flash');
        }
      } else {
        tile.classList.remove('owned', 'flash');
        tile.style.removeProperty('--own');
        tile._owner.textContent = '';
        tile._ownedBy = -1;
      }
      const lv = s.level[t.i];
      if (tile._lv !== lv) {
        tile._lv = lv;
        fill(tile._pips, lv >= 4 ? h('i', { class: 'hotel' }) : Array.from({ length: lv }, () => h('i', { class: 'house' })));
      }
    }
  }
  function placeToken(p, pos) {
    let tk = tokenEls[p.id];
    if (!tk) {
      tk = h('span', { class: 'tok', style: { '--pc': p.color }, title: p.name }, p.face);
      tokenEls[p.id] = tk;
    }
    tileEls[pos]._tokens.append(tk);
    tk.classList.toggle('out', p.bankrupt);
    for (const q of s.players) if (tokenEls[q.id]) tokenEls[q.id].classList.toggle('turn', q.id === s.turn && !s.over);
  }

  function setPips(pi) {
    return h(
      'span',
      { class: 'ec-sets' },
      core.GROUPS.map((g) => {
        const n = core.countInGroup(s, g.id, pi);
        const size = core.GROUP_TILES[g.id].length;
        return h('i', { class: 'ec-set' + (n === size ? ' full' : n ? ' part' : ''), style: { '--gc': g.color }, title: `${g.name} ${n}/${size}` });
      }),
    );
  }
  function refreshChips() {
    fill(
      chips,
      s.players.map((p) => {
        const mine = s.owner.filter((o) => o === p.id).length;
        return h(
          'button',
          { class: 'es-chip' + (s.turn === p.id && !s.over ? ' active' : '') + (p.bankrupt ? ' out' : ''), type: 'button', style: { '--pc': p.color }, 'aria-label': `${p.name}: see deeds`, onclick: () => showDeeds(p.id) },
          h('span', { class: 'ec-face' }, p.face),
          h('span', { class: 'ec-name' }, p.name),
          h('b', { class: 'ec-cash' }, p.bankrupt ? 'Out' : money(p.cash)),
          p.bankrupt ? null : setPips(p.id),
          h('small', { class: 'ec-sub' }, p.bankrupt ? '' : `${mine} ${mine === 1 ? 'deed' : 'deeds'}${p.jail ? ' · time-out' : ''}`),
        );
      }),
    );
    round.set(`${Math.min(s.round, s.maxRounds)}/${s.maxRounds}`);
    worth.set(money(s.players[0].cash));
    for (const q of s.players) if (tokenEls[q.id]) tokenEls[q.id].classList.toggle('turn', q.id === s.turn && !s.over);
    meta.textContent = `Round ${Math.min(s.round, s.maxRounds)} of ${s.maxRounds}  ·  Picnic pot ${money(s.pot)}`;
  }

  function showDeeds(pi) {
    const p = s.players[pi];
    const rows = [];
    for (const g of core.GROUPS) {
      const own = core.GROUP_TILES[g.id].filter((i) => s.owner[i] === pi);
      if (!own.length) continue;
      const full = own.length === core.GROUP_TILES[g.id].length;
      rows.push(
        h(
          'div',
          { class: 'deed-row' },
          h('i', { class: 'deed-dot', style: { background: g.color } }),
          h('div', null, h('b', null, `${g.name} ${own.length}/${core.GROUP_TILES[g.id].length}${full ? ' · full set' : ''}`), h('small', null, own.map((i) => core.TILES[i].short + (s.level[i] ? (s.level[i] >= 4 ? ' 🏨' : ' ×' + s.level[i]) : '')).join(', '))),
        ),
      );
    }
    const lines = core.STATION_TILES.filter((i) => s.owner[i] === pi);
    const util = core.UTILITY_TILES.filter((i) => s.owner[i] === pi);
    if (lines.length) rows.push(h('div', { class: 'deed-row' }, h('i', { class: 'deed-dot', style: { background: '#9aa4b8' } }), h('div', null, h('b', null, `Lines ${lines.length}/${core.STATION_TILES.length}`), h('small', null, lines.map((i) => core.TILES[i].short).join(', ')))));
    if (util.length) rows.push(h('div', { class: 'deed-row' }, h('i', { class: 'deed-dot', style: { background: '#e8d9a0' } }), h('div', null, h('b', null, `Utilities ${util.length}/${core.UTILITY_TILES.length}`), h('small', null, util.map((i) => core.TILES[i].short).join(', ')))));
    overlay(el, {
      title: `${p.face} ${p.name}`,
      body: h('div', { class: 'es-deeds' }, h('p', null, p.bankrupt ? 'Out of the game.' : `${money(p.cash)} cash · net worth ${money(core.netWorth(s, pi))}`), rows.length ? rows : h('p', null, 'No deeds yet.')),
      buttons: [{ label: 'Close', kind: 'primary' }],
    });
  }

  // ----- timing helpers -----
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
  async function wait(ms) {
    await sleep(fast ? ms * 0.45 : ms);
    while (paused && !dead) await sleep(120);
  }
  const say = (text) => {
    status.textContent = text;
  };

  // ----- chat feed -----
  const messages = [];
  function paintFeed(typing) {
    fill(
      feed,
      ...messages.slice(-4).map((m) => h('div', { class: 'es-msg' + (m.mine ? ' mine' : ''), style: { '--pc': m.color } }, h('span', { class: 'm-face' }, m.face), h('span', { class: 'm-text' }, m.text))),
      typing ? h('div', { class: 'es-typing' }, `${typing} is typing`, h('i', null, '•••')) : null,
    );
  }
  async function showChat(e) {
    const p = s.players[e.from];
    paintFeed(p.name);
    await wait(380 + Math.min(900, e.text.length * 16));
    messages.push({ face: p.face, text: e.text, color: p.color });
    paintFeed(null);
    ctx.audio.beep(900, 40, 0.04, 'sine');
    await wait(260);
  }
  function sendReact(kind, emoji) {
    if (state !== 'play' || !reactReady || s.over) return;
    reactReady = false;
    setTimeout(() => (reactReady = true), 2600);
    messages.push({ face: s.players[0].face, text: emoji, color: s.players[0].color, mine: true });
    paintFeed(null);
    core.react(s, kind);
    drive();
  }

  // ----- playing core events on screen -----
  async function playEvents() {
    const list = s.events.splice(0, s.events.length);
    for (const e of list) {
      if (dead) return;
      switch (e.type) {
        case 'turn': {
          refreshChips();
          const p = s.players[e.p];
          say(p.ai || e.p !== 0 ? `${p.name}'s turn` : e.again ? 'Doubles! Roll again.' : 'Your turn');
          if (e.round && e.p === 0) haptic(10);
          await wait(220);
          break;
        }
        case 'roll': {
          for (let k = 0; k < 4; k++) {
            diceEl.replaceChildren(dieArt(1 + Math.floor(Math.random() * 6), true), dieArt(1 + Math.floor(Math.random() * 6), true));
            ctx.audio.tick();
            await wait(85);
          }
          diceEl.replaceChildren(dieArt(e.d1), dieArt(e.d2));
          diceEl.classList.remove('land');
          void diceEl.offsetWidth;
          diceEl.classList.add('land');
          say(`${s.players[e.p].name} rolled ${e.d1 + e.d2}${e.d1 === e.d2 ? ' (doubles)' : ''}`);
          await wait(420);
          break;
        }
        case 'move': {
          const p = s.players[e.p];
          if (e.jump) placeToken(p, e.to);
          else {
            const dir = e.to >= e.from || e.from - e.to > 14 ? 1 : -1;
            let pos = e.from;
            let guard = 0;
            while (pos !== e.to && guard++ < 30) {
              pos = (pos + dir + core.N) % core.N;
              placeToken(p, pos);
              await wait(95);
            }
          }
          break;
        }
        case 'payday':
          say(`${s.players[e.p].name} collects ${money(e.amount)}`);
          if (e.p === 0) ctx.audio.good();
          refreshChips();
          await wait(380);
          break;
        case 'offer':
          say(`${s.players[e.p].name} landed on ${core.TILES[e.tile].name}`);
          await wait(200);
          break;
        case 'buy':
        case 'sold':
          refreshTiles();
          refreshChips();
          say(`${s.players[e.p].name} ${e.type === 'buy' ? 'bought' : 'won'} ${core.TILES[e.tile].name} for ${money(e.price)}`);
          ctx.audio.good();
          if (e.p === 0) haptic(14);
          await wait(560);
          break;
        case 'rent':
          refreshChips();
          say(`${s.players[e.from].name} pays ${s.players[e.to].name} ${money(e.amount)}`);
          if (e.from === 0) {
            ctx.audio.bad();
            haptic(24);
          } else if (e.to === 0) ctx.audio.good();
          await wait(620);
          break;
        case 'tax':
          refreshChips();
          say(`${s.players[e.p].name} pays ${money(e.amount)} in tax`);
          await wait(480);
          break;
        case 'picnic':
          refreshChips();
          say(`${s.players[e.p].name} wins the picnic pot: ${money(e.amount)}`);
          await wait(560);
          break;
        case 'card':
          say(`Wildcard: ${e.text}`);
          ctx.audio.beep(520, 90, 0.07, 'triangle');
          refreshChips();
          await wait(1500);
          break;
        case 'jail':
          say(`${s.players[e.p].name} goes to Time-out`);
          if (e.p === 0) haptic([20, 30, 20]);
          refreshChips();
          await wait(520);
          break;
        case 'build':
          refreshTiles();
          refreshChips();
          say(`${s.players[e.p].name} builds on ${core.TILES[e.tile].name}`);
          ctx.audio.good();
          await wait(520);
          break;
        case 'auction':
          say(`Auction: ${core.TILES[e.tile].name}`);
          await wait(360);
          break;
        case 'bid':
          say(`${s.players[e.p].name} bids ${money(e.amount)}`);
          ctx.audio.tick();
          await wait(420);
          break;
        case 'out':
          say(`${s.players[e.p].name} is out`);
          await wait(200);
          break;
        case 'unsold':
          say('No bids. The bank keeps it.');
          await wait(400);
          break;
        case 'sell':
          refreshTiles();
          refreshChips();
          await wait(260);
          break;
        case 'bankrupt':
          refreshTiles();
          refreshChips();
          for (const p of s.players) if (p.bankrupt && tokenEls[p.id]) tokenEls[p.id].classList.add('out');
          say(`${s.players[e.p].name} is bankrupt`);
          ctx.audio.bad();
          await wait(900);
          break;
        case 'chat':
          await showChat(e);
          break;
        case 'over':
          break;
        default:
      }
    }
    refreshChips();
    refreshTiles();
  }

  // ----- who acts next -----
  function humanToAct() {
    if (s.over) return false;
    if (s.phase === 'auction') return core.auctionActor(s) === 0;
    return s.turn === 0 && (s.phase === 'roll' || s.phase === 'buy' || s.phase === 'post');
  }

  async function drive() {
    if (driving || dead || !s) return;
    driving = true;
    actions.replaceChildren();
    try {
      for (;;) {
        await playEvents();
        if (dead) return;
        if (s.over) {
          await finish();
          return;
        }
        if (humanToAct()) break;
        await wait(380);
        if (dead) return;
        core.aiStep(s);
      }
    } finally {
      driving = false;
    }
    renderControls();
  }

  // ----- human controls -----
  const btn = (label, cls, fn, sub, disabled) =>
    h('button', { class: 'abtn ' + (cls || ''), type: 'button', disabled: disabled ? true : null, onclick: fn }, h('strong', null, label), sub ? h('span', null, sub) : null);

  function renderControls() {
    if (state !== 'play' || s.over) return;
    const p = s.players[0];
    const row = [];
    const canBuild = core.buildable(s, 0).length > 0 && s.turn === 0 && (s.phase === 'roll' || s.phase === 'post');
    if (s.phase === 'auction' && core.auctionActor(s) === 0) {
      const a = s.auction;
      const t = core.TILES[a.tile];
      say(`Auction: ${t.name}. ${a.bid ? `${s.players[a.leader].name} leads at ${money(a.bid)}` : 'No bids yet'}`);
      const lo = core.minBid(s);
      const opts = [lo, lo + 40, lo + 90];
      for (const v of opts) row.push(btn('Bid ' + money(v), 'on', () => act(() => core.auctionBid(s, 0, v)), null, v > p.cash));
      row.push(btn('Out', '', () => act(() => core.auctionOut(s, 0))));
    } else if (s.phase === 'buy') {
      const t = core.TILES[p.pos];
      say(`${t.name}: ${money(t.price)}. Buy it?`);
      row.push(btn('Buy', 'on', () => act(() => core.buy(s)), money(t.price)));
      row.push(btn('Auction', '', () => act(() => core.declineBuy(s)), 'others bid'));
    } else if (s.phase === 'roll') {
      if (p.jail > 0) {
        say('You are in Time-out. Pay, or roll for doubles.');
        row.push(btn('Pay ' + money(core.JAIL_FEE), '', () => act(() => core.payJail(s)), 'leave now', p.cash < core.JAIL_FEE));
        if (p.cards > 0) row.push(btn('Use card', '', () => act(() => core.useJailCard(s)), 'free pass'));
        row.push(btn('Roll', 'on', () => act(() => core.roll(s)), 'need doubles'));
      } else {
        say(s.extra ? 'Doubles! Roll again.' : 'Your turn. Roll the dice.');
        row.push(btn('Roll dice', 'on', () => act(() => core.roll(s)), '🎲'));
      }
      if (canBuild) row.push(btn('Build', '', openBuild, 'add houses'));
    } else if (s.phase === 'post') {
      say('Done? You can build before ending your turn.');
      if (s.extra && p.jail === 0 && !p.bankrupt) row.push(btn('Roll again', 'on', () => act(() => core.endTurn(s) && core.roll(s)), 'doubles'));
      else row.push(btn('End turn', 'on', () => act(() => core.endTurn(s))));
      if (canBuild) row.push(btn('Build', '', openBuild, 'add houses'));
    }
    actions.replaceChildren(...row);
  }
  function act(fn) {
    if (state !== 'play' || driving) return;
    fn();
    drive();
  }

  function openBuild() {
    const list = core.buildable(s, 0);
    if (!list.length) return;
    const ov = overlay(el, {
      title: 'Build',
      body: h(
        'div',
        { class: 'es-build' },
        h('p', null, `You have ${money(s.players[0].cash)}. Buildings raise the rent on that deed. Build evenly across a set.`),
        list.map((o) => {
          const t = core.TILES[o.i];
          return h(
            'button',
            {
              class: 'es-build-row',
              type: 'button',
              onclick: () => {
                ov.close();
                act(() => core.build(s, 0, o.i));
              },
            },
            h('i', { class: 'b-dot', style: { background: core.GROUPS[t.group].color } }),
            h('span', { class: 'b-name' }, t.name),
            h('span', { class: 'b-lv' }, o.level >= 3 ? 'Hotel next' : `Level ${o.level} → ${o.level + 1}`),
            h('b', null, money(o.cost)),
          );
        }),
      ),
      buttons: [{ label: 'Close' }],
    });
  }

  function showTile(i) {
    const t = core.TILES[i];
    const o = s.owner[i];
    const lines = [];
    if (t.type === 'prop') {
      lines.push(h('p', null, `${core.GROUPS[t.group].name} set · deed ${money(t.price)} · buildings ${money(core.GROUPS[t.group].house)} each`));
      lines.push(h('ul', { class: 'rent-list' }, h('li', null, `Rent ${money(t.rent[0])} (double with the full set)`), h('li', null, `1 building ${money(t.rent[1])}`), h('li', null, `2 buildings ${money(t.rent[2])}`), h('li', null, `3 buildings ${money(t.rent[3])}`), h('li', null, `Hotel ${money(t.rent[4])}`)));
    } else if (t.type === 'utility') lines.push(h('p', null, `Deed ${money(t.price)}. Rent is 4 times the dice roll, or 10 times if the owner has both utilities.`));
    else if (t.type === 'station') lines.push(h('p', null, `Deed ${money(t.price)}. Rent $25, $50 or $100 depending on how many Lines the owner has.`));
    else if (t.type === 'tax') lines.push(h('p', null, `Pay ${money(t.amount)}. It goes into the Picnic pot.`));
    else if (t.type === 'park') lines.push(h('p', null, `Landing here wins the Picnic pot. It holds ${money(s.pot)} right now.`));
    else if (t.type === 'wild') lines.push(h('p', null, 'Draw a Wildcard. Could be cash, a bill, or a surprise trip.'));
    else if (t.type === 'start') lines.push(h('p', null, `Collect ${money(core.PAYDAY)} every time you pass.`));
    else if (t.type === 'jail') lines.push(h('p', null, 'Just visiting is safe. If sent here, pay, roll doubles, or wait three turns.'));
    else if (t.type === 'goto') lines.push(h('p', null, 'Go straight to Time-out.'));
    if (t.price) lines.push(h('p', { class: 'owner-line' }, o >= 0 ? `Owner: ${s.players[o].name}${s.level[i] ? `, ${s.level[i] >= 4 ? 'hotel' : s.level[i] + ' building' + (s.level[i] > 1 ? 's' : '')}` : ''}` : 'Not owned yet'));
    overlay(el, { title: t.name, body: h('div', null, lines), buttons: [{ label: 'Close', kind: 'primary' }] });
  }

  // ----- start / end -----
  function setup() {
    s = core.createGame({ seed: (Date.now() ^ 0x85ebca6b) & 0x7fffffff, difficulty: diff, rounds });
    messages.length = 0;
    paintFeed(null);
    for (const p of s.players) placeToken(p, 0);
    refreshChips();
    refreshTiles();
    state = 'play';
    round.set(`1/${rounds}`);
    say('Welcome to Tycoon Row.');
    drive();
  }

  async function finish() {
    if (state === 'over') return;
    state = 'over';
    actions.replaceChildren();
    await wait(900);
    if (dead) return;
    const st = core.standings(s);
    const place = st.findIndex((x) => x.id === 0);
    const score = core.netWorth(s, 0) + [1500, 800, 300, 0][place];
    const won = place === 0;
    if (won && diff < 3) store.setPref('estate', 'diff', diff + 1);
    ctx.finish({
      score,
      level: diff,
      completed: true,
      extra: [`You finished ${['1st', '2nd', '3rd', '4th'][place]} of 4`, ...st.map((x, k) => `${k + 1}. ${x.name}: ${x.bankrupt ? 'bankrupt' : money(x.worth)}`), won && diff < 3 ? 'Your rivals will play tougher next time' : `Rivals: ${['Easy', 'Normal', 'Hard'][diff - 1]}`],
    });
  }

  function openPause() {
    if (state !== 'play' || pauseOv) return;
    paused = true;
    pauseOv = overlay(el, {
      title: 'Paused',
      body: h('p', null, 'The game is on hold.'),
      buttons: [
        { label: 'Quit game', kind: 'danger', onclick: () => ctx.exit() },
        {
          label: 'Resume',
          kind: 'primary',
          onclick: () => {
            pauseOv = null;
            paused = false;
          },
        },
      ],
    });
  }

  // ----- intro: choose the rivals' skill -----
  function showReady() {
    const names = ['Easy', 'Normal', 'Hard'];
    const notes = ['Rivals make mistakes and overpay.', 'Rivals play sensibly.', 'Rivals bid sharply, block your sets and build fast.'];
    const body = h('div', { class: 'howto' });
    function paint() {
      fill(
        body,
        h('p', null, `Race around the 40-square board for ${rounds} rounds. Buy deeds, collect rent, build on full sets, and finish richest.`),
        h('ul', null, h('li', null, 'Land on an unowned deed to buy it, or send it to auction.'), h('li', null, 'Own every deed in a color to double its rent and build on it.'), h('li', null, 'Squares glow in their owner\u2019s color. Tap any square or player to see deeds and rents.')),
        h('div', { class: 'es-roster' }, ['penny', 'rex', 'vera'].map((k) => h('div', { class: 'es-rival', style: { '--pc': PERSONAS[k].color } }, h('span', null, PERSONAS[k].face), h('div', null, h('b', null, PERSONAS[k].name), h('small', null, PERSONAS[k].bio))))),
        h('div', { class: 'theme-chips', role: 'radiogroup', 'aria-label': 'Rival skill' }, names.map((n, i) => h('button', { class: 'theme-chip' + (diff === i + 1 ? ' on' : ''), type: 'button', role: 'radio', 'aria-checked': diff === i + 1 ? 'true' : 'false', onclick: () => ((diff = i + 1), store.setPref('estate', 'diff', diff), paint()) }, h('small', null, n)))),
        h('p', { class: 'theme-desc' }, notes[diff - 1]),
        h('strong', { class: 'es-len-h' }, 'Game length'),
        h('div', { class: 'theme-chips three', role: 'radiogroup', 'aria-label': 'Game length' }, core.ROUND_CHOICES.map((n) => h('button', { class: 'theme-chip' + (rounds === n ? ' on' : ''), type: 'button', role: 'radio', 'aria-checked': rounds === n ? 'true' : 'false', onclick: () => ((rounds = n), store.setPref('estate', 'rounds', n), paint()) }, h('span', null, n), h('small', null, n === 12 ? 'Quick' : n === 20 ? 'Standard' : 'Long')))),
      );
    }
    paint();
    overlay(el, { title: 'Tycoon Row', body, buttons: [{ label: 'Deal me in', kind: 'primary', onclick: setup }] });
  }
  showReady();

  return {
    destroy() {
      dead = true;
    },
    pause: openPause,
    onBack() {
      if (state === 'play') {
        openPause();
        return true;
      }
      if (state === 'paused' && pauseOv) return true;
      return false;
    },
  };
}

// Home screen: a console-style carousel. One swipe moves exactly one game; tap the centered card (or Play) to enter.
import { h, s, icon, haptic, toast, fmtNum } from './ui.js';
import { GAMES } from './registry.js';
import { store } from './store.js';
import { rotation, overdue, streak, weeklySeries, weekDelta, daysUntil, sessionsInWeek, weekStart } from './weekly.js';
import { gameArt } from './art.js';

export function mountHub(root, ctx) {
  const now = Date.now();
  const sessions = store.sessions();
  const rot = rotation(sessions, now);
  const st = streak(sessions, now);
  const due = overdue(sessions, now);
  const dueText = (x) => (x.never ? 'Not played yet' : `Not played in ${x.days} days`);
  const checkedInThisWeek = store.checkins().some((c) => c.t >= rot.weekStart);
  // Open on the most overdue game, else the first one not yet played this week.
  let focus = due.length ? GAMES.findIndex((g) => g.id === due[0].id) : Math.max(0, GAMES.findIndex((g) => rot.counts[g.id] === 0));
  if (rot.complete) {
    // land on the game played least this week
    focus = GAMES.reduce((best, g, i) => (rot.counts[g.id] < rot.counts[GAMES[best].id] ? i : best), 0);
  }
  let raf = 0;
  let step = 1;

  // ---- backdrop: one layer per game, cross-faded with opacity (cheap on the GPU) ----
  const backdrop = h(
    'div',
    { class: 'hub-backdrop', 'aria-hidden': 'true' },
    GAMES.map((g) => h('div', { class: 'bd', style: { '--ar': g.rgb, '--a': g.accent, '--b': g.accent2 } })),
  );

  // ---- top strip ----
  const clock = h('span', { class: 'hub-clock' });
  const left = daysUntil(rot.nextWeek, now);
  const rotationLabel = rot.complete
    ? 'Rotation complete'
    : `${rot.playedCount} of ${GAMES.length} played this week`;
  const top = h(
    'header',
    { class: 'hub-top' },
    h(
      'div',
      { class: 'rotation', role: 'group', 'aria-label': 'Weekly rotation progress' },
      h(
        'div',
        { class: 'rot-segs' },
        GAMES.map((g) =>
          h('span', {
            class: 'rot-seg' + (rot.counts[g.id] > 0 ? ' done' : ''),
            style: { '--a': g.accent },
            title: g.name + (rot.counts[g.id] > 0 ? ' played' : ' not played yet'),
          }),
        ),
      ),
      h(
        'span',
        { class: 'rot-text' },
        rotationLabel + (rot.complete ? '' : `, ${left} ${left === 1 ? 'day' : 'days'} left`) + (st > 0 ? `, ${st}-week streak` : ''),
      ),
    ),
    clock,
  );

  // ---- carousel ----
  const track = h('div', { class: 'track', role: 'listbox', 'aria-label': 'Games', tabindex: '0' });
  const cards = GAMES.map((g, i) => {
    const late = due.find((x) => x.id === g.id);
    const played = rot.counts[g.id] > 0;
    const card = h(
      'div',
      {
        class: 'card' + (late ? ' overdue' : ''),
        role: 'option',
        'aria-label': g.name + (late ? ', ' + dueText(late) : ''),
        style: { '--a': g.accent, '--b': g.accent2, '--ar': g.rgb },
        onclick: () => {
          if (i === focus) enter(i);
          else scrollTo(i);
        },
      },
      h('div', { class: 'card-art' }, gameArt(g)),
      h(
        'div',
        { class: 'card-meta' },
        h('span', { class: 'card-tag' }, g.tag),
        h('strong', { class: 'card-name' }, g.name),
      ),
      played ? h('span', { class: 'card-badge', 'aria-label': 'Played this week' }, icon('check', 18)) : null,
      late ? h('span', { class: 'card-due' }, dueText(late)) : null,
    );
    return card;
  });
  track.append(...cards);

  const prev = h('button', { class: 'nav-arrow left', type: 'button', 'aria-label': 'Previous game', onclick: () => scrollTo(focus - 1) }, icon('left', 22));
  const next = h('button', { class: 'nav-arrow right', type: 'button', 'aria-label': 'Next game', onclick: () => scrollTo(focus + 1) }, icon('right', 22));
  const stage = h('div', { class: 'hub-stage' }, track, prev, next);

  // ---- info panel ----
  const info = {
    name: h('h1', { class: 'info-name' }),
    blurb: h('p', { class: 'info-blurb' }),
    trains: h('p', { class: 'info-trains' }),
    stat: h('p', { class: 'info-stat' }),
    play: h('button', { class: 'play-btn', type: 'button', onclick: () => enter(focus) }),
    quick: h('div', { class: 'info-quick', role: 'group', 'aria-label': 'Jump straight in' }),
  };
  const dots = h('div', { class: 'dots', 'aria-hidden': 'true' }, GAMES.map(() => h('span', { class: 'dot' })));
  const infoEl = h(
    'section',
    { class: 'hub-info', 'aria-live': 'polite' },
    dots,
    info.name,
    info.blurb,
    info.trains,
    info.quick,
    h('div', { class: 'info-row' }, info.stat, info.play),
  );

  // ---- dock ----
  const dockBtn = (name, label, to, dot) =>
    h(
      'button',
      { class: 'dock-btn', type: 'button', onclick: () => ctx.nav.go(to) },
      h('span', { class: 'dock-ico' }, icon(name, 22), dot ? h('i', { class: 'dock-dot', 'aria-hidden': 'true' }) : null),
      h('span', { class: 'dock-label' }, label),
    );
  const dock = h(
    'nav',
    { class: 'hub-dock', 'aria-label': 'More' },
    dockBtn('stats', 'Progress', 'stats'),
    dockBtn('pulse', 'Check-in', 'checkin', !checkedInThisWeek),
    dockBtn('sliders', 'Settings', 'settings', ctx.updateReady()),
  );

  const names = due.map((x) => GAMES.find((g) => g.id === x.id).name);
  const warn = due.length
    ? h('p', { class: 'hub-warn', role: 'status' }, icon('alert', 16),
        h('span', null, names.length === GAMES.length
          ? 'Welcome back. Every game is due a turn, so start with any of them.'
          : names.length === 1
          ? `${names[0]} hasn't been played in a week or more.`
          : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} haven't been played in a week or more.`))
    : null;
  const el = h('div', { class: 'screen hub' + (warn ? ' has-warn' : '') }, backdrop, top, warn, stage, infoEl, dock);
  root.append(el);

  // ---- behavior ----
  function measure() {
    step = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : 1;
    if (step <= 0) step = 1;
  }
  function scrollTo(i, behavior) {
    const idx = Math.max(0, Math.min(GAMES.length - 1, i));
    measure();
    const smooth = behavior || (store.settings().reduce ? 'auto' : 'smooth');
    track.scrollTo({ left: idx * step, behavior: smooth });
  }
  function weekStat(g) {
    const series = weeklySeries(sessions, g.id, now, 8);
    const cur = series[series.length - 1];
    const d = weekDelta(series);
    if (cur.n === 0) {
      const last = [...series].reverse().find((w) => w.n > 0);
      return last ? `Last played with a best of ${fmtNum(last.best)}` : 'Not played yet';
    }
    const arrow = d ? (d.pct >= 0 ? ' up ' : ' down ') + Math.abs(Math.round(d.pct)) + '% on last week' : '';
    return `This week: best ${fmtNum(cur.best)}${arrow}`;
  }
  function render() {
    const g = GAMES[focus];
    info.name.textContent = g.name;
    info.blurb.textContent = g.blurb;
    info.trains.textContent = 'Exercises: ' + g.trains.join(', ');
    info.stat.textContent = weekStat(g);
    info.play.replaceChildren(icon('play', 20), h('span', null, 'Play'));
    info.quick.replaceChildren(
      ...(g.quick || []).map((q) =>
        h(
          'button',
          {
            class: 'quick-chip',
            type: 'button',
            onclick: () => {
              store.setPref(g.id, q.pref, q.value);
              enter(focus);
            },
          },
          h('span', { 'aria-hidden': 'true' }, q.icon),
          q.label,
        ),
      ),
    );
    info.quick.classList.toggle('hidden', !g.quick);
    const late = due.find((x) => x.id === g.id);
    if (late) info.stat.textContent = dueText(late) + '. Give it a turn today.';
    info.play.style.setProperty('--a', g.accent);
    info.play.style.setProperty('--b', g.accent2);
    cards.forEach((c, i) => {
      c.classList.toggle('is-focus', i === focus);
      c.setAttribute('aria-selected', i === focus ? 'true' : 'false');
    });
    backdrop.querySelectorAll('.bd').forEach((b, i) => b.classList.toggle('on', i === focus));
    dots.querySelectorAll('.dot').forEach((d, i) => {
      d.classList.toggle('on', i === focus);
      d.style.setProperty('--a', GAMES[i].accent);
    });
    prev.classList.toggle('hidden', focus === 0);
    next.classList.toggle('hidden', focus === GAMES.length - 1);
  }
  function enter(i) {
    const g = GAMES[i];
    haptic(12);
    ctx.nav.go('game', { id: g.id });
  }
  function onScroll() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (step <= 1) measure();
      const i = Math.max(0, Math.min(GAMES.length - 1, Math.round(track.scrollLeft / step)));
      if (i !== focus) {
        focus = i;
        haptic(8);
        render();
      }
    });
  }
  function onKey(e) {
    if (e.key === 'ArrowRight') {
      scrollTo(focus + 1);
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      scrollTo(focus - 1);
      e.preventDefault();
    } else if (e.key === 'Enter' && document.activeElement === track) {
      enter(focus);
    }
  }
  function tickClock() {
    clock.textContent = new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }

  track.addEventListener('scroll', onScroll, { passive: true });
  track.addEventListener('keydown', onKey);
  tickClock();
  const clockTimer = setInterval(() => {
    if (!document.hidden) tickClock();
  }, 30000);
  render();
  requestAnimationFrame(() => {
    measure();
    scrollTo(focus, 'auto');
  });
  window.addEventListener('resize', measure);

  return {
    destroy() {
      clearInterval(clockTimer);
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
    },
  };
}

// helpers re-exported for the weekly interstitial
export { sessionsInWeek, weekStart };

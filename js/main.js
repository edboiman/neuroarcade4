// App shell: screen routing, game hosting, session recording, service worker registration.
import { store } from './store.js';
import { h, clear, modal, toast, icon, fmtNum } from './ui.js';
import { GAMES, byId } from './registry.js';
import { rotation, weekStart, weekComplete, shiftWeek, streak, GAME_IDS, MIN_SESSION_SEC, OVERDUE_DAYS, overdue } from './weekly.js';
import * as audio from './audio.js';
import { fpsFor, dprFor } from './loop.js';

const app = document.getElementById('app');
let current = null; // { destroy, pause?, onBack? }
let screen = 'hub';
let swReg = null;
let updateWaiting = false;
let gameRun = 0; // increments for each game mount so stale async work can be ignored

const ctxBase = {
  store,
  audio,
  nav: { go, back: () => history.back() },
  updateReady: () => updateWaiting,
  applyUpdate,
};

// ---------- routing ----------
function go(name, params) {
  history.pushState({ s: name, p: params || null }, '');
  render(name, params);
}

async function render(name, params) {
  if (current && current.destroy) {
    try {
      current.destroy();
    } catch {
      /* ignore */
    }
  }
  current = null;
  gameRun++;
  clear(app);
  screen = name;
  app.dataset.screen = name;
  applyBodyFlags();
  try {
    if (name === 'hub') {
      const m = await import('./hub.js');
      current = m.mountHub(app, ctxBase);
    } else if (name === 'stats') {
      const m = await import('./stats.js');
      current = m.mountStats(app, ctxBase);
    } else if (name === 'settings') {
      const m = await import('./settings.js');
      current = m.mountSettings(app, ctxBase);
    } else if (name === 'checkin') {
      const m = await import('./checkin.js');
      current = m.mountCheckin(app, ctxBase);
    } else if (name === 'game') {
      await enterGame(params && params.id);
    }
  } catch (err) {
    console.error(err);
    clear(app);
    app.append(
      h(
        'div',
        { class: 'screen fatal' },
        h('h1', null, 'Something went wrong'),
        h('p', null, 'This screen could not load. Go back and try again.'),
        h('button', { class: 'btn primary', type: 'button', onclick: () => history.back() }, 'Back'),
      ),
    );
  }
}

function applyBodyFlags() {
  const st = store.settings();
  document.documentElement.classList.toggle('reduce-motion', !!st.reduce);
  document.documentElement.classList.toggle('saver', !!st.saver);
}

window.addEventListener('popstate', (e) => {
  const st = e.state || { s: 'hub' };
  if (screen === 'game' && current && !current.exiting && current.onBack && current.onBack()) {
    // the game handled "back" itself (opened its pause menu); keep the user on the game
    history.pushState({ s: 'game', p: st.p || null }, '');
    return;
  }
  render(st.s || 'hub', st.p);
});

// ---------- game hosting ----------
async function enterGame(id) {
  const g = byId(id);
  if (!g) return render('hub');
  const run = gameRun;
  const host = h('div', { class: 'screen game', style: { '--a': g.accent, '--b': g.accent2, '--ar': g.rgb } });
  app.append(host);
  const loading = h('div', { class: 'game-loading' }, 'Loading ' + g.name + '…');
  host.append(loading);
  const mod = await g.load();
  if (run !== gameRun) return; // the user left while loading
  loading.remove();

  const t0 = performance.now();
  let hiddenAt = 0;
  let hiddenTotal = 0;
  const onVis = () => {
    if (document.hidden) {
      hiddenAt = performance.now();
      if (api && api.pause) api.pause();
    } else if (hiddenAt) {
      hiddenTotal += performance.now() - hiddenAt;
      hiddenAt = 0;
    }
  };
  document.addEventListener('visibilitychange', onVis);
  let finished = false;
  let api = null;

  const gameCtx = {
    ...ctxBase,
    game: g,
    settings: store.settings(),
    fps: () => fpsFor(store.settings()),
    dpr: () => dprFor(store.settings()),
    exit: () => {
      if (current) current.exiting = true;
      history.back();
    },
    finish(result) {
      if (finished) return;
      finished = true;
      const d = Math.min(3600, Math.max(0, (performance.now() - t0 - hiddenTotal) / 1000));
      showResults(g, result, d);
    },
  };
  api = mod.mount(host, gameCtx);
  current = {
    destroy() {
      document.removeEventListener('visibilitychange', onVis);
      if (api && api.destroy) api.destroy();
    },
    onBack: () => (api && api.onBack ? api.onBack() : false),
  };
}

function showResults(g, result, durationSec) {
  const prevBest = store.sessions().filter((x) => x.g === g.id).reduce((m, x) => Math.max(m, x.s), 0);
  const counts = !!result.completed || durationSec >= MIN_SESSION_SEC;
  if (current && current.destroy) {
    try {
      current.destroy();
    } catch {
      /* ignore */
    }
  }
  current = { destroy() {} };
  const score = Math.round(Math.max(0, result.score || 0));
  if (counts) {
    store.addSession({
      g: g.id,
      t: Date.now(),
      d: durationSec,
      s: score,
      l: result.level || 0,
      a: result.accuracy == null ? null : result.accuracy,
      c: !!result.completed,
    });
  }
  const rot = rotation(store.sessions(), Date.now());
  const newBest = counts && score > prevBest && prevBest > 0;
  clear(app);
  const stillDue = overdue(store.sessions(), Date.now()).map((x) => byId(x.id).name);
  const needNames = rot.remaining.map((id) => byId(id).name);
  const panel = h(
    'div',
    { class: 'screen results', style: { '--a': g.accent, '--b': g.accent2, '--ar': g.rgb } },
    h('div', { class: 'results-card' },
      h('p', { class: 'results-game' }, g.name),
      h('p', { class: 'results-score' }, fmtNum(score)),
      newBest ? h('p', { class: 'results-best' }, 'New personal best') : prevBest > 0 ? h('p', { class: 'results-prev' }, 'Personal best ' + fmtNum(Math.max(prevBest, score))) : h('p', { class: 'results-prev' }, 'First score on the board'),
      h('ul', { class: 'results-lines' },
        result.level ? h('li', null, 'Level reached: ' + result.level) : null,
        result.accuracy != null ? h('li', null, 'Accuracy: ' + Math.round(result.accuracy * 100) + '%') : null,
        (result.extra || []).map((t) => h('li', null, t)),
      ),
      !counts ? h('p', { class: 'results-note' }, `That run was too short to count toward your week. Sessions need to be completed or last at least ${MIN_SESSION_SEC} seconds.`) : null,
      counts
        ? h('p', { class: 'results-rot' },
            rot.complete
              ? 'Weekly rotation complete. Nice variety.'
              : `Weekly rotation: ${rot.playedCount} of ${GAME_IDS.length} played. Still to try: ${needNames.join(', ')}.`)
        : null,
      stillDue.length ? h('p', { class: 'results-note' }, `Not played in ${OVERDUE_DAYS}+ days: ${stillDue.join(', ')}.`) : null,
      h('div', { class: 'results-actions' },
        h('button', { class: 'btn', type: 'button', onclick: () => history.back() }, 'Back to games'),
        h('button', { class: 'btn primary', type: 'button', onclick: () => render('game', { id: g.id }) }, 'Play again'),
      ),
    ),
  );
  app.append(panel);
}

// ---------- service worker (offline) ----------
async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  try {
    swReg = await navigator.serviceWorker.register('sw.js');
    const watch = (reg) => {
      if (reg.waiting && navigator.serviceWorker.controller) updateWaiting = true;
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            updateWaiting = true;
            toast('An update is ready. Restart from Settings when you like.', 4000);
          }
        });
      });
    };
    watch(swReg);
  } catch (err) {
    console.warn('Offline support unavailable', err);
  }
}

function applyUpdate() {
  if (!swReg || !swReg.waiting) {
    location.reload();
    return;
  }
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return;
    reloaded = true;
    location.reload();
  });
  swReg.waiting.postMessage('SKIP_WAITING');
}

// ---------- week start / first run ----------
async function weeklyIntro() {
  const now = Date.now();
  const wk = weekStart(now);
  const d = store.data;
  if (d.seenWeek === wk) return;
  const sessions = store.sessions();
  const firstRun = !d.onboarded && sessions.length === 0;
  if (firstRun) {
    await modal({
      title: 'Welcome to Neuro Arcade',
      body: h('div', { class: 'intro' },
        h('p', null, 'Five short games, each exercising a different mental skill. Everything runs on this phone and works offline. Nothing is ever sent anywhere.'),
        h('p', null, `The weekly rotation: play each of the five games at least once every week. If a game goes ${OVERDUE_DAYS} days without a turn, the home screen will remind you. Varied practice is the point.`),
        h('p', { class: 'fine' }, 'Games are engaging mental exercise, not a medical treatment. Research on transfer to everyday thinking is mixed, so use the Check-in to see what changes for you.'),
      ),
      actions: [{ label: 'Start the first week', value: true, kind: 'primary' }],
      dismissible: false,
    });
  } else {
    const last = shiftWeek(wk, -1);
    const had = sessions.some((s) => s.t >= last && s.t < wk);
    const done = weekComplete(sessions, last);
    const st = streak(sessions, now);
    const lastPlayed = GAME_IDS.filter((g) => sessions.some((s) => s.g === g && s.t >= last && s.t < wk && (s.c || s.d >= MIN_SESSION_SEC))).length;
    await modal({
      title: 'A new week begins',
      body: h('div', { class: 'intro' },
        h('p', null, !had
          ? 'You did not play last week. This week, play all five games at least once.'
          : done
            ? `Last week you played all five games.${st > 0 ? ` That is a ${st}-week streak.` : ''}`
            : `Last week you played ${lastPlayed} of 5 games. Start this week with the ones you missed.`),
        h('p', null, 'Play each game at least once to complete the rotation.'),
      ),
      actions: [{ label: 'Start the week', value: true, kind: 'primary' }],
      dismissible: false,
    });
  }
  store.markSeenWeek(wk);
}

// ---------- boot ----------
async function boot() {
  applyBodyFlags();
  history.replaceState({ s: 'hub' }, '');
  await render('hub');
  weeklyIntro();
  registerSW();
  store.requestPersistence();
  store.onChange(applyBodyFlags);
}

boot();

// App shell: screen routing, game hosting, session recording, service worker registration.
import { store } from './store.js';
import { h, clear, modal, toast, icon, fmtNum } from './ui.js';
import { GAMES, byId } from './registry.js';
import { rotation, weekStart, weekComplete, shiftWeek, streak, GAME_IDS, MIN_SESSION_SEC, OVERDUE_DAYS, overdue } from './weekly.js';
import * as audio from './audio.js';
import { fpsFor, dprFor } from './loop.js';
import { goalProgress } from './session.js';
import { VERSION } from './version.js';

const app = document.getElementById('app');
let current = null; // { destroy, pause?, onBack? }
let screen = 'hub';
let currentParams = null;
let swReg = null;
let updateWaiting = false;
let activePlay = false;
let reloadingForUpdate = false;
let pendingActivatedVersion = null;
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
  if (name !== 'game' && pendingActivatedVersion && !reloadingForUpdate) { reloadingForUpdate = true; location.reload(); return; }
  const renderRun = ++gameRun;
  clear(app);
  screen = name;
  currentParams = params || null;
  app.dataset.screen = name;
  applyBodyFlags();
  try {
    if (name === 'hub') {
      const m = await import('./hub.js');
      if (renderRun !== gameRun) return;
      current = m.mountHub(app, ctxBase);
    } else if (name === 'stats') {
      const m = await import('./stats.js');
      if (renderRun !== gameRun) return;
      current = m.mountStats(app, ctxBase);
    } else if (name === 'settings') {
      const m = await import('./settings.js');
      if (renderRun !== gameRun) return;
      current = m.mountSettings(app, ctxBase);
    } else if (name === 'checkin') {
      const m = await import('./checkin.js');
      if (renderRun !== gameRun) return;
      current = m.mountCheckin(app, ctxBase);
    } else if (name === 'game') {
      await enterGame(params && params.id, params || {});
    }
  } catch (err) {
    if (renderRun !== gameRun) return;
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
  document.documentElement.classList.toggle('large-text', !!st.largeText);
}

window.addEventListener('popstate', (e) => {
  const st = e.state || { s: 'hub' };
  if (screen === 'game' && current && !current.exiting && current.onBack && current.onBack()) {
    // the game handled "back" itself (opened its pause menu); keep the user on the game
    history.pushState({ s: 'game', p: currentParams }, '');
    return;
  }
  render(st.s || 'hub', st.p);
});

// ---------- game hosting ----------
async function enterGame(id, params = {}) {
  if(params.resume){const raw=store.loadGame(id);if(raw&&Number.isInteger(raw.state?.seed))params.seed=raw.state.seed>>>0;}
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

  let activeMs = 0, activeAt = null;
  const playing = value => {
    activePlay = !!value;
    if (activeAt !== null) activeMs += performance.now() - activeAt;
    activeAt = value && !document.hidden ? performance.now() : null;
  };
  const onVis = () => { if (document.hidden) { playing(false); if (api && api.pause) api.pause(); } };
  document.addEventListener('visibilitychange', onVis);
  let finished = false;
  let api = null;

  const gameCtx = {
    ...ctxBase,
    game: g,
    resume: !!params.resume,
    mode: ['standard','daily','practice'].includes(params.mode) ? params.mode : 'standard',
    seed: Number.isInteger(params.seed) ? params.seed >>> 0 : undefined,
    practice: params.mode === 'practice',
    playing,
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
      playing(false);
      const d = Math.min(3600, Math.max(0, activeMs / 1000));
      const baseMode = ['standard','daily','practice'].includes(params.mode) ? params.mode : 'standard';
      const dailyKey = baseMode === 'daily' && Number.isInteger(params.seed) ? `daily_${params.seed >>> 0}` : baseMode;
      showResults(g, { ...result, mode: `${dailyKey}${result.variant ? '_' + result.variant : ''}` }, d);
    },
  };
  api = mod.mount(host, gameCtx);
  current = {
    destroy() {
      document.removeEventListener('visibilitychange', onVis);
      if (api && api.destroy) api.destroy();
      activePlay = false;
    },
    onBack: () => (api && api.onBack ? api.onBack() : false),
  };
}

function showResults(g, result, durationSec) {
  const prevBest = store.sessions().filter((x) => x.g === g.id && (x.mode || 'standard') === (result.mode || 'standard')).reduce((m, x) => Math.max(m, x.s), 0);
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
      mode: result.mode || 'standard',
    });
  }
  const rot = rotation(store.sessions(), Date.now());
  const goal = goalProgress(store);
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
      newBest ? h('p', { class: 'results-best' }, 'New personal best') : prevBest > 0 ? h('p', { class: 'results-prev' }, 'Best with these rules ' + fmtNum(Math.max(prevBest, score))) : h('p', { class: 'results-prev' }, 'First score on the board'),
      h('ul', { class: 'results-lines' },
        result.level ? h('li', null, 'Level reached: ' + result.level) : null,
        result.accuracy != null ? h('li', null, 'Accuracy: ' + Math.round(result.accuracy * 100) + '%') : null,
        (result.extra || []).map((t) => h('li', null, t)),
      ),
      !counts ? h('p', { class: 'results-note' }, `That run was too short to count toward your week. Sessions need to be completed or last at least ${MIN_SESSION_SEC} seconds.`) : null,
      counts ? h('p', { class: 'results-rot' }, goal.complete ? 'Your weekly goal is complete. Keep playing whenever you feel like it.' : `Your week: ${goal.count} of ${goal.goal} sessions. Any games you enjoy.`) : null,
      counts ? h('p', { class: 'results-note' }, 'Progress is saved on this device. Back up from Settings to take it with you.') : null,
      h('div', { class: 'results-actions' },
        h('button', { class: 'btn', type: 'button', onclick: () => history.back() }, 'Back to games'),
        h('button', { class: 'btn primary', type: 'button', onclick: () => render('game', { id: g.id }) }, 'Play again'),
      ),
    ),
  );
  app.append(panel);
}

// Older releases had no activation handler and could stay on the five-game shell.
// Acknowledge updates here so the worker does not navigate an active new-version run.
if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', event => {
  if (event.data?.type !== 'ARCADE_ACTIVATED') return;
  event.ports[0]?.postMessage({ version: VERSION, activePlay });
  if (event.data.version === VERSION) return;
  updateWaiting = true;
  pendingActivatedVersion = event.data.version;
  if (activePlay) { toast('Update downloaded. Your game is safe; restart from Settings when ready.', 4500); return; }
  if (reloadingForUpdate) return;
  reloadingForUpdate = true;
  if (current?.destroy) current.destroy();
  location.reload();
});

// ---------- service worker (offline) ----------
async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  try {
    swReg = await navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' });
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
    swReg.update().catch(() => {});
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
async function weeklyIntro() { store.markSeenWeek(weekStart(Date.now())); }

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

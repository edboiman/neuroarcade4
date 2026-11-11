// Offline cache. All files are stored at install time and served cache-first.
// This worker never contacts any server except to download this app's own files once per update,
// and it ignores every cross-origin request.
const VERSION = 'e3541c0c0e';
const PREFIX = 'neuro-arcade-';
const CACHE = PREFIX + VERSION;
const PRECACHE = [
  /*PRECACHE_START*/
  './',
  './css/base.css',
  './css/games.css',
  './css/hub.css',
  './css/screens.css',
  './css/theme.css',
  './fonts/poppins-400.woff',
  './fonts/poppins-500.woff',
  './fonts/poppins-700.woff',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './index.html',
  './js/art.js',
  './js/audio.js',
  './js/checkin.js',
  './js/games/blockfit-core.js',
  './js/games/blockfit.js',
  './js/games/cafe-core.js',
  './js/games/cafe-data.js',
  './js/games/cafe-lesson.js',
  './js/games/cafe.js',
  './js/games/common.js',
  './js/games/dungeon-art.js',
  './js/games/dungeon-core.js',
  './js/games/dungeon.js',
  './js/games/estate-chat.js',
  './js/games/estate-core.js',
  './js/games/estate.js',
  './js/games/lingo-art.js',
  './js/games/lingo-scenes.js',
  './js/games/rng.js',
  './js/games/survivor-art.js',
  './js/games/survivor-core.js',
  './js/games/survivor-input.js',
  './js/games/survivor-themes.js',
  './js/games/survivor.js',
  './js/hub.js',
  './js/loop.js',
  './js/main.js',
  './js/registry.js',
  './js/settings.js',
  './js/stats.js',
  './js/store.js',
  './js/ui.js',
  './js/weekly.js',
  './manifest.webmanifest'
  /*PRECACHE_END*/
];

const reqFor = (u) => new Request(u, { cache: 'reload' });

// Download any listed file that is not in the cache yet, one by one, so a single failure cannot
// leave the whole cache empty. Returns how many files are cached afterwards.
let filling = null;
function fillMissing() {
  if (!filling) {
    filling = (async () => {
      const cache = await caches.open(CACHE);
      let have = 0;
      for (const u of PRECACHE) {
        if (await cache.match(u)) {
          have++;
          continue;
        }
        try {
          await cache.add(reqFor(u));
          have++;
        } catch (e) {
          // offline or file missing on the server: try again next time
        }
      }
      return have;
    })().finally(() => {
      filling = null;
    });
  }
  return filling;
}

self.addEventListener('install', (event) => {
  // All-or-nothing: a new version only installs once every file is stored.
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE.map(reqFor))));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Only drop old versions once this one is complete, so there is always a working copy.
      if ((await fillMissing()) === PRECACHE.length) {
        for (const key of await caches.keys()) {
          if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
        }
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  // The page asks on every start. Firefox's "clear cache" can empty the stored files while keeping
  // this worker, so we refill anything missing and report how many of the files are ready offline.
  if (event.data === 'CHECK_OFFLINE') {
    const port = event.ports && event.ports[0];
    event.waitUntil(
      fillMissing().then((have) => {
        if (port) port.postMessage({ have, total: PRECACHE.length, version: VERSION });
      }),
    );
  }
});

async function fromAnyCache(req) {
  const own = await caches.open(CACHE);
  const hit = await own.match(req, { ignoreSearch: true });
  if (hit) return hit;
  return caches.match(req, { ignoreSearch: true }); // an older complete version, if still stored
}

async function shell() {
  const own = await caches.open(CACHE);
  return (
    (await own.match('./')) ||
    (await own.match('./index.html')) ||
    (await caches.match('./', { ignoreSearch: true })) ||
    (await caches.match('./index.html', { ignoreSearch: true }))
  );
}

const OFFLINE_PAGE =
  '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<title>Neuro Arcade</title><body style="background:#05060a;color:#eee;font:16px sans-serif;padding:24px">' +
  '<h1>Not saved for offline yet</h1><p>This phone has no stored copy of Neuro Arcade (the browser may have cleared it). ' +
  'Connect to the internet once and open the app; after that it works offline.</p>';

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const scope = new URL(self.registration.scope);
  if (!url.pathname.startsWith(scope.pathname.replace(/\/$/, ''))) return;

  event.respondWith(
    (async () => {
      if (req.mode === 'navigate') {
        // Every page load inside the app is the app itself, whatever the exact address.
        const page = await shell();
        if (page) {
          event.waitUntil(fillMissing());
          return page;
        }
        try {
          await fillMissing();
          const fresh = await shell();
          if (fresh) return fresh;
        } catch (e) {
          // fall through
        }
        return new Response(OFFLINE_PAGE, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }
      const hit = await fromAnyCache(req);
      if (hit) return hit;
      try {
        const cache = await caches.open(CACHE);
        await cache.add(reqFor(req.url));
        const fresh = await cache.match(req, { ignoreSearch: true });
        if (fresh) return fresh;
      } catch (e) {
        // offline and not cached
      }
      return new Response('Not available offline', { status: 404, headers: { 'Content-Type': 'text/plain' } });
    })(),
  );
});

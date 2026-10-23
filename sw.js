// Offline cache. All files are stored at install time and served cache-first.
// This worker never contacts any server except to download this app's own files once per update,
// and it ignores every cross-origin request.
const VERSION = 'a2262f93e6';
const PREFIX = 'neuro-arcade-';
const CACHE = PREFIX + VERSION;
const PRECACHE = [
  /*PRECACHE_START*/
  './',
  './assets/arcade-room.webp',
  './assets/cafe.webp',
  './assets/city.webp',
  './assets/dungeon.webp',
  './assets/forest.webp',
  './css/base.css',
  './css/games.css',
  './css/hub.css',
  './css/rooms.css',
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
  './js/catalog.js',
  './js/checkin.js',
  './js/checkpoint.js',
  './js/game-validation.js',
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
  './js/games/item-art.js',
  './js/games/lingo-art.js',
  './js/games/lingo-scenes.js',
  './js/games/rng.js',
  './js/games/rooms-core.js',
  './js/games/rooms.js',
  './js/games/survivor-art.js',
  './js/games/survivor-core.js',
  './js/games/survivor-input.js',
  './js/games/survivor-themes.js',
  './js/games/survivor.js',
  './js/hub.js',
  './js/loop.js',
  './js/main.js',
  './js/miniatures.js',
  './js/registry.js',
  './js/reviews.js',
  './js/session.js',
  './js/settings.js',
  './js/speech.js',
  './js/stats.js',
  './js/store.js',
  './js/ui.js',
  './js/weekly.js',
  './manifest.webmanifest',
  './js/version.js'
  /*PRECACHE_END*/
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE.map((u) => new Request(u, { cache: 'reload' })))),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === 'navigate') {
        const shell = (await cache.match('./')) || (await cache.match('index.html'));
        if (shell) return shell;
      }
      return new Response('Not available offline', { status: 404, headers: { 'Content-Type': 'text/plain' } });
    })(),
  );
});

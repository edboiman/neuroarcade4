# Neuro Arcade: notes for working on this project

Offline-first PWA of five brain games. Vanilla JavaScript ES modules, no dependencies, no build step beyond a
stamping script. Hosted on GitHub Pages at a subpath, installed to Android from Chrome.

## Commands (Node 20+)
- `node tools/build.mjs` stamps the content hash into `sw.js` and `js/version.js` and rewrites the offline file list. Run after any change.
- `node tools/audit.mjs` security rules: no network APIs, no innerHTML/eval, no external URLs, storage only in `js/store.js`, offline list complete.
- `node tools/test.mjs` engine and storage tests (node:test).
- Browser checks: Playwright (Python) with Chromium at `/opt/pw-browsers`; serve the folder with any static server.

## Architecture
- `index.html` -> `js/main.js` (router, results screen) -> `js/hub.js` (swipe home screen). Games are listed in `js/registry.js`
  and loaded lazily. Each game exports `mount(root, ctx)` returning `{ destroy, pause, onBack }`.
- Each game is split into a pure engine (`*-core.js`, no DOM, seeded RNG from `rng.js`, fully tested) and a UI file.
- Art is drawn in code and cached: `survivor-art.js` (canvas), `dungeon-art.js` (canvas), `lingo-art.js` (SVG), `art.js` (hub cards).
- DOM is built only with `h()` / `s()` from `js/ui.js` (text via textContent). Styles only via `el.style.setProperty`. The CSP forbids inline scripts and styles.
- Saved data: `js/store.js` only, sanitized on load. Unknown game ids are dropped. Language progress lives in skills `cafe_<lang>` (box per word id, shared by all scenarios).

## Lingo scenarios (game id `cafe`)
- Data-driven: words in `cafe-data.js` (one bank, three languages), scenarios in `lingo-scenes.js` (word lists, request patterns with English meanings, station names, phrases, look).
- Every request pattern takes its object with an indefinite article, so the stored forms (`one`, `pl`) work in all of them. Add a scenario by adding data; the engine never branches on scenario ids.
- The café keeps the progress key `shifts_<lang>`; other scenarios use `shifts_<lang>_<scene>`.

## Holiday Horde input invariants
- `survivor-input.js` owns pointer state. One listener set on the canvas; blur, visibility change, pause, level-up and run end call `releaseAll`.
- Manual mode: left half = movement stick, right half = hold to fire toward the finger (aim recomputed every step from the latest finger position).
- The UI advances the engine in fixed 1/60 s substeps; fire cooldown carries its remainder, so cadence does not depend on frame rate.
- Milestone rewards: every 5 levels (`MILESTONE_EVERY`), tracked in `milestonesHit` so each fires once; the engine does not step while a choice is pending.

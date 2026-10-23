# Neuro Arcade 2: project notes

Offline-first PWA, vanilla ES modules, static hosting including GitHub Pages subpaths. No runtime dependencies. Preserve old local progress and the existing CSP.

## Required checks

- `npm run check`: build stamp, source security audit, original and upgrade tests.
- `npm run build` after every runtime change. Commit both stamped files.
- Optional `tools/browser-smoke.cjs` uses Playwright and an external development-only Chromium installation.

## Architecture

- `js/catalog.js`: pure shared catalog. Game IDs flow into weekly rules and storage from here.
- `js/registry.js`: catalog plus lazy module loaders.
- `js/main.js`: guarded async routing, active play clock, session/result storage, PWA update flow.
- `js/hub.js`, `js/miniatures.js`, `css/hub.css`: arcade, filters, library, daily launch, room decoration.
- `js/session.js`: local daily seeds and configurable session goals.
- `js/checkpoint.js`: bounded versioned snapshots; serializes typed tiles, RNG states, and Sets.
- `js/game-validation.js`: original game snapshot validators; dungeon and new rooms have validators beside their engines.
- Each original game retains its pure rules/UI split. `rooms-core.js` and `rooms.js` implement the five new games.
- `js/reviews.js`: date-based language reviews. Vocabulary progress remains shared across scenarios.
- `js/speech.js`: installed local voices only; no remote speech fallback.
- `css/games.css`: layout foundations. `css/theme.css`: shared materials and original game world styling. `css/rooms.css`: new game layouts.

## Critical invariants

- Block Fit stays one mode; do not introduce Classic/Puzzle/Twist selectors without a new user request.
- Dungeon combat: windup marks a tile, next action resolves, then recovery. Moving into adjacency cannot deal an immediate untelegraphed hit. A block charges one two-damage counter. Invalid moves consume no turns. A revealed spike is spent.
- All game state assignments that start/pause/finish play must call `ctx.playing(true/false)`.
- Clear a checkpoint before recording a terminal result. Save stable action boundaries and pause/leave states.
- RNG helper exposes `getState()`; snapshots restore from that state without advancing it.
- Horde retains fixed simulation substeps and input release on blur/pause/upgrade.
- A daily challenge's seed, practice status, and relevant game difficulty belong in its score comparison key.
- Only `store.js` may access localStorage. All DOM is created with `h()` / `s()`; no dynamic HTML, eval, remote scripts, fonts, images, or APIs.
- `version.js` is outside the content hash but inside precaching. Keep audit/build agreement.
- Documentation and tools are excluded from runtime precaching. Do not add generated test screenshots to the app tree.

Installed updates: `sw.js` waits for a complete precache before activation. Legacy shells without an activation acknowledgement refresh once. Updated clients acknowledge the message and preserve active gameplay. Never await `WindowClient.navigate()` inside activation: navigation fetches wait for activation to complete. Worker behavior is included in the build hash after stripping generated version/list fields.

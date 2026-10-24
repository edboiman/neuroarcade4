# Neuro Arcade 2.3: project notes

Offline-first PWA, vanilla ES modules, static hosting including GitHub Pages subpaths. No runtime dependencies. Preserve old local progress and the existing CSP.

## Required checks

- `npm run check`: build stamp, source security audit, original and upgrade tests.
- `npm run build` after every runtime change. Commit both stamped files.
- Optional `tools/browser-smoke.cjs` uses Playwright and an external development-only Chromium installation.

## Architecture

- `js/catalog.js`: pure shared catalog. Game IDs flow into weekly rules and storage from here.
- `js/registry.js`: catalog plus lazy module loaders.
- `js/main.js`: guarded async routing, active play clock, session/result storage, PWA update flow.
- `js/hub.js`, `js/miniatures.js`, `css/hub.css`: Games/Progress navigation, category filters, direct launch and saved games.
- `js/session.js`: local daily seeds and configurable session goals.
- `js/checkpoint.js`: bounded versioned snapshots; serializes typed tiles, RNG states, and Sets.
- `js/game-validation.js`: game snapshot validators; new rooms have validators beside their engines.
- Each original game retains its pure rules/UI split. `rooms-core.js` and `rooms.js` implement the five new games.
- `css/games.css`: layout foundations. `css/theme.css`: shared materials and original game world styling. `css/rooms.css`: new game layouts.

- `js/games/marbleworks-core.js` / `marbleworks.js`: fixed-step circle/segment physics, authored challenges, editor, and free bench. Challenge medals also persist in numeric preferences.
- `js/games/conquest-core.js` / `conquest.js`: original connected territory map, fair dice/card/fortification rules, bounded animated AI turns. `aiStep(state, true)` can simulate all four banners in tests.
- `css/expansion.css`: new game and catalog styling. Horde sprite/floor WebP assets are precached and used in live gameplay.

## Critical invariants

- Block Fit stays one mode; do not introduce Classic/Puzzle/Twist selectors without a new user request.
- All game state assignments that start/pause/finish play must call `ctx.playing(true/false)`.
- Clear a checkpoint before recording a terminal result. Save stable action boundaries and pause/leave states.
- RNG helper exposes `getState()`; snapshots restore from that state without advancing it.
- Horde retains fixed simulation substeps and input release on blur/pause/upgrade.
- A daily challenge's seed, practice status, and relevant game difficulty belong in its score comparison key.
- Only `store.js` may access localStorage. All DOM is created with `h()` / `s()`; no dynamic HTML, eval, remote scripts, fonts, images, or APIs.
- `version.js` is outside the content hash but inside precaching. Keep audit/build agreement.
- Documentation and tools are excluded from runtime precaching. Do not add generated test screenshots to the app tree.

Installed updates: `sw.js` waits for a complete precache before activation. Legacy shells without an activation acknowledgement refresh once. Updated clients acknowledge the message and preserve active gameplay. Never await `WindowClient.navigate()` inside activation: navigation fetches wait for activation to complete. Worker behavior is included in the build hash after stripping generated version/list fields.

Deep Delve is retired. Its rules engine remains only in `tools/retired` for historical regression tests, outside the runtime and offline cache. Catalog IDs are playable games; STORED_GAME_IDS also includes retired IDs so existing history/checkpoints survive backup import and export. Keep retired IDs out of cards, progress rows, reminders, and routes. `docs/MEMORY_GAME_PLAN.md` now documents the implemented Curio Cabinet.

Curio Cabinet uses `curio-core.js`, `curio.js`, `curio-art.js`, and `css/curio.css`. Its phase machine is study → shutter → recall → reveal, with a short optional peek. All twelve cabinet slots remain visually identical when empty. Never render the answer in hidden DOM during recall/pause; the tray order must be independently shuffled. Medals live in numeric per-room preferences and survive fresh runs.

Horde UI always sets `run.manual=false`, including resumed checkpoints. The pure legacy manual engine remains for old rule regressions, but the UI does not depend on held shooting input. New navigation helpers in `survivor-input.js` commit world coordinates, keep targets on normal pointer release, reject extra pointers, and clear on cancellation/pause/blur/upgrades. Keep lost-pointer-capture after a normal pointer-up from cancelling a committed destination.

The build also excludes the four old Deep Delve runtime paths if an overlay upload leaves them in a repository. They cannot re-enter the precache or change the build stamp.

Lingo is retired. Pure historical language fixtures live in `tools/retired/lingo`; the app contains no language-game loader, card, category, progress row or speech code. Both cafe and dungeon IDs remain in STORED_GAME_IDS for backup compatibility. Cinderpath is now implemented; `docs/DECKBUILDER_PLAN.md` documents its rules.

Cinderpath uses `cinderpath-data.js` (30 cards, 12 relics, enemy intents), `cinderpath-core.js` (pure action engine and strict validator), `cinderpath-art.js`, `cinderpath.js`, and `css/cinderpath.css`. It passed pure and standalone browser checks before catalog registration. Used cards enter their next zone only after effects resolve, so a draw card cannot redraw itself while resolving. Every stable combat boundary conserves one instance of each owned card across draw/hand/discard/exhaust/powersZone. Enemy Ember resolves before any enemy acts; defeated enemies cannot attack. Shop stock, rewards, intentions, route and RNG are checkpointed. Terminal results clear checkpoints and record once. Keep the draw pile view sorted to hide its actual order.

Failed storage writes retain bounded in-memory checkpoints, return false, and keep a separate failure flag until that save succeeds. Successful main-record/settings writes must not clear a checkpoint failure. Backups include the volatile checkpoint. Never imply that a volatile save survives browser closure. Workshop generation must never begin solved, and stage three must terminate rather than advance to stage four. Horde projectile validation requires a bounded hit Set and finite nonnegative damage.

# 2.2: Curio Cabinet and reliable Horde touch controls

**Curio Cabinet is playable.** Three distinct cabinet frames, thirty detailed painted objects, eighteen authored layouts, five-round seeded collections, and a progression from four to ten objects. Study for ten seconds or choose unlimited study. Recall is untimed. Touch selection, keyboard navigation, and pointer drag/drop share the same placement rules. Peek marks a round as assisted. Whole-arrangement feedback, room animations, separate mode comparisons, saved recall phases, and persistent cabinet medals complete the game.

**Horde uses tap-to-move and independent auto-fire.** One tap commits a world destination; movement continues after the finger lifts and the camera follows. New taps redirect movement. Stop or Space cancels. Optional drag steering uses the whole arena. Old manual-aim checkpoints also migrate to automatic firing, so a second shooting finger is no longer required. Extra fingers, cancelled pointers, pause, backgrounding, and upgrade menus release input ownership correctly. Keyboard steering overrides any touch destination. Enemy contact does not stun either movement or firing.

Validation includes the full original/upgrade/expansion suites, 300 solved Curio collections, all live recall phases, real touch events during point-blank damage, saved manual-aim migration, pointer cancellation, multi-touch, upgrade recovery, a five-round browser collection with touch/keyboard/drag, all twelve game smoke paths, offline root/subpath operation, and installed updates without resetting history.

# 2.1.1: retire Deep Delve

Removed Deep Delve from the game catalog, launch routes, progress rows, reminders, and offline assets. Eleven playable games remain. Earlier scores and checkpoints are preserved in local history/backups. The pure rules engine is retained only as an excluded development fixture for existing regression tests. Catalog copy now derives the game count from the registry.

Added a design proposal for Curio Cabinet in `docs/MEMORY_GAME_PLAN.md`. The replacement is planned, not built or listed as playable.

# 2.1: build, conquer, survive

- **Marbleworks:** six authored, solvable physics challenges and a free-build bench. Place, drag, rotate, and remove wooden rails, spring bumpers, and air lifts. Release a marble, inspect its trail, collect stars, and catch it in the brass cup. Blueprint hints show a working track. Star medals persist across fresh runs and backups.
- **Bannerfall:** thirty original territories grouped into six continents, with a four-banner campaign. Deploy reinforcements, attack with up to three dice against two, blitz battles, advance after conquest, trade growing card sets, eliminate rivals and take their cards, and fortify through connected friendly land. Three AI opponents follow the same rules. Every action saves; the map supports keyboard selection and mobile horizontal scrolling.
- **Holiday Horde:** ten-minute runs, roughly twice the spawn pressure, repeating swarms and bosses, a new painted four-frame sprite atlas, forest floor texture, clearer experience crystals, damage numbers, lightning strikes, spinning axes, ember pools, and a live weapon HUD. Six simultaneous weapons and five chest-triggered evolutions. Max the weapon and matching passive shown on its upgrade card, then collect an elite/boss chest. Four-minute saved runs retain their timer and receive the new arsenal.
- **Navigation:** Games and Progress. Removed the duplicate landing and decoration tabs. Marbleworks, Horde, Bannerfall, Clockwork, and Echo are first in the collection. All twelve games remain available immediately.

Validation includes all original and upgrade regressions, real physics solutions, dice/territory/card/fortification rules, deterministic snapshots, 100 complete AI campaigns, evolution recipes, twelve-game mobile launch/save/resume, a real editor delivery, a full AI turn cycle, battle/advance dialogs, desktop layouts, offline root/subpath reopening, and cached upgrades from both the original five-game release and 2.0.1. Existing Deep Delve combat and the single Block Fit mode remain intact.

# 2.0.1: entry and installed-update fix

Reproduced an upgrade from the original installed five-game release. The old worker could remain active, serving the old carousel and blocking weekly welcome dialog while the replacement waited. A complete new release now activates automatically and refreshes legacy shells once. Newer clients preserve active play and finish updating after the game is saved and left. Cache names are scoped to the application path, so separate apps on the same host do not clear each other’s caches.

Removed the extra game-launch confirmation and the home-page check-in link. The initial view opens the game library, and navigation explicitly shows **All games (10)**. Existing per-game setup, language and difficulty controls remain available. Added a regression browser test for the actual legacy-to-current upgrade and progress preservation.

# Neuro Arcade 2.0 changes

## Presentation and navigation

Replaced the carousel with a responsive illustrated arcade and game library. Added category/session filters, an optional daily challenge, a customizable room, clearer buttons and type, distinct environment artwork, and a quieter shared interface. Bundled WebP environment artwork totals approximately 1.1 MB. Vocabulary pictures now use a consistent native SVG icon set instead of depending on emoji rendering.

## Games and progression

Added five playable games: Signal Junction, Clockwork Workshop, Casebook, Echo Garden, and Pocket Logistics. Added three Horde starting builds and telegraphed seasonal hazards. Improved Tycoon speed control, visible buildings, and financial context. Lingo now supports scheduled review dates, untimed requests, and optional installed offline speech. Block Fit retains its existing single mode.

## Deep Delve repair

Replaced immediate adjacency damage with explicit enemy windup, a marked target, attack resolution, and recovery. Added direct attack and defend buttons, double-damage counters after a block, sidestep dodging, health indicators, keyboard and directional touch controls, a safe interactive combat lesson, chambers, landmarks, and a limited scout action. Fixed repeated damage from revealed traps, fatal-trap turn resolution, and the map preview losing time during pause.

## Reliability and privacy

Added versioned, bounded snapshots for all ten games, including RNG position, typed tile arrays, and projectile hit sets. Saves are validated before restoration. Backup exports now include run checkpoints; progress-only backups are still accepted. Added active-play timing so pause menus do not inflate session goals, equivalent-rule score comparisons, a configurable weekly goal, and larger text/reduced motion support.

Fixed a pre-existing offline defect: Settings imported `js/version.js`, but the build omitted that file from the cache. The build now includes it without making the version hash circular. Centralized game identifiers in one catalog and guarded stale asynchronous route loads.

## Validation

The package includes the original 54 tests and an additional upgrade regression suite covering combat, snapshots, malformed data, scheduled reviews, the five new engines, daily seeds, and seasonal hazards. Browser smoke testing covers every game's launch/input/pause/save/resume flow, Settings, Progress, and offline reopening. Generated maps were checked for connectivity and solvability; delivery-map route checks cover 300 seeds.

## Practical limits

Casebook contains five authored mysteries. The room is a decorated diorama, not a freely walkable 3D simulation. Existing game renderers remain lightweight Canvas/SVG. Optional speech needs a suitable local voice on the device. Real-time checkpoints are periodic rather than a guarantee against the final few seconds of process termination.

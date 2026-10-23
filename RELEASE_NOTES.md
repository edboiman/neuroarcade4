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

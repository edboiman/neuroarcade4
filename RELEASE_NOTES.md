# 2.6: Held blocks, a real cup landing and world cities

Fixed Block Fit’s direct manipulation: grab the active shape, hold it while aiming, drag sideways/down through legal cells and release to resume gravity/locking. The session clock continues. Tap rotation, empty-board steering/flicks, keyboard controls and the reserve Hold button remain. Extra pointers cannot steal input; cancellation, lost capture, pause, blur and resize release it safely. Input is transient and does not enter saves.

Replaced Marbleworks’ rectangular target detection with a swept downward crossing through the opening, accounting for marble radius. Metal rim, walls and base now collide; side/bottom impacts and below-rim proximity do not award delivery. Removed the old near-cup rail-collision exemption. Corrected the authored end tracks in challenges 3/4 and the final rail hint in challenge 6, then checked all six three-star deliveries at 15/30/60/120 fps. Existing medals/tracks remain.

Tycoon Row now uses twenty-two real-world city deeds in eight country groups. The 3D board is built from projected geometry with top/front/side faces, an original miniature skyline, developed properties and standing pawns. Added zoom and an accessible city/space inspector. A separate console keeps dice, money, chat and purchase controls readable. Tile IDs, economic values, AI/rent/build/auction rules and old save state are preserved. The city names are geographic themes, not live property valuations.

Validation: 168 tests; 36 full paired Tycoon campaigns reproduce the original economic outcomes; real browser touch grabs, cancellation/extra fingers, blur/resize, keyboard/reserve Hold, actual marble delivery, 320px/desktop city layouts, label fit, purchase and legacy hotel development; ten-game smoke, offline root/subpath and installed upgrade paths.

# 2.5: A richer atelier, cabinet and atlas

Marbleworks keeps its physics and six authored challenges. The playable bench now has wood grain, inset rulers, brass fasteners, layered rails, mechanical spring bumpers, animated air-lift turbines/currents, a rolling glass highlight, collection particles and a delivery finish. Its cached scenery keeps decorative work out of the per-frame background path; reduced motion disables ambient effects while physics continues.

Curio Cabinet keeps its objects, arrangements and recall rules. Its rooms now have architectural scenery: bookcases/leaded windows/pendulum in the study, greenhouse ribs/light/foliage in the glasshouse, and a dome/constellations/orrery in the observatory. Cabinet joinery, arched niches, shelf shadows, hinged shutters and placement feedback add depth. Scenery is independent of answers; pausing still hides them.

Bannerfall has an etched atlas with irregular shared province boundaries, flags, terrain motifs, legal-target outlines, dice pips, card faces, phase steps, a territory finder and whole-map controls. Rule corrections add a finite territory/Wild deck, chosen card sets and owned-territory bonuses, mandatory trades after elimination, deployment before attacks resume, selectable attack dice, a defense preference, and selectable extra capture movement. Fresh games use thirty initial troops per banner. Legacy campaigns keep their old deployment, hand identities and RNG. The in-game rules and docs explain deliberate differences from Risk.

Removed Casebook and Pocket Logistics from the collection and reminders, preserving their historical data and checkpoints in backups. Ten active games remain. Cinderpath’s expanded release and all other games are retained.

Validation: 155 engine/data/security/reliability tests; finite-card conservation across 100 additional full AI campaigns; touch-built marble delivery; three room layouts at 320px/desktop; actual trade, capture, deploy, advance and fortify controls; exact reloads; reduced motion; the wider arcade’s touch/save/offline/update checks.

# 2.4: Cinderpath — The deeper climb

Expanded the solo game after comparing the prior build with Mega Crit’s official descriptions of Slay the Spire 2. Three original heroes with distinct starters/resources and card pools; 76 playable cards plus six special definitions; 32 relics; eight potions with a saved belt; five independent card enchantments; two battle-only afflictions, temporary statuses and permanent curses. Added X costs, Retain, Ethereal, Innate, Scry, recovery and generated cards.

New expeditions use three twelve-stop acts with real seeded path connections, unknown rooms, treasure/relic choices, ten event types and act-entry Waykeeper bargains. Six possible environments and guardians, 17 enemy definitions, Armor/Thorns, summons and awakening phases add encounter variety. Added two painted heroes and six painted enemies/bosses, native card glyphs, modified-cost displays, resource bars and a glossary.

A local chronicle tracks thirty terminal runs, final decks/relics, discoveries, story fragments and six challenge settings per hero. All heroes/pools are open immediately. Optional seed entry supports replay. Existing 2.3 checkpoints retain their original routes and current decision through a strict migration. Backup/import/reset include the chronicle. The wider arcade still has twelve games.

Validation covers 143 tests, 180 legal-policy expeditions, exact old/new snapshot boundaries, three full touch/keyboard browser victories, focused choice/potion/status/corrupt-save/quota checks, twelve-game smoke paths, offline root/subpath combat and installed updates. Policy win rates are not human-player predictions. Online co-op and commercial content-scale parity are outside this offline release.

# 2.3: Cinderpath is playable

Added the complete original Lanternbearer expedition to the arcade after standalone engine and browser checks passed. Thirty upgradeable cards, twelve relics, eighteen route stages across three areas, three guardians, visible enemy intentions, Ember/Bastion/Momentum combinations, shops, campfires, events and card removal. Original painted battle characters, unique card glyphs, area-specific native architecture, readable scrolling phone hands, keyboard targeting, reduced-motion effects, inspectable card zones and exact decision saves.

Fixed three review findings: failed checkpoint writes now retain an exportable in-memory run with a visible warning; malformed Horde projectiles cannot pass checkpoint validation; Workshop generation cannot start solved or advance past its final machine. Existing scores, retired-game history and checkpoints remain compatible. Twelve playable games are available.

Validation: 127 tests pass, including 150 complete legal Cinderpath expeditions across three development policies. Standalone and integrated browser tests complete all three areas via touch and keyboard, reload all six decision phases without rerolls, verify exactly one result and checkpoint cleanup, and check two-enemy targeting, defeat, invalid saves and quota recovery. All twelve game smoke paths, offline root/subpath Cinderpath combat, installed upgrades from 2.2.1, and Horde/Curio touch regressions pass. No browser errors or failed asset requests were recorded in the completed checks.

# 2.2.1: retire Lingo and plan a deck-builder

Removed Lingo from the catalog, loader, progress rows, reminders, and offline assets. Removed the empty Learn category and local speech feature. Existing language vocabulary, reviews, sessions, preferences, and checkpoint remain compatible with backup import/export. Pure language regression fixtures are retained under tools only.

Added a proposed original roguelike deck-builder, Cinderpath, in `docs/DECKBUILDER_PLAN.md`. It is a design proposal, not a playable replacement yet. Eleven active games remain.

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

# Neuro Arcade 2.6

Ten playable games in a responsive, installable, offline-first arcade. No account, ads, trackers, production dependencies, or remote services.

## Upload to GitHub

1. Extract this ZIP on your computer.
2. Open the main page of your existing repository. Choose **Add file → Upload files**.
3. First upload the **`tools` and `docs` folders** together, then **Commit changes**.
4. Repeat **Add file → Upload files** and upload **all remaining visible folders/files** together. Commit again. Each batch is under 100 files. Keep folders intact and `index.html` in the repository root.
5. Keep an existing `.nojekyll` beside `index.html`. If it is missing and hidden-file dragging is refused, use **Add file → Create new file**: filename `.nojekyll`, editor content `Static site`, then commit. `.github` (automated checks) and `.gitignore` are optional for hosting.
6. Under **Settings → Pages**, deploy from `main` and `/ (root)`. Wait for the final deployment to finish.
7. Open your Pages address. On Android, use **Install app / Add to Home screen**.
8. Allow the first installation to finish. Settings will show **Ready to play offline**. Test by closing the app, switching to airplane mode, and reopening it.

If replacing the previous version, keep the same Pages address so your browser retains its progress. Export a backup from Settings before replacing files. This release repairs upgrades from the original five-game installation. After uploading all files, reopen the installed app while online; it installs the complete update and refreshes the older screen. Check for **Games (10)**. An update received during active play completes after you save and leave the game. Your saved progress is retained.

## The games

| Game | Play |
| --- | --- |
| Cinderpath | Expanded solo deck-builder: three heroes, 76 playable cards, 32 relics, eight potions, five enchantments, card afflictions/statuses, 36-stop connected routes, six possible environments/guardians, Waykeeper pacts, six challenge settings, seeds, history, collection and lore. |
| Curio Cabinet | Restore five remembered arrangements in a clockmaker’s study, glasshouse, or observatory. Thirty painted objects, eighteen layouts, richer room architecture, animated shutters/ambient mechanisms, optional unlimited study, untimed recall, Peek, touch/keyboard/drag controls, persistent room medals. |
| Marbleworks | Six physics challenges and a free-build bench, with a textured atelier, brass-and-wood mechanisms, spinning air lifts, animated glass marbles, star bursts and persistent medals. The marble must cross the opening from above; the rim and cup sides are solid, and all six corrected blueprints earn three stars. |
| Bannerfall | Original thirty-territory atlas, six continent bonuses, four banners, chosen attack/defense dice, territory cards/Wild banners, immediate elimination trades, variable advances, connected fortification, and three AI rivals. |
| Block Fit | Grab the active shape to hold and drag it sideways/down; release to resume gravity. Tap to rotate, use empty-board swipes or the buttons/keyboard, and keep the existing single mode. |
| Holiday Horde | Tap a destination to walk there while weapons aim and fire automatically. Stop/Space cancels movement; optional drag steering is available in Setup/Pause. Ten-minute survivor-style action with animated painted characters, a textured arena, six automatic weapons, five chest-triggered evolutions, three starting builds, bosses, companions, and telegraphed seasonal hazards. Older checkpoints keep their original four-minute timer. |
| Tycoon Row | A projected 3D world-city board with twenty-two city deeds in eight country sets, raised buildings and pawns, zoom, city inspection, three rivals, auctions, development and resumable games. |
| Signal Junction | Route twelve trains to numbered/color-matched stations. Use hold settings to stagger trains and avoid collisions. |
| Clockwork Workshop | Rotate conduits to restore three circuits. Connected power is visible; blueprint hints trade score for help. |
| Echo Garden | Replay growing numbered lantern sequences, using sound, visuals, or keyboard 1–4. |

## Your arcade

- The arcade opens directly to **Games**. Browse ten games, filter by category, or continue a saved game. **Progress** is the second tab; Settings is beside it.
- Choose a comfortable weekly session goal from 1 to 7. You can play any games; no weekly gate interrupts you.
- Settings includes larger text, reduced motion, sound, vibration, battery saver, and backup import/export.

All games save active runs locally. Real-time games checkpoint periodically and when paused or left; turn-based games save at action boundaries. A sudden browser/process termination can lose the last few seconds of a real-time game. Backups include current run checkpoints, settings, scores, and language reviews. Old progress-only backups remain importable.

## Develop and verify

Requires Node 20 or later. The app itself has no package dependencies.

```sh
npm run check
```

This stamps the service worker, checks the offline file list and security rules, and runs all 168 original, upgrade, expansion, Cinderpath and reliability tests.

The expansion suite solves all six marble challenges with the actual physics engine, checks territory and card rules, simulates 100 complete AI campaigns, and checks Horde evolution recipes and older saves.

After changing application files, run `npm run build` and commit the resulting `sw.js` and `js/version.js`. The version module is intentionally excluded from the version hash, but included in the offline cache.

An optional Playwright smoke test is included in `tools/browser-smoke.cjs`. Install Playwright in a development environment, then run it with a supported Chromium executable. It checks all ten game launch/save/resume paths, mobile settings and Progress, offline reload, and GitHub Pages-style subpath hosting. No browser/test dependencies are included in the shipped app.

See `RELEASE_NOTES.md`, `CLAUDE.md`, `SECURITY.md`, and `ASSET_NOTES.md` for implementation details.

Upgrade regression test: set `LEGACY_APP_DIR` to an extracted original release, then run `node tools/browser-upgrade.cjs` with Playwright and Chromium installed. It reproduces the old five-game weekly gate, installs this release, verifies all ten games and preserved scores, and checks that a later update preserves active play and checkpoints.

For the focused visual/action check, run `node tools/browser-expansion.cjs` with Playwright and Chromium. This checks evolved Horde builds, conquest battle/advance controls, and mobile/desktop layouts. To test upgrading from 2.0.1, set `LEGACY_IS_V2=1` and point `LEGACY_APP_DIR` at that extracted release.

Deep Delve has been retired from the arcade and reminders. Its previous scores and checkpoint remain in local backups. Curio Cabinet is its playable replacement; the implemented design is documented in `docs/MEMORY_GAME_PLAN.md`.


## Final touch and recall regressions

`tools/browser-final.cjs` drives real Chromium touch events against saved manual-aim Horde runs. It checks single-tap movement after lifting a finger, enemy contact while firing, immediate redirection, extra fingers, cancellation, pause, and upgrade recovery. It also completes all five Curio rounds through actual touch, keyboard, and drag controls; checks that recall, pause, and resumed peeks do not reveal hidden answers; and verifies results and medals. Set `BROWSER_EXECUTABLE` and optionally `QA_OUTPUT_DIR` when running it with development-only Playwright.

Use `LEGACY_IS_V2=1 LEGACY_GAME_COUNT=11 LEGACY_APP_DIR=<extracted-2.1.1>` with `tools/browser-upgrade.cjs` to verify installation over the previous release. Existing manual-aim checkpoints migrate to auto-fire; existing progress and Deep Delve backup history remain available.

Lingo is retired in 2.2.1. Its saved vocabulary, review dates, sessions and checkpoint remain in local backups. Cinderpath is its playable replacement; the implementation and rules are described in `docs/DECKBUILDER_PLAN.md`.

## Cinderpath 2.4 checks

`tools/test-cinderpath.mjs` exercises the expanded rules, every playable card/upgrade, potions, enchantments, enemy patterns, resource costs, card conservation, generated cards, afflictions, status/curse cards, relics, shops/events, pending choices, malformed saves and exact old-save migration. It runs 180 complete legal-policy expeditions across three heroes at standard/highest challenge. Policy results are development checks, not player win-rate predictions.

`tools/browser-cinderpath.cjs` completes a three-act expedition with each hero using the actual touch/keyboard UI. It reloads all decision phases without changing the decision and verifies one recorded result, challenge unlocks, history, collection and lore. `tools/browser-cinderpath-edge.cjs` covers Scry/recovery, three-enemy potion targeting, replacement, affliction costs, defeat, a real 2.3 checkpoint, corrupt saves and storage-quota recovery. Set `BROWSER_EXECUTABLE` when running with development-only Playwright.

See `docs/CINDERPATH_COMPARISON.md` for the official-source comparison with Slay the Spire 2 and `docs/DECKBUILDER_PLAN.md` for Cinderpath’s actual rules. This remains an original offline solo adaptation; online co-op is outside this release. New runs use the expanded routes. Existing 2.3 runs retain their original route/current decision.

If device storage becomes unavailable, the app warns you and holds failed checkpoint writes in memory. You can continue in the same browser session and export a backup. Download that backup before closing the browser; memory cannot survive closing it.

For GitHub’s website upload limit, extract this ZIP. From your existing repository’s root, choose **Add file → Upload files** and upload the `tools` and `docs` folders first. Commit them. Then upload all remaining visible folders/files together and commit again; the complete playable app is in this second batch, under 100 files. Preserve folder names and keep `index.html` in the repository root. Keep an existing `.nojekyll`. If it is missing and hidden-file dragging is refused, choose **Add file → Create new file**, enter `.nojekyll` in the filename box, type `Static site` in the editor and commit. `.github` and `.gitignore` are optional for hosting this arcade. Wait for the final Pages deployment before reopening the installed app online.

## Visual and rules update

Casebook and Pocket Logistics are retired in 2.5. They cannot launch or appear in reminders. Their old scores and checkpoints remain in backups. The arcade contains ten games; Cinderpath’s 2.4 expansion is retained.

`tools/test-polish.mjs` covers Bannerfall’s finite cards, Wild sets, territory bonuses, mandatory elimination trades, chosen dice, old saves and retirement data. `tools/browser-polish.cjs` checks a touch-built three-star marble delivery, live/reduced-motion behavior, three Curio room scenes at desktop/320px, answer hiding, capture/trade/deploy/reload/advance/fortify controls and the new atlas layouts. See `docs/BANNERFALL_RULES_REVIEW.md` for the rule audit and intentional differences from Risk.

For upgrading from 2.4, run `LEGACY_IS_V2=1 LEGACY_GAME_COUNT=12 LEGACY_APP_DIR=<extracted-2.4>` with `tools/browser-upgrade.cjs`.

## Controls, cup collision and cities update

Block Fit’s active shape can now be held under a finger or mouse pointer while being positioned. Direct dragging suspends gravity and locking, while the three-minute session clock continues. It moves safely through open cells, never lifts a piece back up, and resumes gravity when released. Direct grabs follow the pointer even during Mirror; off-piece swipes/buttons keep the mirrored rule. Pointer ownership, cancellation, pause, window blur and resizing clear held input.

Marbleworks now awards delivery only for a downward crossing through the visible cup opening with enough clearance for the entire marble. Rim/side/bottom contact alone cannot win. The cup has solid metal sides, and rails retain their collisions beside it. The final fixed tracks in challenges 3/4 and the final suggested rail in challenge 6 were corrected for genuine delivery. Old earned medals and user-built tracks remain saved.

Tycoon Row’s twenty-two property names now represent real cities in Portugal, Spain, Italy, France, Germany, Japan, Australia and the United States. Transport hubs and utilities carry city themes. Prices/rents are fictional game values and retain the original balance. All forty tile IDs, group membership, ownership, developments, cash, dice and saved auctions remain compatible. Native SVG projects actual top/side faces, raised buildings, a miniature skyline and standing pawns; the readable controls remain beside/below the board. Zoom and the city selector support narrow phones.

`tools/test-controls-cities.mjs` covers the input lifecycle, held-piece clock, cup crossings/collisions, all six authored deliveries at four frame rates, exact legacy city-save compatibility and 36 paired complete AI campaigns against the original rules. `tools/browser-controls-cities.cjs` drives real touch grabs, multi-touch, cancel/resize/blur, keyboard/Hold, an actual marble delivery, forty board spaces, city-label fit, zoom, phone layout, purchase and old-save hotel development. Set `BROWSER_EXECUTABLE` for development-only Playwright.

For upgrading from 2.5, use `LEGACY_IS_V2=1 LEGACY_GAME_COUNT=10 LEGACY_APP_DIR=<extracted-2.5>` with `tools/browser-upgrade.cjs`.

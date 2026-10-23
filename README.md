# Neuro Arcade 2.1

Twelve playable games in a responsive, installable, offline-first arcade. No account, ads, trackers, production dependencies, or remote services.

## Upload to GitHub

1. Extract this ZIP.
2. Upload **all of its contents** to your repository root, preserving `assets`, `css`, `fonts`, `icons`, `js`, `tools`, and `.github`. Do not upload only `index.html`.
3. In GitHub, open **Settings → Pages**. Deploy from your `main` branch and `/ (root)`.
4. Open your Pages address. On Android, use the browser's **Install app / Add to Home screen** option.
5. Allow the initial installation to complete. Settings will show **Ready to play offline**. Test by closing the app, switching to airplane mode, and reopening it.

If replacing the previous version, keep the same Pages address so your browser retains its progress. Export a backup from Settings before replacing files. This release repairs upgrades from the original five-game installation. After uploading all files, reopen the installed app while online; it installs the complete update and refreshes the older screen. Check for **Games (12)**. An update received during active play completes after you save and leave the game. Your saved progress is retained.

## The games

| Game | Play |
| --- | --- |
| Marbleworks | Six real-physics marble runs, editable wooden rails, spring bumpers, air lifts, blueprint hints, persistent star medals, and a free-build bench. |
| Bannerfall | Original thirty-territory conquest map, six continent bonuses, four banners, dice battles, growing card trades, connected fortification, and three AI rivals. |
| Block Fit | The existing single falling-block game, with refined controls and presentation. No Classic/Puzzle/Twist mode split was added. |
| Lingo | Six locations in Spanish, French, or German; vocabulary lessons, request practice, date-based review scheduling, and an untimed pace. |
| Holiday Horde | Ten-minute survivor-style action with animated painted characters, a textured arena, six automatic weapons, five chest-triggered evolutions, three starting builds, bosses, companions, and telegraphed seasonal hazards. Older checkpoints keep their original four-minute timer. |
| Tycoon Row | Property strategy with three rivals, visible development, financial context, speed control, and resumable games. |
| Deep Delve | Memorize chambers and landmarks, navigate by torchlight, and fight using telegraphed attacks, defense, dodges, and counters. Includes a safe playable combat lesson. |
| Signal Junction | Route twelve trains to numbered/color-matched stations. Use hold settings to stagger trains and avoid collisions. |
| Clockwork Workshop | Rotate conduits to restore three circuits. Connected power is visible; blueprint hints trade score for help. |
| Casebook | Five illustrated mysteries with inspectable evidence, a persistent notebook, and explanations. |
| Echo Garden | Replay growing numbered lantern sequences, using sound, visuals, or keyboard 1–4. |
| Pocket Logistics | Load two parcels at a time, preview routes around roadworks, and deliver five packages within your fuel budget. |

## Your arcade

- The arcade opens directly to **Games**. Browse twelve games, filter by category, or continue a saved game. **Progress** is the second tab; Settings is beside it.
- Choose a comfortable weekly session goal from 1 to 7. You can play any games; no weekly gate interrupts you.
- Settings includes larger text, reduced motion, sound, vibration, battery saver, and backup import/export.

All games save active runs locally. Real-time games checkpoint periodically and when paused or left; turn-based games save at action boundaries. A sudden browser/process termination can lose the last few seconds of a real-time game. Backups include current run checkpoints, settings, scores, and language reviews. Old progress-only backups remain importable.

Lingo's optional Listen button uses **only an installed local system voice**. If none is available in the selected language, the app displays a text fallback. It does not download voices or use a cloud speech service. The compact conversation exercise focuses on understanding requests; it is not a full conversational language course.

## Deep Delve controls and combat

- Tap an explored tile to walk; automatic walking stops when danger appears.
- Tap an adjacent enemy, use **Attack**, or press **F** to strike.
- An amber marker shows where an enemy will attack on its next action.
- Use **Defend / G** to block a marked attack and charge a two-damage counter, or move out of the marked tile to dodge.
- **Wait / Space** advances a turn. Arrow keys / WASD or on-screen arrows move.
- Enemies recover after attacking. Walls and invalid attacks do not consume turns.
- Each floor provides one Scout. Revealed spikes are spent and do not repeatedly damage you.
- Practice removes the map-study countdown. The combat lesson is available before entering and from Pause.

## Develop and verify

Requires Node 20 or later. The app itself has no package dependencies.

```sh
npm run check
```

This stamps the service worker, checks the offline file list and security rules, and runs the original and upgrade regression suites.

The expansion suite solves all six marble challenges with the actual physics engine, checks territory and card rules, simulates 100 complete AI campaigns, and checks Horde evolution recipes and older saves.

After changing application files, run `npm run build` and commit the resulting `sw.js` and `js/version.js`. The version module is intentionally excluded from the version hash, but included in the offline cache.

An optional Playwright smoke test is included in `tools/browser-smoke.cjs`. Install Playwright in a development environment, then run it with a supported Chromium executable. It checks all twelve game launch/save/resume paths, mobile settings and Progress, offline reload, and GitHub Pages-style subpath hosting. No browser/test dependencies are included in the shipped app.

See `RELEASE_NOTES.md`, `CLAUDE.md`, `SECURITY.md`, and `ASSET_NOTES.md` for implementation details.

Upgrade regression test: set `LEGACY_APP_DIR` to an extracted original release, then run `node tools/browser-upgrade.cjs` with Playwright and Chromium installed. It reproduces the old five-game weekly gate, installs this release, verifies all twelve games and preserved scores, and checks that a later update preserves active play and checkpoints.

For the focused visual/action check, run `node tools/browser-expansion.cjs` with Playwright and Chromium. This checks evolved Horde builds, conquest battle/advance controls, and mobile/desktop layouts. To test upgrading from 2.0.1, set `LEGACY_IS_V2=1` and point `LEGACY_APP_DIR` at that extracted release.

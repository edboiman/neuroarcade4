# Neuro Arcade 2

Ten playable games in a responsive, installable, offline-first arcade. No account, ads, trackers, production dependencies, or remote services.

## Upload to GitHub

1. Extract this ZIP.
2. Upload **all of its contents** to your repository root, preserving `assets`, `css`, `fonts`, `icons`, `js`, `tools`, and `.github`. Do not upload only `index.html`.
3. In GitHub, open **Settings → Pages**. Deploy from your `main` branch and `/ (root)`.
4. Open your Pages address. On Android, use the browser's **Install app / Add to Home screen** option.
5. Allow the initial installation to complete. Settings will show **Ready to play offline**. Test by closing the app, switching to airplane mode, and reopening it.

If replacing the previous version, keep the same Pages address so your browser retains its progress. Export a backup from Settings before replacing files. When an installed app reports an update, restart it from Settings. Do not erase your browser data to update.

## The games

| Game | Play |
| --- | --- |
| Block Fit | The existing single falling-block game, with refined controls and presentation. No Classic/Puzzle/Twist mode split was added. |
| Lingo | Six locations in Spanish, French, or German; vocabulary lessons, request practice, date-based review scheduling, and an untimed pace. |
| Holiday Horde | Four-minute survival, three starting builds, upgrade combinations, companions, bosses, and seasonal hazards that warn before they strike. |
| Tycoon Row | Property strategy with three rivals, visible development, financial context, speed control, and resumable games. |
| Deep Delve | Memorize chambers and landmarks, navigate by torchlight, and fight using telegraphed attacks, defense, dodges, and counters. Includes a safe playable combat lesson. |
| Signal Junction | Route twelve trains to numbered/color-matched stations. Use hold settings to stagger trains and avoid collisions. |
| Clockwork Workshop | Rotate conduits to restore three circuits. Connected power is visible; blueprint hints trade score for help. |
| Casebook | Five illustrated mysteries with inspectable evidence, a persistent notebook, and explanations. |
| Echo Garden | Replay growing numbered lantern sequences, using sound, visuals, or keyboard 1–4. |
| Pocket Logistics | Load two parcels at a time, preview routes around roadworks, and deliver five packages within your fuel budget. |

## Your arcade

- Browse all games, filter by category or session length, or continue a saved game.
- Choose a comfortable weekly session goal from 1 to 7. You can play any games; no weekly gate interrupts you.
- Try a locally seeded daily challenge. Comparisons distinguish daily seeds, practice, and relevant difficulty settings.
- Unlock room decorations at 3, 8, 15, and 30 counted sessions. All games remain available from the start.
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

After changing application files, run `npm run build` and commit the resulting `sw.js` and `js/version.js`. The version module is intentionally excluded from the version hash, but included in the offline cache.

An optional Playwright smoke test is included in `tools/browser-smoke.cjs`. Install Playwright in a development environment, then run it with a supported Chromium executable. It checks all ten game launch/save/resume paths, mobile settings and Progress, offline reload, and GitHub Pages-style subpath hosting. No browser/test dependencies are included in the shipped app.

See `RELEASE_NOTES.md`, `CLAUDE.md`, `SECURITY.md`, and `ASSET_NOTES.md` for implementation details.

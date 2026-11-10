# Neuro Arcade

Five short brain games in one installable, fully offline app. No accounts, no ads, no servers, no tracking.

| Game | What it exercises |
| --- | --- |
| Block Fit | Planning, mental flexibility (rules twist every so often), spatial reasoning |
| Lingo | Learn Spanish, French or German from zero in six scenarios (café, clothes shop, home, train station, flight cabin, hotel): a short picture lesson and quiz, then a timed shift where people ask you for things. Spaced repetition shared across scenarios |
| Holiday Horde | A survivor-style action game whose theme follows the holiday season. Auto-aim or hold-to-aim touch controls, upgrade paths, and a milestone reward every five levels (companion, chain lightning, blasts, barrier and more). Divided attention, quick decisions |
| Tycoon Row | An original property-trading game on a full 40-square board against three chatty rivals. Planning, probability sense, risk |
| Deep Delve | A turn-based dungeon where you study each floor, then cross it in the dark. Spatial memory, navigation, planning ahead |

## Put it on your phone

1. Create a GitHub repository and upload everything in this folder (keep the folder structure, including `.nojekyll` and `.github`).
2. In the repository go to **Settings > Pages**, set **Source** to *Deploy from a branch*, choose `main` and `/ (root)`, and save.
3. After a minute your app is at `https://<your-username>.github.io/<repo-name>/`.
4. Open that address in Chrome on your Android phone, open the menu and choose **Install app** (or **Add to Home screen**).
5. Open the app once while online so it can store itself. Test it: switch on airplane mode and open it from the home screen.

## The weekly rotation

The week runs Monday to Sunday. Play each of the five games at least once per week. A session counts when you finish it or play at least a minute. If a game goes 7 days or more without being played, the home screen shows a reminder and a badge on that game. Nothing is ever locked. The hub shows progress, there is a gate when a new week starts, and finishing all five builds a streak.

An installed app cannot open itself, so set a weekly reminder on your phone.

Change the numbers in `js/weekly.js` (`OVERDUE_DAYS`, `MIN_SESSION_SEC`), then run `node tools/build.mjs`.

## Progress and check-in

The Progress screen shows each game's weekly average, best and level, with the change from last week. The 90-second Check-in (reaction time and digit span) gives you a game-independent measure to compare over months. Settings has battery saver, sound, vibration, reduced motion, and export, import and erase of your data.

## Updating

After you change any file, run `node tools/build.mjs` and commit the result. It stamps a new version so phones pick up the update; the app shows a *Restart* button when one is ready.

Checks (Node 20 or newer, no dependencies): `node tools/audit.mjs` (security rules) and `node tools/test.mjs` (game and storage logic).

## Honest note on the evidence

Brain training reliably gets you better at the practised tasks. Transfer to everyday thinking is modest and debated. The best support is for learning demanding new skills, varied practice, and spatial navigation. Lingo has the clearest learning mechanism (spaced repetition of real vocabulary). Block Fit and Deep Delve exercise planning and spatial memory. Holiday Horde and Tycoon Row are included mostly because they are fun to keep coming back to; they are not clinically validated. This is mental exercise, not a medical treatment, which is why the Check-in exists.

## Battery

Frame rate is capped (30 fps in battery saver, the default), drawing stops when the app is hidden, canvases are capped in resolution, the interface is OLED-black, audio is released when idle, and the screen is never kept awake.

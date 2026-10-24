# Curio Cabinet — implemented design

Status: implemented in Neuro Arcade 2.2. Deep Delve remains retired. Curio Cabinet is in the catalog with all three rooms, thirty painted objects, eighteen layouts, five-round sessions, touch/keyboard/drag controls, peeking, saved recall phases, and persistent room medals.

## The idea

You are restoring a collection of curious miniature rooms. Study the objects in a cabinet, close its shutters, then return the objects to their remembered positions. Each correct arrangement brings a small scene back to life: a mechanical bird sings, an orrery starts turning, or a tiny glasshouse fills with light.

The focus is object-and-location memory. Echo Garden continues to cover musical sequences. The room should be interesting to look at and satisfying to rebuild even before scoring matters.

## One round

1. A cabinet opens on an arrangement of four recognizable objects. Study for ten seconds, or press Ready early. A calm setting allows unlimited study time.
2. Wooden shutters close for a short, skippable transition. The objects are moved into a tray and the cabinet opens with empty positions.
3. Select an object and its remembered position, or drag it there. Recall is untimed. You can rearrange your choices before submitting.
4. Submit the whole arrangement. Correct positions settle into place; mistakes are shown beside their original positions so the feedback teaches the arrangement.
5. The room animates and the next round adds complexity. A five-round session takes roughly three to five minutes, depending on the chosen pace.

Example: a brass bird on the upper-left shelf, a red bottle on the lower-right shelf, a crescent ornament beside the clock, and a shell in the center. After the shutters close, return those four objects to those four locations.

## First release scope

| Room | Objects and atmosphere | Completion animation |
| --- | --- | --- |
| The Clockmaker’s Study | Brass birds, gears, pocket watches, painted boxes; walnut shelves and warm desk lamps | Gears engage and the bird comes alive |
| The Glasshouse | Seed jars, sculpted leaves, watering cans, colored glass; curved framing and soft rain | Lanterns brighten and flowers open |
| The Midnight Observatory | Moon models, telescopes, star charts, small planets; navy velvet and engraved brass | A small orrery turns beneath moving stars |

Three rooms, each with six authored layouts. Layouts vary object positions within clear, reachable anchors. A seeded shuffle selects a five-round session without immediately repeating a layout. Begin with four objects, then progress toward six, eight, and ten. Increase object count and spatial complexity before reducing study time. Decorative scenery stays consistent during each round so it cannot create an accidental memory task.

## Art and feel

- Build room-specific architecture around the board: shelf recesses, cabinet doors, window frames, and practical lighting.
- Use a coherent set of detailed objects with the same camera angle, lighting, and scale. Every object needs a distinct silhouette and a readable name.
- Objects sit on surfaces with contact shadows. Movement follows the tray-to-shelf action; avoid continuously floating icons.
- Let the restored room provide the reward inside the game. Do not add another decoration tab to the arcade.
- Sound supports actions but is never needed to identify an object. Reduced motion replaces shutters and room animations with short fades or instant state changes.

## Controls and scoring

Mouse and touch support both drag/drop and select-then-place. Keyboard users select an object, move between positions with arrows, and press Enter to place; all slots and objects have accessible names. Touch targets should remain usable without precise dragging. A wide-screen room uses a cabinet; a phone uses a compact arrangement of deep shelves and a scrolling object tray.

Score primarily by the number of correctly remembered positions. Give a perfect-round bonus and room medals. Do not award recall-speed bonuses. Keep Calm and Timed Study comparisons separate. A Peek option briefly reveals the study layout and marks the round as assisted; it remains available without a failure screen or lost life.

Save between rounds and whenever paused or left. A resumed recall phase must restore the object tray and player arrangement without revealing the answer. Store per-room medals separately from current-run checkpoints so a fresh run retains earned progress.

## Build order

1. Make one beautiful Clockmaker’s Study round with four objects and complete pointer/keyboard controls.
2. Verify that hidden answers cannot be inferred from tray order, outlines, labels, or leftover marks. Shuffle tray order independently from the answer.
3. Add whole-arrangement submission, clear reveal feedback, Peek, reduced motion, and pause/resume at each phase.
4. Build out the three rooms and eighteen layouts, then add adaptive object counts and medals.
5. Test every authored layout, touch targets, backups, old installed-app upgrades, and root/subpath offline operation.

Defer extra modes, competitive timers, daily streak demands, and a separate collectible room until the central activity feels good.

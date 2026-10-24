# Cinderpath — playable roguelike deck-builder

Status: implemented in Neuro Arcade 2.3. It passed its standalone engine and full browser expedition before joining the arcade catalog.

## Direction

A solo, turn-based deck-building expedition through a ruined sky monastery. You play the Lanternbearer, carrying the last living ember through three distinct areas. Choose a route, predict enemy actions, build a focused deck, and defeat the guardian at the end of each area.

The design takes its broad genre inspiration from Slay the Spire. Cinderpath uses original characters, cards, relics, enemies, visual identity, encounters and text. Its first release is a complete compact expedition that fits an offline browser arcade.

## Core play

Start with a ten-card deck, three energy per turn, and a five-card hand. Cards deal damage, grant block, draw more cards, or create combinations. Used cards go to a discard pile; drawing through the deck reshuffles that pile. Enemy intent is visible before the player acts. Health persists between encounters, so a win can still carry a cost.

After battles, choose one of three card rewards or skip the reward to keep the deck focused. Routes branch between battles, elite encounters, story events, merchants and campfires. Campfires offer healing or a permanent card upgrade. Merchants offer cards, relics, healing and paid card removal. Relics modify an entire run and should create decisions that differ from simply adding damage.

## First release scope

| Part | Target |
| --- | --- |
| Playable hero | One fully developed Lanternbearer |
| Card pool | 30 original cards, each with an upgraded version |
| Relics | 12 passive effects |
| Areas | Three, with six route stages each and a distinct guardian |
| Encounters | A mix of single enemies and small groups, with clear behavior patterns |
| Run length | Target 15–25 minutes, saved after each action |
| Controls | Select a card, then its target; large touch targets and full keyboard support |
| Difficulty | A readable opening and more demanding enemy patterns later |

Playable areas:

- **The Ember Cloister:** amber lanterns, broken bells, slate arches, and ash creatures.
- **The Verdant Foundry:** living roots wrapped around brass machinery, green fire, and armored guardians.
- **The Starless Choir:** dark glass, suspended bridges, violet light, and the final guardian.

## Three build directions

- **Ember:** apply a damage-over-time effect, spread it, and trigger larger attacks from accumulated stacks.
- **Bastion:** generate block, retain some protection, and turn defense into counters.
- **Momentum:** draw, manipulate energy, and chain inexpensive cards into longer turns.

These share one card pool, so the player can combine them instead of choosing a permanent class specialization.

Selected cards (base versions):

| Card | Cost | Effect |
| --- | --- | --- |
| Lantern Strike | 1 | Deal 6 damage. |
| Brace | 1 | Gain 7 block. |
| Searing Mark | 1 | Deal 3 damage and apply 3 Ember. |
| Backdraft | 0 | Deal damage based on the target’s Ember, then draw a card. |
| Kilnheart | 2 | For this battle, gain block whenever you apply Ember. |
| Hold the Line | 1 | Gain block and retain the remaining block for one turn. |

## Presentation

Combat should feel like a scene: a visible hero, distinct enemies, readable intent symbols, impact animation, and architecture tied to the current area. Cards need illustrated motifs, clear costs and complete effect text. A phone should show readable cards in a horizontally scrolling hand rather than shrinking five cards into tiny buttons. Route choices should stay legible without pinch zoom.

Use animation to show card use and damage resolution. Reduced motion keeps the same information with fades or immediate changes. Color is supplemented by symbols, labels and numbers. Combat waits for player input; no shooting gesture or real-time movement is required.

## Reliability requirements

- Save the exact deck, draw/discard/exhaust piles, hand, enemy intent, route, relics and random-generator position after every committed action.
- Resume at the same decision, with no rerolled reward, free heal, lost card or repeated enemy action.
- Every card must occupy exactly one combat zone. Exhaust and power effects must not duplicate cards.
- Illegal targets, unaffordable cards and cancelled selections must consume no energy or turns.
- Damage, block, multi-hit attacks, statuses, deaths and on-kill effects must resolve in a documented order.
- A defeated enemy cannot attack later in the same turn. Defeat and victory record one result and clear the run checkpoint.
- Shops, card removal, upgrades and rewards must validate ownership, price, eligibility and deck-size limits.
- Browser back, backgrounding and installed-app updates must preserve a stable decision.
- Test complete seeded expeditions, every card/relic, all enemy patterns, save/resume at each phase, touch targeting, keyboard navigation, and root/subpath offline operation.

## Implemented controls and rules

Tap or click a card, then its living target. Self/all-target cards use the Play selected card button. Keyboard 1–9 selects a hand card; left/right changes enemy target; Enter commits; E ends the turn; Escape cancels or pauses. Hand cards stay readable in a horizontal phone scroller. Deck and zone inspectors pause play; draw pile contents are shown sorted, never in draw order.

Each attack hit adds Strength, then Weak reduces damage by 25%, then enemy Vulnerable increases it by 50%; floor the result. Block absorbs attack damage. Ember bypasses block at enemy-phase start, then decreases by one. All Ember deaths resolve before enemies act. Enemy intentions include block, attacks, growth, Weak and healing, and remain fixed through reloads. Block normally clears at the next player turn; Hold the Line or Ward Seal can retain it. Exhaust and powers reset between battles; health persists. Clearing the first two guardians heals 15 before the next area.

The opening deck has five Lantern Strikes, four Braces and one Searing Mark. Card rewards can be skipped. The deck cap is sixty; shops preserve at least five cards and charge progressively more for removal. Each card exists in exactly one combat zone at stable action boundaries. The current resolving card cannot be drawn again until its effects finish.

## Validation

The new engine suite exercises all cards/upgrades and enemy patterns, exact damage/status ordering, illegal actions, shops, relic effects, card conservation, corrupted snapshots, all six decision phases and 150 complete seeded expeditions using three legal development policies. Browser coverage completes the expedition via real touch and keyboard controls, reloads every decision phase without changing RNG/rewards/intentions, verifies desktop/mobile presentation, records one terminal result, and clears its checkpoint. The standalone browser harness ran before catalog integration; the integrated test then checks the actual arcade.

Additional heroes and card pools remain future work.

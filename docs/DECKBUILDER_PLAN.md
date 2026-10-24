# Cinderpath 2.4 — The deeper climb

Cinderpath is a complete original solo deck-building expedition inside the twelve-game Neuro Arcade collection. See `CINDERPATH_COMPARISON.md` for the research, gaps and adaptation decisions.

## Travelers and content

- **Lanternbearer:** 80 base health. Ember damage, sacrifice, conversion and exhaust synergies. Coal Charm boosts the first Attack in a battle.
- **Ironbound:** 90 base health. Forge generation, stored-resource payoffs, block and counterattacks. Traveler’s Anvil improves the first block effect each turn and generates Forge.
- **Starweaver:** 78 base health. Glimmer costs, temporary Shards, Scry, card retention and draw manipulation. Sleeping Prism provides starting and recurring Glimmer.

Each hero has 21 class cards. Eleven shared cards and two basic cards bring the playable total to 76. Six additional definitions handle statuses, curses and a generated token. Each playable card has an upgraded version. The game contains 32 relics, eight potions, five enchantments, ten event types, six guardians and 17 enemy definitions.

New expeditions contain three acts of twelve stops. Each act chooses one of two environments. A Waykeeper, treasure room, final camp and guardian anchor the route; explicit connections govern the intervening branches. Unknown rooms resolve when entered and remain fixed in the save.

## Combat order

1. Begin the player turn: reset/retain block, replenish energy, generate resources, resolve turn-start powers, and draw five new cards up to the ten-card hand limit. Innate cards count toward the opening hand; retained cards remain in addition to later draws.
2. Check a selected card’s ownership, energy, Glimmer/Forge requirement, target and pending-choice status before mutating anything.
3. Pay costs and remove the card from hand. Apply a one-play affliction, resolve effects in printed order, then move the resolving card to discard, exhaust or powers. It cannot draw itself while resolving.
4. Scry holds inspected cards in a separate zone. Recovery leaves its options in discard. Other draw triggers wait until the player commits the pending choice. Enemy actions and further plays wait too.
5. End turn: resolve held-card damage, Retain, Ethereal and discard. Ember then damages enemies before any of them act and loses one stack. Dead enemies cannot act.
6. Resolve each surviving enemy’s displayed action. New summons wait until the next enemy phase. Awakening guardians return once with 40% health and extra Strength.

Strength adds damage per hit. Weak multiplies attack damage by 75%; Vulnerable by 150%; round down. Enemy Armor then reduces each direct hit. Block absorbs the remainder. Ember bypasses block and Armor. Enemy Thorns returns damage on Attack hits and can be blocked. Forge and Glimmer cap at twelve and reset between battles. Health persists.

## Cards and consumables

Retain, Ethereal, Innate, Exhaust, X costs and power effects have explicit text. Blue costs consume Glimmer in addition to energy. Some Forge/Glimmer payoffs consume the stored resource. Inspectors show draw contents sorted, never the actual draw order; Scry earns a view of upcoming cards.

Keen, Warded, Kindled, Flowing and Swift are additional run-long enchantments. Taxed and Brittle are battle-only card afflictions. Status cards disrupt the current battle; Curse cards remain in the permanent deck until removed or transformed where allowed.

Potions cost no energy. Targeted potions require a living enemy; self/all potions use the selected-potion button. Lifedrop also works outside combat. A full belt requires discarding or replacing a potion before collecting another. Capacity changes and pact tradeoffs are stated on the relics.

## Expedition and progression

Cards, potions and relics can be skipped independently. Merchant prices/stock, event offers, unknown-room results and Waykeeper gifts are fixed after generation. Campfires offer healing or a permanent upgrade; Glass Covenant removes camp healing. Clearing a guardian heals 15 before the next act.

All heroes and pools are available immediately. Wins unlock the next challenge for that hero, through Challenge V. A local chronicle keeps the last thirty terminal runs, seeds, final decks, relics, discoveries and unlocked story fragments. Scores compare hero/challenge variants separately. Optional seed entry supports replaying an expedition.

## Controls and saves

Select a card, then its enemy. Self/all cards use Play selected card. Keyboard 1–9 selects a hand card; arrows change targets; Enter commits; E ends turn; Escape cancels or pauses. Native buttons also support Tab/Enter. Card hands scroll horizontally on phones.

Every committed action saves the complete route, RNG, card zones, generated cards, pending choice, afflictions, potions, intentions and reward state. Invalid actions consume nothing. Terminal states clear the checkpoint and record one result. Failed device writes retain an exportable in-memory checkpoint with a warning; it cannot survive browser closure.

2.3 checkpoints migrate without rerolling the current decision and keep their original six-stop areas. New expeditions use the expanded map. All data remains local and is included in Settings backup/export; reset clears the chronicle too. No runtime networking, login or multiplayer system is included.

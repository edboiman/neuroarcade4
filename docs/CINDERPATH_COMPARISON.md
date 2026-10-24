# Cinderpath: comparison and adaptation

Reviewed October 24, 2026. The comparison uses Mega Crit’s official descriptions of Slay the Spire 2 and its mechanics, then checks the actual Cinderpath 2.3 source. This is a systems comparison, not a claim that a browser arcade now has the full content or production scale of the commercial game.

## What was missing, and what changed

| System | Cinderpath 2.3 | Cinderpath 2.4 adaptation |
| --- | --- | --- |
| Character identity | One traveler and a shared pool | Three original heroes with separate 21-card class pools, shared cards, distinct starters and relics. Lanternbearer builds Ember; Ironbound stores/spends Forge; Starweaver generates/spends Glimmer. |
| Card breadth and decisions | 30 cards, mostly damage/block/status numbers | 76 playable cards plus six curse/status/token definitions. Added X costs, Retain, Ethereal, Innate, Scry, recovery, generated cards, more powers and explicit resource costs. |
| Consumables | None | Eight potions, a persistent three-slot belt, capacity-changing relics, targeted and self-use, drops, replacement, discarding and merchant stock. |
| Enchantments | Ordinary upgrades only | Five permanent expedition modifiers independent of upgrades: Keen, Warded, Kindled, Flowing and Swift. Events and a starting gift offer them. |
| Afflictions and deck disruption | None | Taxed and Brittle battle-only card modifiers; Daze, Splinter and Scorch temporary statuses; Burden and Regret permanent curses. Enemy intent explains the threat; cleansing and removal provide counterplay. |
| Map strategy | Six stops per act; lane-neighbor rule and decorative lines | Twelve stops per act, explicit seeded connections, splits/merges, unknown rooms, treasure, guaranteed preparation before a guardian, and legal-path validation. Three acts contain 36 stops. |
| Act identity | Same three environments and bosses | Two possible environments per act, six guardians total, 17 enemy definitions, new painted actors and architecture variants. Only three environments occur in a given run. |
| Act-entry bargains | None | Waykeepers offer permanent gifts at each act entrance. Later pacts trade energy/draw/health advantages against potion capacity, lost camp healing, Weak, curses or higher prices. |
| Enemy variety | Eleven simple cycling patterns | Armor, Thorns, summoning, card afflictions, temporary status cards and awakening guardians add distinct responses. Summons wait until the following enemy phase. |
| Rewards and economy | Card choice, an automatic elite relic | Independent card/potion/relic reward decisions; a choice of relics from elites and treasure; weighted card rarities; variable prices, removal costs and potion stock. Bosses reward cards/gold and lead to the next Waykeeper rather than a copied boss-relic screen. |
| Replay and progression | Arcade score only | Six challenge settings per hero, replayable seeds, a 30-run history with final decks/relics, discoveries and six story fragments. All heroes and card pools remain playable immediately. |
| Explanation and usability | Short instructions | In-game glossary, displayed modified costs, blue Glimmer costs, status/affliction badges, readable phone hands, target selection, inspectors, touch and keyboard support. |

## Why these systems matter

The aim is to make an earlier choice change the value of later choices. An enchantment can preserve a starter card that would otherwise be removed. A Glimmer payoff is valuable only with enough generation. A potion slot can be worth more than another purchase. An elite offers a relic but can cost the health needed for a guardian. A pact can solve an energy problem while creating a healing or draw problem.

The new systems are original content and independent balancing. Character names, card pools, writing, enemy designs, artwork, maps and numbers are Cinderpath’s. The game remains a local, offline, solo PWA. Online co-op, matchmaking, mod support and commercial-scale content parity are outside this release.

## Official sources used

- [Mega Crit FAQ](https://www.megacrit.com/faq/): current feature families, including characters, potions, enchantments, afflictions, Ancients and alternate acts.
- [Developer’s Steam description](https://store.steampowered.com/app/2868840/Slay_the_Spire_2/): character-specific playstyles, changing runs, lore and cooperative mode.
- [February 2025 Neowsletter](https://www.megacrit.com/news/2025-2-12-neowsletter-issue-7/): enchantments as additional card modifiers lasting for the run.
- [April 2025 Neowsletter](https://www.megacrit.com/news/2025-4-15-neowsletter-issue-9/): enemies afflicting cards, and challenge progression.
- [November 2025 Neowsletter](https://www.megacrit.com/news/2025-11-13-neowsletter-issue-16/): Ancients at act entrances, powerful offers and tradeoffs replacing the earlier boss-relic structure.

## Validation and limits

The pure suite exercises every playable card and upgrade, all enemy patterns, all potion types and enchantments, relic acquisition/triggers, resource costs, turn ordering, card conservation, generated cards, pending decisions, malformed checkpoints and journal data. It runs 180 complete legal-policy expeditions across all heroes at standard and highest challenge, plus exact reload checks. These policies are regression tools and balance signals; their win rates are not predictions for human players.

Browser checks complete a full three-act run with each hero using real buttons and keyboard actions, validate all decision-phase reloads, and check progression/history/collection. Focused checks cover Scry, recovery, three-enemy targeting, potion replacement, affliction costs, defeat, corrupt checkpoints, storage failure and exact 2.3-save migration. The wider arcade checks offline root/subpath play and installed updates.

Existing 2.3 expeditions keep their six-stop routes, current cards, health, rewards, enemy intentions and RNG positions. The expanded routes and hero selection apply to fresh expeditions. Numeric balance and current card definitions apply after updating. Estimated run length is 30–45 minutes; human playtime and long-term balance still need player feedback.

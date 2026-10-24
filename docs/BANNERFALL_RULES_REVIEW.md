# Bannerfall: rules review and visual update

Reviewed October 24, 2026 against Hasbro’s classic world-domination rules. The [current Hasbro guide](https://instructions.hasbro.com/api/download/B7404_en-us_risk-game.pdf) covers classic play and connected maneuvering; the [earlier classic guide](https://www.hasbro.com/common/instruct/risk.pdf) also spells out card trade timing and capture movement. Bannerfall has an original map and names.

## Rules checked

| System | Before | 2.5 behavior |
| --- | --- | --- |
| Income | Territory and complete-continent bonuses | Retained: territory count divided by three, rounded down, minimum three, plus owned continents. |
| Combat | Correct sorted comparisons and defensive ties; automatic maximum dice | Retained comparisons. Choose 1–3 attack dice; set a persistent 1–2 defense-dice preference. Counts shrink with available troops. Blitz repeats with the chosen cap. |
| Occupation | Required capture movement, optional advance of all remaining troops | Required movement retained; additional movement can use all available troops or a chosen amount. At least one troop remains behind. |
| Cards | Unlimited random symbols | Fresh campaigns use thirty named territory cards and two Wild banners, with a shuffled draw/discard cycle. One card is awarded when attacks end after any capture. |
| Trades | Automatic set choice, no territorial match | Select three cards. Matching symbols, three distinct symbols and Wild-assisted sets are supported. Shared trade value rises 4/6/8/10/12/15, then +5. An owned traded territory gets two troops; choose where if several qualify. This bonus is capped at once per turn. |
| Forced trades | Turn-start auto-trade only | Five cards at turn start prevents deployment until a set is chosen. An elimination producing six or more cards interrupts attacks: trade to four or fewer, deploy, then resume attacking. |
| Elimination | Captured cards transferred | Retained, with immediate trading/deployment added. |
| Fortification | One move through connected friendly land | Retained. Destination must be connected through friendly territory and one troop stays behind. Legal destinations now have a distinct outline. |

## Deliberate adaptation choices

Bannerfall uses thirty territories in six five-territory realms, four banners and custom continent bonuses. Fresh campaigns start with thirty troops per banner and seeded automatic allocation. Human defense is a persistent preference so AI turns do not repeatedly interrupt play; it can be changed from the campaign panel. The world-domination goal is complete conquest. Secret missions, capitals, manual territory drafting, alternative player counts and two-player neutral armies are separate modes and are not included.

Old campaigns keep their original armies, territory ownership, symbol-only card hands and RNG position. They receive the rule fixes and interface, but keep their infinite legacy symbol deck rather than inventing territory identities for old cards. The game explains that distinction in its rules panel.

## Design and verification

The atlas has shared irregular province boundaries, etched sea routes, continent terrain motifs, brass-edged troop counters, banner flags, a control bar, phase steps, card faces, actual die pips, legal-target outlines, a territory finder and a whole-map overview. Visual changes do not change adjacency.

Regression checks cover matching/Wild sets, bonus targeting, mandatory trades, capture movement, defense preferences, one-card timing, reshuffling, card conservation, malformed saves, exact legacy restore and one hundred full legal AI campaigns with finite cards. Browser checks exercise actual capture/trade/deploy/advance/fortify actions and reloads on narrow phones and desktop. Existing arcade tests still run.

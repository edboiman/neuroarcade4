# Artwork

Environment artwork was created for this project using the built-in image-generation tool, then packaged as local compressed WebP assets. No external image URLs are loaded at runtime.

Production prompt set:

- Arcade room: a boutique miniature arcade at blue hour, five illuminated cabinets, plants, pendant lamps, terrazzo flooring, navy walls, brass and walnut materials; warm, hand-painted stylized 3D diorama; no people, logos, or text; darker negative space for interface copy.
- Dungeon: lantern-lit layered cut-stone arches, moss, amber lanterns, blue crystals, worn flagstones, and stairs into darkness; premium hand-painted fantasy environment; no characters or text.
- Cafe: a small European cafe at sunrise, terracotta flooring, walnut counter, brass espresso machine, pendant lamps, crockery, and a window onto a quiet street; no people or text.
- Forest: moonlit storybook clearing, carved pumpkins, twisted trees, autumn leaves, fireflies, a stone path, and distant warm cottage windows; cozy Halloween atmosphere; no characters or text.
- City: a miniature seaside town with terraced houses, a railway station, park, harbor boats, roads, and copper roofs; elevated isometric view with tactile wood and ceramic materials; no characters or text.

Final local assets: `assets/arcade-room.webp`, `assets/cafe.webp`, `assets/forest.webp`, `assets/city.webp`.

Marbleworks and Bannerfall gameplay, room previews, decorations, and vocabulary icons are native Canvas/SVG assets. Horde uses the local painted sprite atlas described below, with native effects and UI. Poppins remains bundled under its included SIL Open Font License in `fonts/OFL.txt`.


## Horde 2.1 production art

- `assets/horde-actors.webp`: an original four-by-four transparent sprite atlas. Four walk/wing frames each for a hooded teal ranger with bow and copper lantern, a burgundy skeletal soldier, a violet spectral bat, and a moss-armored ogre. Generated using the built-in image tool, then cell-cropped, packed into a 768-pixel atlas, and compressed as WebP. Sprites animate inside the game; they are not background illustrations.
- `assets/horde-ground.webp`: a local 512-pixel tiled overhead forest floor. Prompt: dark fantasy forest clearing, muted moss-green grass, weathered charcoal flagstones, tiny fallen leaves, subtle roots, even lighting, restrained contrast, no focal objects, characters, text, or interface.

All art ships locally and is included in the offline cache. No external artwork URLs, branded game assets, or proprietary territory maps are used.

The Deep Delve runtime illustration and renderer were removed in 2.1.1. Earlier prompt descriptions above are historical notes.


## Curio Cabinet 2.2 production art

`assets/curio-objects.webp` is a local 960 × 1152 transparent atlas (five columns, six rows, 192-pixel cells). It contains thirty original painted miniature curios, ten per room. The built-in image-generation tool produced the source. Asset preparation crops each isolated object to its own bounds, packs consistent padded cells, and compresses WebP while retaining alpha. All room frames, shelving, shutters, clock hands, glasshouse framing, lamps, star fields and orrery motifs are native SVG/CSS in the playable interface.

Production prompt: a strict five-column by six-row transparent sprite atlas, thirty isolated standalone objects, no labels, text, backgrounds, shelves, scenery or UI; consistent three-quarter front camera, rich brass reflections, colored glass, carved wood and ceramic; warm upper-left key light and cool fill, clear silhouettes at 64 pixels, full objects inside padded cells. Rows: (1) brass mechanical songbird, pocket watch, scarlet glass bottle, golden key, wooden music box; (2) enamel butterfly, ivory knight, copper bell, magnifying glass, open purple pearl box; (3) potted fern, green glass watering can, seed jar, yellow ceramic snail, pink orchid; (4) teal garden gloves, ruby glass apple, moss terrarium, silver pruning shears, amber honey bottle; (5) brass telescope, crescent moon on pedestal, celestial globe, violet crystals, rolled star chart; (6) blue-sand hourglass, silver star on stand, ceramic owl, armillary sphere, burgundy moon book.

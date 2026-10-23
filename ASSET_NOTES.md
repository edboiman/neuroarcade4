# Artwork

Environment artwork was created for this project using the built-in image-generation tool, then packaged as local compressed WebP assets. No external image URLs are loaded at runtime.

Production prompt set:

- Arcade room: a boutique miniature arcade at blue hour, five illuminated cabinets, plants, pendant lamps, terrazzo flooring, navy walls, brass and walnut materials; warm, hand-painted stylized 3D diorama; no people, logos, or text; darker negative space for interface copy.
- Dungeon: lantern-lit layered cut-stone arches, moss, amber lanterns, blue crystals, worn flagstones, and stairs into darkness; premium hand-painted fantasy environment; no characters or text.
- Cafe: a small European cafe at sunrise, terracotta flooring, walnut counter, brass espresso machine, pendant lamps, crockery, and a window onto a quiet street; no people or text.
- Forest: moonlit storybook clearing, carved pumpkins, twisted trees, autumn leaves, fireflies, a stone path, and distant warm cottage windows; cozy Halloween atmosphere; no characters or text.
- City: a miniature seaside town with terraced houses, a railway station, park, harbor boats, roads, and copper roofs; elevated isometric view with tactile wood and ceramic materials; no characters or text.

Final local assets: `assets/arcade-room.webp`, `assets/dungeon.webp`, `assets/cafe.webp`, `assets/forest.webp`, `assets/city.webp`.

Marbleworks and Bannerfall gameplay, room previews, decorations, and vocabulary icons are native Canvas/SVG assets. Horde uses the local painted sprite atlas described below, with native effects and UI. Poppins remains bundled under its included SIL Open Font License in `fonts/OFL.txt`.


## Horde 2.1 production art

- `assets/horde-actors.webp`: an original four-by-four transparent sprite atlas. Four walk/wing frames each for a hooded teal ranger with bow and copper lantern, a burgundy skeletal soldier, a violet spectral bat, and a moss-armored ogre. Generated using the built-in image tool, then cell-cropped, packed into a 768-pixel atlas, and compressed as WebP. Sprites animate inside the game; they are not background illustrations.
- `assets/horde-ground.webp`: a local 512-pixel tiled overhead forest floor. Prompt: dark fantasy forest clearing, muted moss-green grass, weathered charcoal flagstones, tiny fallen leaves, subtle roots, even lighting, restrained contrast, no focal objects, characters, text, or interface.

All art ships locally and is included in the offline cache. No external artwork URLs, branded game assets, or proprietary territory maps are used.

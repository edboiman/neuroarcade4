import { CATALOG } from './catalog.js';
const loads = { marbleworks: () => import('./games/marbleworks.js'), conquest: () => import('./games/conquest.js'), blockfit: () => import('./games/blockfit.js'), cafe: () => import('./games/cafe.js'), survivor: () => import('./games/survivor.js'), estate: () => import('./games/estate.js'), dungeon: () => import('./games/dungeon.js') };
export const GAMES = CATALOG.map(g => ({ ...g, load: loads[g.id] || (() => import('./games/rooms.js')) }));
export const byId = id => GAMES.find(g => g.id === id);

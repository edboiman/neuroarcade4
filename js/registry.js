import { CATALOG } from './catalog.js';
const loads = { cinderpath: () => import('./games/cinderpath.js'), curio: () => import('./games/curio.js'), marbleworks: () => import('./games/marbleworks.js'), conquest: () => import('./games/conquest.js'), blockfit: () => import('./games/blockfit.js'), survivor: () => import('./games/survivor.js'), estate: () => import('./games/estate.js') };
export const GAMES = CATALOG.map(g => ({ ...g, load: loads[g.id] || (() => import('./games/rooms.js')) }));
export const byId = id => GAMES.find(g => g.id === id);

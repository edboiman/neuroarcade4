export const CATALOG = [
  {id:'cinderpath',name:'Cinderpath',category:'Adventure',duration:'30–45 min',minutes:35,world:'ember',tag:'Carry the last light',blurb:'Choose one of three heroes and build around Ember, Forge or Glimmer. Explore connected routes across six areas, shape seventy-six cards with upgrades and enchantments, carry potions, bargain with Waykeepers and overcome evolving guardians.',trains:['Planning','Adaptation'],accent:'#e3ae73',accent2:'#9d826d',rgb:'227,174,115'},
  {id:'curio',name:'Curio Cabinet',category:'Memory',duration:'3–5 min',minutes:4,world:'cabinet',tag:'A small world to remember',blurb:'Study a cabinet of little treasures, close the shutters, and return each object to its remembered place. Three living rooms, five arrangements, and untimed recall.',trains:['Spatial memory','Observation'],accent:'#d8c194',accent2:'#90b8a3',rgb:'216,193,148'},
  {id:'marbleworks',name:'Marbleworks',category:'Puzzle',duration:'Free pace',minutes:8,world:'atelier',tag:'Build a little chain reaction',blurb:'Arrange wooden rails, spring bumpers and air lifts. Guide a glass marble through six physics challenges or build freely.',trains:['Spatial reasoning','Experimentation'],accent:'#d6b784',accent2:'#8cb5ad',rgb:'214,183,132'},
  {id:'conquest',name:'Bannerfall',category:'Strategy',duration:'20–45 min',minutes:30,world:'atlas',tag:'Thirty territories. One banner.',blurb:'Reinforce, roll for territory, and control six original continents. Conquer a world against three AI rivals.',trains:['Planning','Probability sense'],accent:'#7ebdb6',accent2:'#debd78',rgb:'126,189,182'},
  {
    id: 'blockfit', category: 'Puzzle', duration: '3 min', world: 'orbital', minutes: 3,
    name: 'Block Fit',
    tag: 'Shape puzzle',
    blurb: 'Fit falling shapes into tight rows. Every so often the rules twist, and you have to adapt.',
    trains: ['Planning', 'Mental flexibility', 'Spatial reasoning'],
    accent: '#ffc83d',
    accent2: '#ff7a18',
    rgb: '255,200,61',
  },
  {
    id: 'survivor', category: 'Action', duration: '10 min', world: 'forest', minutes: 10,
    name: 'Holiday Horde',
    tag: 'Survive. Evolve. Overwhelm.',
    blurb: 'Tap a destination and let your weapons fire automatically. Survive ten minutes of escalating hordes. Stack six automatic weapons, open elite chests, and evolve your build into a screen-clearing arsenal.',
    trains: ['Divided attention', 'Spatial awareness', 'Quick decisions'],
    accent: '#ff5878',
    accent2: '#ff9a5c',
    rgb: '255,88,120',
  },
  {
    id: 'estate', category: 'Strategy', duration: '10–25 min', world: 'city', minutes: 20,
    name: 'Tycoon Row',
    tag: 'Strategy',
    blurb: 'Race three chatty rivals around a full 40-square board. Buy deeds, auction, build on full sets and finish richest.',
    trains: ['Planning', 'Probability sense', 'Risk and reward'],
    accent: '#35e6a0',
    accent2: '#16a3a8',
    rgb: '53,230,160',
  },

  { id: 'signal', name: 'Signal Junction', category: 'Strategy', duration: '5 min', minutes: 5, world: 'rail', tag: 'Route the railway', blurb: 'Guide colored trains to their stations. Set switches, watch the timetable, and keep the junction clear.', trains: ['Planning', 'Observation'], accent: '#79d9c4', accent2: '#399c93', rgb: '121,217,196' },
  { id: 'workshop', name: 'Clockwork Workshop', category: 'Puzzle', duration: '5 min', minutes: 5, world: 'workshop', tag: 'Restore the machinery', blurb: 'Rotate brass conduits to carry power through a workshop. Follow the live circuit and bring the machines back to life.', trains: ['Planning', 'Observation'], accent: '#eac083', accent2: '#b5824d', rgb: '234,192,131' },
  { id: 'echo', name: 'Echo Garden', category: 'Memory', duration: '3 min', minutes: 3, world: 'garden', tag: 'Find the pattern', blurb: 'Listen, watch, and replay a growing sequence of lanterns. Restore a quiet garden one melody at a time.', trains: ['Planning', 'Observation'], accent: '#b8d98a', accent2: '#619761', rgb: '184,217,138' },
];
export const GAME_IDS = CATALOG.map(g => g.id);

// Retired games remain valid in old history and backups, but cannot launch.
export const RETIRED_GAME_IDS = ['dungeon', 'cafe', 'casebook', 'logistics'];
export const STORED_GAME_IDS = [...GAME_IDS, ...RETIRED_GAME_IDS];

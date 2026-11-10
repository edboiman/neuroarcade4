// Holiday Horde skins. Every theme plays the same; only the look and the names change.
// Emoji are drawn by the phone's own font, so no image files are needed.
export const THEMES = [
  {
    id: 'halloween',
    name: 'Halloween',
    months: [10],
    hero: '🧙',
    shot: '✨',
    gem: '🍬',
    enemies: { grunt: '👻', swift: '🦇', tank: '💀', swarm: '🕷️', boss: '🧛' },
    decor: ['🕸️', '🍂', '🦴', '🌙'],
    bg: ['#24123a', '#0b0614'],
    glow: '#ff8a1f',
    tagline: 'Survive until sunrise.',
  },
  {
    id: 'harvest',
    name: 'Harvest',
    months: [9, 11],
    hero: '🦃',
    shot: '🌽',
    gem: '🍂',
    enemies: { grunt: '🐀', swift: '🐿️', tank: '🐗', swarm: '🐛', boss: '🐻' },
    decor: ['🍁', '🌾', '🎃', '🍄'],
    bg: ['#3a2410', '#140b05'],
    glow: '#ffb347',
    tagline: 'Protect the harvest feast.',
  },
  {
    id: 'winter',
    name: 'Winter',
    months: [12, 1],
    hero: '🎅',
    shot: '⭐',
    gem: '🎁',
    enemies: { grunt: '🥶', swift: '🌬️', tank: '🧊', swarm: '❄️', boss: '⛄' },
    decor: ['🌲', '❄️', '⭐', '🔔'],
    bg: ['#12294a', '#050c18'],
    glow: '#8fd3ff',
    tagline: 'Deliver the gifts through the blizzard.',
  },
  {
    id: 'valentine',
    name: 'Valentine',
    months: [2],
    hero: '😍',
    shot: '💖',
    gem: '🍫',
    enemies: { grunt: '💔', swift: '🥀', tank: '🧱', swarm: '🐝', boss: '😈' },
    decor: ['💌', '🌹', '💕', '🎀'],
    bg: ['#40122e', '#14050f'],
    glow: '#ff5fa2',
    tagline: 'Love wins. Eventually.',
  },
  {
    id: 'spring',
    name: 'Spring',
    months: [3, 4, 5],
    hero: '🐰',
    shot: '🥕',
    gem: '🌸',
    enemies: { grunt: '🐌', swift: '🐛', tank: '🐢', swarm: '🦟', boss: '🐲' },
    decor: ['🌷', '🌼', '🍀', '🦋'],
    bg: ['#15401f', '#06140a'],
    glow: '#9be564',
    tagline: 'Keep the garden in bloom.',
  },
  {
    id: 'summer',
    name: 'Summer',
    months: [6, 7, 8],
    hero: '😎',
    shot: '💥',
    gem: '🍉',
    enemies: { grunt: '🦀', swift: '🐝', tank: '🐙', swarm: '🦟', boss: '🦈' },
    decor: ['🌴', '🐚', '☀️', '🌊'],
    bg: ['#0e4a55', '#04141a'],
    glow: '#ffd23f',
    tagline: 'Hold the beach until sundown.',
  },
];

export const themeById = (id) => THEMES.find((t) => t.id === id) || THEMES[0];

// month is 1..12
export function themeForMonth(month) {
  return THEMES.find((t) => t.months.includes(month)) || THEMES[0];
}
export const themeForDate = (d = new Date()) => themeForMonth(d.getMonth() + 1);

// Tower type definitions. Each tower has 3 tiers (base + 2 upgrades).
// range/splash are in grid-tile units; fireRate is shots per second (or dps for laser).
const TOWER_TYPES = {
  cannon: {
    name: 'Kanonenturm',
    desc: 'Ausgewogener Standardturm.',
    shape: SHAPES.towers.cannon,
    palettes: TOWER_PALETTES.cannon,
    projectileColor: ['#3a2a1a', '#2a2a2a', '#7a4b00'],
    sound: 'cannon',
    tiers: [
      { cost: 50, damage: 20, range: 2.6, fireRate: 1.1 },
      { cost: 60, damage: 32, range: 2.8, fireRate: 1.3 },
      { cost: 90, damage: 48, range: 3.0, fireRate: 1.5 },
    ],
  },
  laser: {
    name: 'Laserturm',
    desc: 'Dauerfeuer mit kontinuierlichem Schaden.',
    shape: SHAPES.towers.laser,
    palettes: TOWER_PALETTES.laser,
    beam: true,
    sound: 'laser',
    tiers: [
      { cost: 80, damage: 18, range: 2.4, fireRate: 0 },
      { cost: 90, damage: 30, range: 2.6, fireRate: 0 },
      { cost: 140, damage: 48, range: 2.9, fireRate: 0 },
    ],
  },
  mine: {
    name: 'Minenwerfer',
    desc: 'Flächenschaden gegen Gruppen.',
    shape: SHAPES.towers.mine,
    palettes: TOWER_PALETTES.mine,
    projectileColor: ['#222711', '#331d0a', '#330a0a'],
    splash: [1.3, 1.5, 1.8],
    sound: 'mine',
    tiers: [
      { cost: 90, damage: 25, range: 2.3, fireRate: 0.7 },
      { cost: 100, damage: 38, range: 2.5, fireRate: 0.8 },
      { cost: 150, damage: 55, range: 2.7, fireRate: 0.9 },
    ],
  },
  frost: {
    name: 'Frostturm',
    desc: 'Verlangsamt Gegner, geringer Schaden.',
    shape: SHAPES.towers.frost,
    palettes: TOWER_PALETTES.frost,
    projectileColor: ['#0a1a2a', '#0a1030', '#8fd6ff'],
    slow: [
      { factor: 0.5, duration: 1.5 },
      { factor: 0.4, duration: 1.8 },
      { factor: 0.3, duration: 2.2 },
    ],
    sound: 'frost',
    tiers: [
      { cost: 70, damage: 6, range: 2.2, fireRate: 1.0 },
      { cost: 80, damage: 10, range: 2.4, fireRate: 1.1 },
      { cost: 120, damage: 16, range: 2.6, fireRate: 1.2 },
    ],
  },
  sniper: {
    name: 'Scharfschütze',
    desc: 'Sehr hoher Einzelschaden, große Reichweite.',
    shape: SHAPES.towers.sniper,
    palettes: TOWER_PALETTES.sniper,
    projectileColor: ['#0d1a08', '#0a0a0a', '#000000'],
    sound: 'sniper',
    tiers: [
      { cost: 110, damage: 90, range: 4.2, fireRate: 0.45 },
      { cost: 130, damage: 140, range: 4.6, fireRate: 0.5 },
      { cost: 200, damage: 220, range: 5.0, fireRate: 0.55 },
    ],
  },
};

const TOWER_ORDER = ['cannon', 'laser', 'mine', 'frost', 'sniper'];

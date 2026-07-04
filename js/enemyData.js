// Enemy type definitions: 3 normal types + 2 unique bosses.
const ENEMY_TYPES = {
  grunt: {
    name: 'Späher',
    shape: SHAPES.enemies.grunt,
    palette: ENEMY_PALETTES.grunt,
    baseHp: 26,
    speed: 1.9, // tiles per second
    bounty: 4,
    radius: 0.32,
    isBoss: false,
  },
  brute: {
    name: 'Brocken',
    shape: SHAPES.enemies.brute,
    palette: ENEMY_PALETTES.brute,
    baseHp: 95,
    speed: 0.9,
    bounty: 9,
    radius: 0.42,
    isBoss: false,
  },
  balanced: {
    name: 'Läufer',
    shape: SHAPES.enemies.balanced,
    palette: ENEMY_PALETTES.balanced,
    baseHp: 55,
    speed: 1.35,
    bounty: 6,
    radius: 0.36,
    isBoss: false,
  },
  boss1: {
    name: 'Steingolem',
    shape: SHAPES.enemies.boss1,
    palette: ENEMY_PALETTES.boss1,
    baseHp: 1500,
    speed: 0.7,
    bounty: 150,
    radius: 0.72,
    isBoss: true,
    special: 'speedBoost', // periodic speed burst
  },
  boss2: {
    name: 'Schattenkönig',
    shape: SHAPES.enemies.boss2,
    palette: ENEMY_PALETTES.boss2,
    baseHp: 3400,
    speed: 0.85,
    bounty: 400,
    radius: 0.78,
    isBoss: true,
    special: 'heal', // periodic self-heal + late enrage
  },
};

// Global game configuration and constants
const CONFIG = {
  COLS: 9,
  ROWS: 14,
  TILE: 42, // logical pixels per grid cell
  get WIDTH() { return this.COLS * this.TILE; },
  get HEIGHT() { return this.ROWS * this.TILE; },
  STORAGE_KEY: 'pixelDefenseProgress_v1',
  LEVEL_COUNT: 7,
  BOSS_LEVELS: [4, 7],
  START_LIVES: 20,
  SELL_REFUND_RATIO: 0.6,
};

const COLORS = {
  grass1: '#3a6b35',
  grass2: '#345f30',
  path1: '#c9a66b',
  path2: '#bd9a5f',
  pathEdge: '#8a6f45',
  buildHighlight: 'rgba(46, 196, 182, 0.35)',
  buildInvalid: 'rgba(255, 107, 107, 0.35)',
  rangeCircle: 'rgba(255, 255, 255, 0.25)',
  hpBack: '#2b1010',
  hpFill: '#5bd65b',
  hpFillLow: '#e0483b',
};

// Procedural pixel-art sprites drawn with plain canvas rects (no image assets required).
// Each shape is a grid of small strings; each character is a palette code (0 = transparent).

function drawBlockSprite(ctx, shape, palette, x, y, w, h) {
  const rows = shape.length;
  const cols = shape[0].length;
  const cw = w / cols;
  const ch = h / rows;
  for (let r = 0; r < rows; r++) {
    const row = shape[r];
    for (let c = 0; c < cols; c++) {
      const code = row[c];
      if (code === '0') continue;
      const color = palette[code];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(
        Math.round(x + c * cw) - 0.5,
        Math.round(y + r * ch) - 0.5,
        Math.ceil(cw) + 1,
        Math.ceil(ch) + 1
      );
    }
  }
}

const SHAPES = {
  towers: {
    cannon: [
      '0111110',
      '1222221',
      '1233321',
      '1233321',
      '1233321',
      '1222221',
      '0111110',
    ],
    laser: [
      '0001000',
      '0013100',
      '0133310',
      '1333331',
      '0133310',
      '0013100',
      '0001000',
    ],
    mine: [
      '0111110',
      '1222221',
      '1233321',
      '1234321',
      '1233321',
      '1222221',
      '0111110',
    ],
    frost: [
      '1000001',
      '0122210',
      '0132310',
      '1233321',
      '0132310',
      '0122210',
      '1000001',
    ],
    sniper: [
      '0011100',
      '0122210',
      '0123210',
      '1123211',
      '0123210',
      '0122210',
      '0011100',
    ],
  },
  enemies: {
    grunt: [
      '0001000',
      '0011100',
      '0122210',
      '1223221',
      '0122210',
      '0011100',
      '0001000',
    ],
    brute: [
      '0111110',
      '1233321',
      '1233321',
      '1244421',
      '1233321',
      '1211121',
      '0110110',
    ],
    balanced: [
      '0011000',
      '0111100',
      '0122210',
      '1233321',
      '0122210',
      '0011000',
      '0110110',
    ],
    boss1: [
      '1111111',
      '1222221',
      '1244421',
      '1244421',
      '1233321',
      '1211121',
      '1100011',
    ],
    boss2: [
      '0313130',
      '1122211',
      '1244421',
      '1244421',
      '1233321',
      '1211121',
      '0110110',
    ],
  },
};

// Palette per tower type / tier (1 = outline, 2 = body, 3 = highlight, 4 = core detail)
const TOWER_PALETTES = {
  cannon: [
    { 1: '#4a3a2a', 2: '#8a6d4a', 3: '#c9a66b', 4: '#3a2a1a' },
    { 1: '#3a3a3a', 2: '#8f9aa3', 3: '#d6dde2', 4: '#2a2a2a' },
    { 1: '#5a3a00', 2: '#d4af37', 3: '#fff2b0', 4: '#7a4b00' },
  ],
  laser: [
    { 1: '#0d3a3a', 2: '#1f8a8a', 3: '#5be6e6', 4: '#0a2a2a' },
    { 1: '#2a0d3a', 2: '#8a2ec4', 3: '#d17bff', 4: '#1a0a2a' },
    { 1: '#3a0d1e', 2: '#e0316b', 3: '#ff9ec4', 4: '#2a0a14' },
  ],
  mine: [
    { 1: '#333a1a', 2: '#6b7a3a', 3: '#a8bd5f', 4: '#222711' },
    { 1: '#4a2a10', 2: '#c9702e', 3: '#ffb066', 4: '#331d0a' },
    { 1: '#4a0f0f', 2: '#c9302e', 3: '#ff7a66', 4: '#330a0a' },
  ],
  frost: [
    { 1: '#1a3a4a', 2: '#5fb0d6', 3: '#d6f2ff', 4: '#0a1a2a' },
    { 1: '#1a2a5a', 2: '#4a6fd6', 3: '#c9d6ff', 4: '#0a1030' },
    { 1: '#1a2a3a', 2: '#e8f6ff', 3: '#ffffff', 4: '#8fd6ff' },
  ],
  sniper: [
    { 1: '#1a2a10', 2: '#3a5a2a', 3: '#8ac96b', 4: '#0d1a08' },
    { 1: '#1a1a1a', 2: '#3a3a3a', 3: '#9aa3aa', 4: '#0a0a0a' },
    { 1: '#1a1a1a', 2: '#2a2a2a', 3: '#d4af37', 4: '#000000' },
  ],
};

const ENEMY_PALETTES = {
  grunt: { 1: '#1a3a1a', 2: '#3fae3f', 3: '#8fe68f', 4: '#0d1f0d' },
  brute: { 1: '#3a1a10', 2: '#8a4a2a', 3: '#c98a5f', 4: '#2a0f0a' },
  balanced: { 1: '#3a3a10', 2: '#c9b02e', 3: '#f0dc7b', 4: '#2a2508' },
  boss1: { 1: '#2a2a2a', 2: '#6b6b6b', 3: '#9aa3aa', 4: '#ffb84d' },
  boss2: { 1: '#0a0010', 2: '#3a1050', 3: '#c060ff', 4: '#ff2a4a' },
};

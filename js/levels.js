// Level definitions: grid path (as turn waypoints), gold, enemy pool, wave count, boss.
// Waypoints are {c, r} grid coordinates (col, row). Rows only increase (simple snake),
// so path segments never self-intersect.

function expandWaypoints(waypoints) {
  const cells = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i], b = waypoints[i + 1];
    if (a.c === b.c) {
      const step = b.r > a.r ? 1 : -1;
      for (let r = a.r; r !== b.r; r += step) cells.push({ c: a.c, r });
    } else {
      const step = b.c > a.c ? 1 : -1;
      for (let c = a.c; c !== b.c; c += step) cells.push({ c, r: a.r });
    }
  }
  cells.push(waypoints[waypoints.length - 1]);
  return cells;
}

function waypointsToPixels(waypoints) {
  const t = CONFIG.TILE;
  return waypoints.map(p => ({ x: p.c * t + t / 2, y: p.r * t + t / 2 }));
}

// Small deterministic RNG so wave composition is stable across runs of the same level.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RAW_LEVELS = [
  { id: 1, name: 'Waldrand', startGold: 150, enemyPool: ['grunt'], waveCount: 5,
    waypoints: [{c:0,r:1},{c:8,r:1},{c:8,r:4},{c:0,r:4},{c:0,r:7},{c:8,r:7},{c:8,r:10},{c:0,r:10},{c:0,r:13}] },
  { id: 2, name: 'Flusstal', startGold: 170, enemyPool: ['grunt', 'balanced'], waveCount: 6,
    waypoints: [{c:8,r:0},{c:1,r:0},{c:1,r:3},{c:7,r:3},{c:7,r:6},{c:2,r:6},{c:2,r:9},{c:6,r:9},{c:6,r:13}] },
  { id: 3, name: 'Bergpfad', startGold: 190, enemyPool: ['grunt', 'balanced', 'brute'], waveCount: 6,
    waypoints: [{c:0,r:0},{c:8,r:0},{c:8,r:2},{c:0,r:2},{c:0,r:5},{c:8,r:5},{c:8,r:8},{c:0,r:8},{c:0,r:11},{c:8,r:11},{c:8,r:13}] },
  { id: 4, name: 'Torfeste', startGold: 220, enemyPool: ['grunt', 'balanced', 'brute'], waveCount: 6, boss: 'boss1',
    waypoints: [{c:0,r:0},{c:5,r:0},{c:5,r:3},{c:2,r:3},{c:2,r:6},{c:8,r:6},{c:8,r:9},{c:3,r:9},{c:3,r:13}] },
  { id: 5, name: 'Nebelmoor', startGold: 240, enemyPool: ['grunt', 'balanced', 'brute'], waveCount: 7,
    waypoints: [{c:8,r:0},{c:2,r:0},{c:2,r:2},{c:7,r:2},{c:7,r:4},{c:1,r:4},{c:1,r:7},{c:6,r:7},{c:6,r:10},{c:3,r:10},{c:3,r:13}] },
  { id: 6, name: 'Frostgrat', startGold: 260, enemyPool: ['grunt', 'balanced', 'brute'], waveCount: 8,
    waypoints: [{c:0,r:0},{c:7,r:0},{c:7,r:3},{c:1,r:3},{c:1,r:5},{c:8,r:5},{c:8,r:8},{c:2,r:8},{c:2,r:11},{c:6,r:11},{c:6,r:13}] },
  { id: 7, name: 'Schattenthron', startGold: 300, enemyPool: ['grunt', 'balanced', 'brute'], waveCount: 8, boss: 'boss2',
    waypoints: [{c:4,r:0},{c:0,r:0},{c:0,r:2},{c:8,r:2},{c:8,r:4},{c:1,r:4},{c:1,r:6},{c:7,r:6},{c:7,r:8},{c:2,r:8},{c:2,r:10},{c:6,r:10},{c:6,r:13}] },
];

const LEVELS = RAW_LEVELS.map(lvl => {
  const pathCells = expandWaypoints(lvl.waypoints);
  const pathPixels = waypointsToPixels(lvl.waypoints);
  const pathSet = new Set(pathCells.map(p => p.c + ',' + p.r));
  const segLengths = [];
  const cumLen = [0];
  for (let i = 0; i < pathPixels.length - 1; i++) {
    const a = pathPixels[i], b = pathPixels[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    segLengths.push(len);
    cumLen.push(cumLen[i] + len);
  }
  const totalLength = cumLen[cumLen.length - 1];
  return { ...lvl, pathCells, pathPixels, pathSet, segLengths, cumLen, totalLength };
});

function getLevel(id) {
  return LEVELS.find(l => l.id === id);
}

// Builds the full ordered spawn list for a given wave (0-based index) of a level.
function buildWave(level, waveIndex) {
  const isFinalBossWave = level.boss && waveIndex === level.waveCount; // waves 0..waveCount-1 normal, waveCount = boss wave
  const rng = mulberry32(level.id * 1000 + waveIndex);
  const spawns = [];

  if (isFinalBossWave) {
    // A handful of escorts precede the boss for a climactic finale.
    const escortCount = 5 + level.id;
    let t = 0;
    for (let i = 0; i < escortCount; i++) {
      const type = level.enemyPool[Math.floor(rng() * level.enemyPool.length)];
      spawns.push({ type, delay: t, hpMult: 1 + level.id * 0.12, speedMult: 1 });
      t += 0.55;
    }
    spawns.push({ type: level.boss, delay: t + 1.2, hpMult: 1, speedMult: 1, isBoss: true });
    return spawns;
  }

  const w = waveIndex;
  const L = level.id;
  const count = Math.round(6 + L * 1.3 + w * 1.8);
  const hpMult = 1 + (L - 1) * 0.14 + w * 0.05;
  const speedMult = Math.min(1 + (L - 1) * 0.015 + w * 0.008, 1.5);
  const interval = Math.max(0.85 - w * 0.025 - L * 0.015, 0.32);

  // Weight later/stronger enemy types more heavily as the wave index climbs.
  const pool = level.enemyPool;
  const weights = pool.map((type, i) => 1 + w * 0.3 * i);
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  let t = 0;
  for (let i = 0; i < count; i++) {
    let roll = rng() * totalWeight;
    let type = pool[0];
    for (let j = 0; j < pool.length; j++) {
      if (roll < weights[j]) { type = pool[j]; break; }
      roll -= weights[j];
    }
    spawns.push({ type, delay: t, hpMult, speedMult });
    t += interval;
  }
  return spawns;
}

function totalWaves(level) {
  return level.boss ? level.waveCount + 1 : level.waveCount;
}

// Countdown (seconds) before a wave auto-starts if the player doesn't tap "Welle starten".
function autoStartDelay(level, waveIndex) {
  const base = 13 - level.id * 0.8 - waveIndex * 0.4;
  return Math.max(base, 5);
}

// Core game engine: state, simulation loop, rendering, and player actions.

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas.width = CONFIG.WIDTH;
    this.canvas.height = CONFIG.HEIGHT;
    this.onGameOver = null;
    this.onVictory = null;
    this.onStateChange = null;
  }

  loadLevel(levelId) {
    this.level = getLevel(levelId);
    this.gold = this.level.startGold;
    this.lives = CONFIG.START_LIVES;
    this.maxLives = CONFIG.START_LIVES;
    this.waveIndex = 0;
    this.totalWaveCount = totalWaves(this.level);
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.effects = [];
    this.spawnQueue = [];
    this.waveActive = false;
    this.waveTimer = 0;
    this.autoStartTimer = autoStartDelay(this.level, 0);
    this.time = 0;
    this.paused = false;
    this.speed = 1;
    this.selectedTowerType = null;
    this.selectedTower = null;
    this.gameOver = false;
    this.victory = false;
    this.finished = false;
  }

  isBuildable(c, r) {
    if (c < 0 || r < 0 || c >= CONFIG.COLS || r >= CONFIG.ROWS) return false;
    if (this.level.pathSet.has(c + ',' + r)) return false;
    if (this.getTowerAt(c, r)) return false;
    return true;
  }

  getTowerAt(c, r) {
    return this.towers.find(t => t.gridC === c && t.gridR === r) || null;
  }

  startWave() {
    if (this.waveActive || this.waveIndex >= this.totalWaveCount || this.finished) return;
    this.spawnQueue = buildWave(this.level, this.waveIndex);
    this.waveActive = true;
    this.waveTimer = 0;
    Audio2.waveStart();
  }

  placeTower(type, c, r) {
    if (!this.isBuildable(c, r)) { Audio2.error(); return false; }
    const cost = TOWER_TYPES[type].tiers[0].cost;
    if (this.gold < cost) { Audio2.error(); return false; }
    this.gold -= cost;
    this.towers.push(new Tower(type, c, r));
    Audio2.place();
    return true;
  }

  upgradeTower(tower) {
    if (!tower.canUpgrade()) return false;
    const cost = tower.upgradeCost();
    if (this.gold < cost) { Audio2.error(); return false; }
    this.gold -= cost;
    tower.upgrade();
    Audio2.upgrade();
    return true;
  }

  sellTower(tower) {
    this.gold += tower.sellValue();
    this.towers = this.towers.filter(t => t !== tower);
    if (this.selectedTower === tower) this.selectedTower = null;
  }

  spawnProjectile(p) { this.projectiles.push(p); }
  spawnEffect(x, y, r, color) { this.effects.push(new Effect(x, y, r, color)); }
  spawnFloatingText(x, y, text, color) { this.effects.push(new Effect(x, y, 0, color, 0.7, text)); }
  onEnemyDamaged() { /* hook reserved for future use */ }

  onEnemyKilled(e) {
    this.gold += e.bounty;
    this.spawnEffect(e.x, e.y, e.radius * 1.6, '#ffd166');
    this.spawnFloatingText(e.x, e.y, '+' + e.bounty, '#ffd166');
    Audio2.enemyDeath();
  }

  onEnemyLeaked(e) {
    this.lives = Math.max(0, this.lives - 1);
    this.spawnEffect(e.x, e.y, e.radius * 1.4, '#ff6b6b');
    Audio2.leak();
  }

  computeStars() {
    const ratio = this.lives / this.maxLives;
    if (ratio >= 0.8) return 3;
    if (ratio >= 0.4) return 2;
    return 1;
  }

  update(dt) {
    if (this.paused || this.finished) return;
    dt *= this.speed;
    this.time += dt;

    if (!this.waveActive && this.waveIndex < this.totalWaveCount) {
      this.autoStartTimer -= dt;
      if (this.autoStartTimer <= 0) this.startWave();
    }

    if (this.waveActive) {
      this.waveTimer += dt;
      while (this.spawnQueue.length && this.spawnQueue[0].delay <= this.waveTimer) {
        const s = this.spawnQueue.shift();
        this.enemies.push(new Enemy(s.type, this.level, s.hpMult, s.speedMult, s.isBoss));
      }
      if (this.spawnQueue.length === 0 && this.enemies.every(e => !e.alive)) {
        this.waveActive = false;
        this.waveIndex++;
        this.autoStartTimer = this.waveIndex < this.totalWaveCount ? autoStartDelay(this.level, this.waveIndex) : Infinity;
      }
    }

    for (const t of this.towers) t.update(dt, this.enemies, this);
    for (const e of this.enemies) e.update(dt, this.time);
    for (const p of this.projectiles) p.update(dt, this);
    this.projectiles = this.projectiles.filter(p => !p.dead);
    for (const ef of this.effects) ef.update(dt);
    this.effects = this.effects.filter(ef => !ef.dead);

    for (const e of this.enemies) {
      if (!e.alive && !e.resolved) {
        e.resolved = true;
        if (e.reachedEnd) this.onEnemyLeaked(e);
        else this.onEnemyKilled(e);
      }
    }
    this.enemies = this.enemies.filter(e => e.alive);

    if (this.lives <= 0 && !this.gameOver) {
      this.gameOver = true;
      this.finished = true;
      Audio2.defeat();
      if (this.onGameOver) this.onGameOver();
    } else if (!this.victory && !this.gameOver && this.waveIndex >= this.totalWaveCount &&
               this.enemies.length === 0 && !this.waveActive && this.spawnQueue.length === 0) {
      this.victory = true;
      this.finished = true;
      const stars = this.computeStars();
      Storage.reportResult(this.level.id, stars);
      Audio2.victory();
      if (this.onVictory) this.onVictory(stars);
    }
  }

  render() {
    const ctx = this.ctx;
    const { COLS, ROWS, TILE } = CONFIG;
    ctx.clearRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

    // background grass checker
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? COLORS.grass1 : COLORS.grass2;
        ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
      }
    }

    // path
    for (const cell of this.level.pathCells) {
      ctx.fillStyle = (cell.c + cell.r) % 2 === 0 ? COLORS.path1 : COLORS.path2;
      ctx.fillRect(cell.c * TILE, cell.r * TILE, TILE, TILE);
    }
    ctx.strokeStyle = COLORS.pathEdge;
    ctx.lineWidth = 2;
    for (const cell of this.level.pathCells) {
      ctx.strokeRect(cell.c * TILE + 1, cell.r * TILE + 1, TILE - 2, TILE - 2);
    }

    // buildable highlight while placing
    if (this.selectedTowerType) {
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (this.isBuildable(c, r)) {
            ctx.fillStyle = COLORS.buildHighlight;
            ctx.fillRect(c * TILE + 3, r * TILE + 3, TILE - 6, TILE - 6);
          }
        }
      }
    }

    // base marker (castle) at final waypoint
    const endPt = this.level.pathPixels[this.level.pathPixels.length - 1];
    ctx.fillStyle = '#7a6a55';
    ctx.fillRect(endPt.x - TILE * 0.55, endPt.y - TILE * 0.55, TILE * 1.1, TILE * 1.1);
    ctx.fillStyle = '#a89474';
    ctx.fillRect(endPt.x - TILE * 0.4, endPt.y - TILE * 0.4, TILE * 0.8, TILE * 0.8);
    ctx.fillStyle = '#5a4a38';
    for (let i = -1; i <= 1; i++) {
      ctx.fillRect(endPt.x + i * TILE * 0.3 - 4, endPt.y - TILE * 0.62, 8, 8);
    }

    // spawn marker
    const startPt = this.level.pathPixels[0];
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(startPt.x, startPt.y, TILE * 0.5, 0, Math.PI * 2);
    ctx.fill();

    for (const t of this.towers) t.draw(ctx, t === this.selectedTower);
    for (const e of this.enemies) e.draw(ctx);
    for (const p of this.projectiles) p.draw(ctx);
    for (const ef of this.effects) ef.draw(ctx);
  }

  getCanvasPos(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = CONFIG.WIDTH / rect.width;
    const scaleY = CONFIG.HEIGHT / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }

  handleTap(clientX, clientY) {
    const pos = this.getCanvasPos(clientX, clientY);
    const c = Math.floor(pos.x / CONFIG.TILE);
    const r = Math.floor(pos.y / CONFIG.TILE);
    if (c < 0 || r < 0 || c >= CONFIG.COLS || r >= CONFIG.ROWS) return;

    if (this.selectedTowerType) {
      const type = this.selectedTowerType;
      this.selectedTowerType = null;
      this.placeTower(type, c, r);
      if (this.onStateChange) this.onStateChange();
      return;
    }
    const existing = this.getTowerAt(c, r);
    if (existing) {
      this.selectedTower = existing;
      if (this.onStateChange) this.onStateChange('towerSelected');
    }
  }
}

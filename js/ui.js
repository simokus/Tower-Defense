// Screen management, HUD, tower panel and touch input wiring.
const UI = {
  game: null,
  currentScreen: 'menu',

  init(game) {
    this.game = game;
    game.onGameOver = () => this.showResult(false, 0);
    game.onVictory = (stars) => this.showResult(true, stars);
    game.onStateChange = (reason) => {
      if (reason === 'towerSelected' && game.selectedTower) this.openTowerModal(game.selectedTower);
      this.refreshTowerButtons();
    };

    this.$ = (id) => document.getElementById(id);

    this.$('btn-play').addEventListener('click', () => { this.buildLevelGrid(); this.showScreen('levels'); });
    this.$('btn-howto').addEventListener('click', () => this.showScreen('howto'));
    this.$('btn-howto-back').addEventListener('click', () => this.showScreen('menu'));
    this.$('btn-levels-back').addEventListener('click', () => this.showScreen('menu'));
    this.$('btn-reset').addEventListener('click', () => {
      if (confirm('Gesamten Spielfortschritt wirklich löschen?')) {
        Storage.reset();
        this.buildLevelGrid();
      }
    });

    this.$('btn-pause').addEventListener('click', () => this.togglePause());
    this.$('btn-resume').addEventListener('click', () => this.togglePause());
    this.$('btn-quit').addEventListener('click', () => {
      this.$('pause-overlay').classList.add('hidden');
      game.paused = false;
      this.buildLevelGrid();
      this.showScreen('levels');
    });
    this.$('btn-speed').addEventListener('click', () => {
      game.speed = game.speed === 1 ? 2 : 1;
      this.$('btn-speed').classList.toggle('active-speed', game.speed === 2);
      this.$('btn-speed').textContent = 'x' + game.speed;
    });
    this.$('btn-start-wave').addEventListener('click', () => game.startWave());

    this.$('tm-close').addEventListener('click', () => this.closeTowerModal());
    this.$('tm-upgrade').addEventListener('click', () => {
      if (game.selectedTower) {
        game.upgradeTower(game.selectedTower);
        this.openTowerModal(game.selectedTower);
      }
    });
    this.$('tm-sell').addEventListener('click', () => {
      if (game.selectedTower) {
        game.sellTower(game.selectedTower);
        this.closeTowerModal();
      }
    });

    this.$('btn-retry').addEventListener('click', () => this.startLevel(game.level.id));
    this.$('btn-next').addEventListener('click', () => this.startLevel(game.level.id + 1));
    this.$('btn-result-levels').addEventListener('click', () => { this.buildLevelGrid(); this.showScreen('levels'); });

    const canvas = this.$('game-canvas');
    const tapHandler = (e) => {
      e.preventDefault();
      Audio2.unlock();
      const point = e.changedTouches ? e.changedTouches[0] : e;
      game.handleTap(point.clientX, point.clientY);
    };
    canvas.addEventListener('pointerdown', tapHandler);

    document.addEventListener('pointerdown', () => Audio2.unlock(), { once: true });

    this.buildTowerButtons();
    this.showScreen('menu');
  },

  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    this.$('screen-' + id).classList.add('active');
    this.currentScreen = id;
  },

  buildLevelGrid() {
    const container = this.$('level-grid');
    container.innerHTML = '';
    LEVELS.forEach(lvl => {
      const unlocked = Storage.isUnlocked(lvl.id);
      const stars = Storage.getStars(lvl.id);
      const btn = document.createElement('button');
      btn.className = 'level-btn' + (lvl.boss ? ' boss' : '') + (unlocked ? '' : ' locked');
      const starStr = unlocked ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : '🔒';
      btn.innerHTML = `<div>${lvl.id}</div><div class="stars">${starStr}</div>`;
      if (unlocked) btn.addEventListener('click', () => this.startLevel(lvl.id));
      container.appendChild(btn);
    });
  },

  startLevel(id) {
    if (id > CONFIG.LEVEL_COUNT) { this.buildLevelGrid(); this.showScreen('levels'); return; }
    this.game.loadLevel(id);
    this.$('btn-speed').textContent = 'x1';
    this.$('btn-speed').classList.remove('active-speed');
    this.refreshTowerButtons();
    this.showScreen('game');
  },

  buildTowerButtons() {
    const container = this.$('tower-buttons');
    container.innerHTML = '';
    TOWER_ORDER.forEach(type => {
      const def = TOWER_TYPES[type];
      const btn = document.createElement('button');
      btn.className = 'tower-btn';
      btn.dataset.type = type;
      const canvas = document.createElement('canvas');
      canvas.width = 32; canvas.height = 32;
      const ctx = canvas.getContext('2d');
      drawBlockSprite(ctx, def.shape, def.palettes[0], 1, 1, 30, 30);
      btn.appendChild(canvas);
      const cost = document.createElement('div');
      cost.className = 't-cost';
      cost.textContent = def.tiers[0].cost;
      btn.appendChild(cost);
      btn.addEventListener('click', () => this.selectTowerType(type));
      container.appendChild(btn);
    });
  },

  selectTowerType(type) {
    const game = this.game;
    game.selectedTower = null;
    game.selectedTowerType = (game.selectedTowerType === type) ? null : type;
    this.refreshTowerButtons();
  },

  refreshTowerButtons() {
    const game = this.game;
    document.querySelectorAll('.tower-btn').forEach(btn => {
      const type = btn.dataset.type;
      const cost = TOWER_TYPES[type].tiers[0].cost;
      btn.classList.toggle('selected', game.selectedTowerType === type);
      btn.disabled = game.gold < cost;
    });
  },

  openTowerModal(tower) {
    const stats = tower.stats;
    this.$('tm-name').textContent = `${tower.def.name} — Stufe ${tower.tier + 1}`;
    let statHtml = `Schaden: ${Math.round(stats.damage)}${tower.def.beam ? '/s' : ''}<br>Reichweite: ${stats.range.toFixed(1)}`;
    if (!tower.def.beam) statHtml += `<br>Feuerrate: ${stats.fireRate.toFixed(2)}/s`;
    if (tower.def.splash) statHtml += `<br>Splash-Radius: ${tower.def.splash[tower.tier]}`;
    if (tower.def.slow) statHtml += `<br>Verlangsamung: ${Math.round((1 - tower.def.slow[tower.tier].factor) * 100)}%`;
    this.$('tm-stats').innerHTML = statHtml;

    const upgradeBtn = this.$('tm-upgrade');
    if (tower.canUpgrade()) {
      upgradeBtn.textContent = `Upgrade (${tower.upgradeCost()} Gold)`;
      upgradeBtn.disabled = this.game.gold < tower.upgradeCost();
    } else {
      upgradeBtn.textContent = 'Maximale Stufe';
      upgradeBtn.disabled = true;
    }
    this.$('tm-sell').textContent = `Verkaufen (+${tower.sellValue()} Gold)`;

    this.$('tower-modal').classList.remove('hidden');
  },

  closeTowerModal() {
    this.$('tower-modal').classList.add('hidden');
    this.game.selectedTower = null;
  },

  togglePause() {
    const game = this.game;
    game.paused = !game.paused;
    this.$('pause-overlay').classList.toggle('hidden', !game.paused);
  },

  showResult(victory, stars) {
    this.showScreen('result');
    const game = this.game;
    this.$('result-title').textContent = victory ? 'Sieg!' : 'Niederlage!';
    const starsEl = this.$('result-stars');
    if (victory) {
      starsEl.innerHTML = '★'.repeat(stars) + '<span style="opacity:0.3">' + '★'.repeat(3 - stars) + '</span>';
    } else {
      starsEl.innerHTML = '<span style="opacity:0.3">★★★</span>';
    }
    this.$('result-stats').textContent = `Verbleibende Leben: ${game.lives}/${game.maxLives}  •  Gold: ${game.gold}`;
    const nextBtn = this.$('btn-next');
    nextBtn.style.display = (victory && game.level.id < CONFIG.LEVEL_COUNT) ? '' : 'none';
  },

  updateHud() {
    const game = this.game;
    if (!game.level) return;
    this.$('hud-lives').querySelector('span').textContent = game.lives;
    this.$('hud-gold').querySelector('span').textContent = game.gold;
    const waveNum = Math.min(game.waveIndex + (game.waveActive ? 1 : 0), game.totalWaveCount);
    this.$('hud-wave').querySelector('span').textContent = `${waveNum}/${game.totalWaveCount}`;

    const waveBtn = this.$('btn-start-wave');
    if (game.waveActive) {
      waveBtn.disabled = true;
      waveBtn.textContent = 'Welle läuft...';
    } else if (game.waveIndex >= game.totalWaveCount) {
      waveBtn.disabled = true;
      waveBtn.textContent = 'Alle Wellen abgeschlossen';
    } else {
      waveBtn.disabled = false;
      waveBtn.textContent = `Welle starten (${Math.max(0, Math.ceil(game.autoStartTimer))}s)`;
    }
    this.refreshTowerButtons();
  },
};

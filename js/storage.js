// LocalStorage progress persistence
const Storage = {
  _default() {
    return { unlocked: 1, stars: {} };
  },

  load() {
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
      if (!raw) return this._default();
      const data = JSON.parse(raw);
      if (!data || typeof data.unlocked !== 'number') return this._default();
      return { unlocked: data.unlocked, stars: data.stars || {} };
    } catch (e) {
      return this._default();
    }
  },

  save(data) {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
    } catch (e) { /* ignore quota / private-mode errors */ }
  },

  isUnlocked(levelId) {
    const data = this.load();
    return levelId <= data.unlocked;
  },

  getStars(levelId) {
    const data = this.load();
    return data.stars[levelId] || 0;
  },

  reportResult(levelId, stars) {
    const data = this.load();
    if (stars > (data.stars[levelId] || 0)) {
      data.stars[levelId] = stars;
    }
    if (levelId === data.unlocked && levelId < CONFIG.LEVEL_COUNT) {
      data.unlocked = levelId + 1;
    }
    this.save(data);
  },

  reset() {
    localStorage.removeItem(CONFIG.STORAGE_KEY);
  },
};

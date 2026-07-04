// Minimal WebAudio-based sound effects (no external assets needed)
const Audio2 = {
  ctx: null,

  _ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  },

  unlock() {
    this._ensure();
  },

  _tone(freq, duration, type = 'square', gainStart = 0.15, freqEnd = null) {
    const ctx = this._ensure();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (freqEnd !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), ctx.currentTime + duration);
    }
    gain.gain.setValueAtTime(gainStart, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  },

  shoot(kind) {
    switch (kind) {
      case 'sniper': this._tone(900, 0.12, 'sawtooth', 0.12, 300); break;
      case 'mine': this._tone(160, 0.18, 'square', 0.16, 60); break;
      case 'frost': this._tone(700, 0.08, 'sine', 0.1, 500); break;
      case 'laser': this._tone(1200, 0.05, 'sawtooth', 0.05, 900); break;
      default: this._tone(500, 0.08, 'square', 0.12, 200);
    }
  },

  hit() {
    this._tone(200, 0.08, 'square', 0.08, 80);
  },

  explosion() {
    this._tone(120, 0.25, 'sawtooth', 0.18, 30);
  },

  enemyDeath() {
    this._tone(400, 0.15, 'triangle', 0.12, 100);
  },

  coin() {
    this._tone(900, 0.08, 'square', 0.08, 1400);
  },

  place() {
    this._tone(500, 0.1, 'sine', 0.1, 700);
  },

  upgrade() {
    this._tone(500, 0.1, 'sine', 0.12, 900);
    setTimeout(() => this._tone(800, 0.12, 'sine', 0.12, 1200), 90);
  },

  error() {
    this._tone(150, 0.15, 'square', 0.1, 100);
  },

  waveStart() {
    this._tone(300, 0.15, 'triangle', 0.12, 600);
  },

  leak() {
    this._tone(220, 0.2, 'sawtooth', 0.14, 80);
  },

  victory() {
    [523, 659, 784, 1046].forEach((f, i) => {
      setTimeout(() => this._tone(f, 0.2, 'triangle', 0.14), i * 120);
    });
  },

  defeat() {
    [400, 300, 200, 120].forEach((f, i) => {
      setTimeout(() => this._tone(f, 0.3, 'sawtooth', 0.14), i * 150);
    });
  },
};

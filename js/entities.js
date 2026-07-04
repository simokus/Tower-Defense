// Enemy, Tower, Projectile and visual Effect classes.

class Enemy {
  constructor(typeKey, level, hpMult, speedMult, isBoss) {
    this.typeKey = typeKey;
    this.def = ENEMY_TYPES[typeKey];
    this.level = level;
    this.maxHp = Math.round(this.def.baseHp * hpMult);
    this.hp = this.maxHp;
    this.baseSpeed = this.def.speed * speedMult * CONFIG.TILE; // px/sec
    this.slowFactor = 1;
    this.slowExpire = 0;
    this.segIndex = 0;
    this.distanceTravelled = 0;
    const p0 = level.pathPixels[0];
    this.x = p0.x;
    this.y = p0.y;
    this.radius = this.def.radius * CONFIG.TILE;
    this.bounty = Math.round(this.def.bounty * (0.85 + hpMult * 0.15));
    this.alive = true;
    this.reachedEnd = false;
    this.isBoss = isBoss || this.def.isBoss;
    this.specialTimer = this.def.special === 'speedBoost' ? 8 : (this.def.special === 'heal' ? 10 : 0);
    this.boostUntil = 0;
    this.enraged = false;
    this.hitFlash = 0;
  }

  get progress() {
    return this.level.totalLength > 0 ? this.distanceTravelled / this.level.totalLength : 0;
  }

  applySlow(factor, duration, now) {
    if (now + duration >= this.slowExpire || factor < this.slowFactor) {
      this.slowFactor = factor;
      this.slowExpire = now + duration;
    }
  }

  currentSpeed(now) {
    let speed = this.baseSpeed;
    if (now < this.slowExpire) speed *= this.slowFactor;
    if (now < this.boostUntil) speed *= 1.8;
    return speed;
  }

  updateSpecial(dt, now) {
    if (this.def.special === 'speedBoost') {
      this.specialTimer -= dt;
      if (this.specialTimer <= 0) {
        this.boostUntil = now + 3;
        this.specialTimer = 8;
      }
    } else if (this.def.special === 'heal') {
      this.specialTimer -= dt;
      if (this.specialTimer <= 0) {
        this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.04);
        this.specialTimer = 10;
      }
      if (!this.enraged && this.hp <= this.maxHp * 0.3) {
        this.enraged = true;
        this.baseSpeed *= 1.4;
      }
    }
  }

  update(dt, now) {
    if (!this.alive) return;
    this.updateSpecial(dt, now);
    if (this.hitFlash > 0) this.hitFlash -= dt;
    let remaining = this.currentSpeed(now) * dt;
    const pts = this.level.pathPixels;
    while (remaining > 0 && this.segIndex < pts.length - 1) {
      const a = pts[this.segIndex], b = pts[this.segIndex + 1];
      const segLen = this.level.segLengths[this.segIndex];
      const dx = b.x - a.x, dy = b.y - a.y;
      const travelledOnSeg = segLen > 0 ? Math.hypot(this.x - a.x, this.y - a.y) : 0;
      const remainingOnSeg = segLen - travelledOnSeg;
      if (remaining < remainingOnSeg) {
        const t = (travelledOnSeg + remaining) / segLen;
        this.x = a.x + dx * t;
        this.y = a.y + dy * t;
        this.distanceTravelled += remaining;
        remaining = 0;
      } else {
        this.x = b.x; this.y = b.y;
        this.distanceTravelled += remainingOnSeg;
        remaining -= remainingOnSeg;
        this.segIndex++;
      }
    }
    if (this.segIndex >= pts.length - 1) {
      this.reachedEnd = true;
      this.alive = false;
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.hitFlash = 0.08;
    if (this.hp <= 0 && this.alive) {
      this.hp = 0;
      this.alive = false;
      this.killed = true;
    }
  }

  draw(ctx) {
    const size = this.radius * 2.3;
    drawBlockSprite(ctx, this.def.shape, this.def.palette, this.x - size / 2, this.y - size / 2, size, size);
    if (this.hitFlash > 0) {
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(this.x - size / 2, this.y - size / 2, size, size);
      ctx.globalAlpha = 1;
    }
    // health bar
    const barW = size, barH = this.isBoss ? 6 : 4;
    const bx = this.x - barW / 2, by = this.y - size / 2 - barH - 4;
    ctx.fillStyle = COLORS.hpBack;
    ctx.fillRect(bx, by, barW, barH);
    const pct = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = pct > 0.3 ? COLORS.hpFill : COLORS.hpFillLow;
    ctx.fillRect(bx, by, barW * pct, barH);
  }
}

class Projectile {
  constructor(tower, target, opts) {
    this.tower = tower;
    this.target = target;
    this.x = tower.x;
    this.y = tower.y;
    this.damage = opts.damage;
    this.speed = opts.speed;
    this.color = opts.color;
    this.splashRadius = opts.splashRadius || 0;
    this.slow = opts.slow || null;
    this.dead = false;
    this.targetLastX = target.x;
    this.targetLastY = target.y;
  }

  update(dt, game) {
    if (this.target && this.target.alive) {
      this.targetLastX = this.target.x;
      this.targetLastY = this.target.y;
    }
    const dx = this.targetLastX - this.x, dy = this.targetLastY - this.y;
    const dist = Math.hypot(dx, dy);
    const step = this.speed * dt;
    if (dist <= step || dist === 0) {
      this.hit(game);
      this.dead = true;
      return;
    }
    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
  }

  hit(game) {
    const now = game.time;
    if (this.splashRadius > 0) {
      const r = this.splashRadius * CONFIG.TILE;
      for (const e of game.enemies) {
        if (!e.alive) continue;
        if (Math.hypot(e.x - this.targetLastX, e.y - this.targetLastY) <= r) {
          e.takeDamage(this.damage);
          game.onEnemyDamaged(e);
        }
      }
      game.spawnEffect(this.targetLastX, this.targetLastY, r, '#ffb066');
      Audio2.explosion();
    } else {
      if (this.target && this.target.alive) {
        this.target.takeDamage(this.damage);
        if (this.slow) this.target.applySlow(this.slow.factor, this.slow.duration, now);
        game.onEnemyDamaged(this.target);
      }
      Audio2.hit();
    }
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

class Effect {
  constructor(x, y, maxRadius, color, life = 0.35, text = null) {
    this.x = x; this.y = y;
    this.maxRadius = maxRadius;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.text = text;
  }
  update(dt) { this.life -= dt; }
  get dead() { return this.life <= 0; }
  draw(ctx) {
    const t = 1 - Math.max(0, this.life / this.maxLife);
    if (this.text) {
      ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
      ctx.fillStyle = this.color;
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.text, this.x, this.y - t * 20);
      ctx.globalAlpha = 1;
      return;
    }
    ctx.globalAlpha = Math.max(0, 1 - t) * 0.6;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.maxRadius * t, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

class Tower {
  constructor(type, gridC, gridR) {
    this.type = type;
    this.def = TOWER_TYPES[type];
    this.tier = 0;
    this.gridC = gridC;
    this.gridR = gridR;
    this.x = gridC * CONFIG.TILE + CONFIG.TILE / 2;
    this.y = gridR * CONFIG.TILE + CONFIG.TILE / 2;
    this.cooldown = 0;
    this.angle = -Math.PI / 2;
    this.target = null;
    this.totalInvested = this.def.tiers[0].cost;
    this.beamOn = false;
  }

  get stats() { return this.def.tiers[this.tier]; }
  get rangePx() { return this.stats.range * CONFIG.TILE; }

  canUpgrade() { return this.tier < this.def.tiers.length - 1; }
  upgradeCost() { return this.canUpgrade() ? this.def.tiers[this.tier + 1].cost : 0; }

  upgrade() {
    if (!this.canUpgrade()) return false;
    this.tier++;
    this.totalInvested += this.stats.cost;
    return true;
  }

  sellValue() {
    return Math.round(this.totalInvested * CONFIG.SELL_REFUND_RATIO);
  }

  acquireTarget(enemies, now) {
    if (this.target && this.target.alive) {
      const d = Math.hypot(this.target.x - this.x, this.target.y - this.y);
      if (d <= this.rangePx) return;
    }
    let best = null, bestProgress = -1;
    for (const e of enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(e.x - this.x, e.y - this.y);
      if (d <= this.rangePx && e.progress > bestProgress) {
        best = e; bestProgress = e.progress;
      }
    }
    this.target = best;
  }

  update(dt, enemies, game) {
    this.acquireTarget(enemies, game.time);
    this.beamOn = false;
    if (this.target) {
      const desired = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      let diff = desired - this.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.angle += diff * Math.min(1, dt * 10);
    }
    if (this.cooldown > 0) this.cooldown -= dt;

    if (this.def.beam) {
      if (this.target) {
        this.beamOn = true;
        this.target.takeDamage(this.stats.damage * dt);
        game.onEnemyDamaged(this.target);
      }
      return;
    }

    if (this.target && this.cooldown <= 0) {
      const palette = this.def.projectileColor;
      const color = palette ? palette[this.tier] : '#ffffff';
      const opts = { damage: this.stats.damage, speed: CONFIG.TILE * 9, color };
      if (this.def.splash) opts.splashRadius = this.def.splash[this.tier];
      if (this.def.slow) opts.slow = this.def.slow[this.tier];
      game.spawnProjectile(new Projectile(this, this.target, opts));
      Audio2.shoot(this.def.sound);
      this.cooldown = 1 / this.stats.fireRate;
    }
  }

  draw(ctx, selected) {
    if (selected) {
      ctx.strokeStyle = COLORS.rangeCircle;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.rangePx, 0, Math.PI * 2);
      ctx.stroke();
    }
    const palette = this.def.palettes[this.tier];
    const size = CONFIG.TILE * 0.9;
    // barrel (drawn under body for cannon/mine/frost/sniper, replaced by beam for laser)
    if (!this.def.beam) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      const barrelLen = this.type === 'sniper' ? size * 0.75 : size * 0.45;
      ctx.fillStyle = palette[1];
      ctx.fillRect(0, -3, barrelLen, 6);
      ctx.restore();
    }
    drawBlockSprite(ctx, this.def.shape, palette, this.x - size / 2, this.y - size / 2, size, size);
    if (this.def.beam && this.beamOn && this.target) {
      ctx.strokeStyle = palette[3];
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.target.x, this.target.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}

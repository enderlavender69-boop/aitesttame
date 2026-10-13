export class Particle {
  constructor(id, x, y, type, color, size, vx = 0, vy = 0, life = 1) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.type = type;
    this.color = color;
    this.size = size;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.gravity = type === 'ember' ? -20 : 0;
  }

  update(deltaTime) {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.vy += this.gravity * deltaTime;
    this.life -= deltaTime;
    return this.life <= 0;
  }

  getState() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      type: this.type,
      color: this.color,
      size: this.size,
      life: this.life,
      maxLife: this.maxLife,
    };
  }
}

export class DamageNumber {
  constructor(id, x, y, damage, color = '#ff0') {
    this.id = id;
    this.x = x;
    this.y = y;
    this.damage = damage;
    this.color = color;
    this.age = 0;
    this.maxAge = 1.5;
  }

  update(deltaTime) {
    this.age += deltaTime;
    return this.age >= this.maxAge;
  }

  getState() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      damage: this.damage,
      color: this.color,
      age: this.age,
      maxAge: this.maxAge,
    };
  }
}

export class XPOrb {
  constructor(id, x, y, value) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.value = value;
    this.age = 0;
    this.maxAge = 10;
    this.collected = false;
  }

  update(deltaTime, players) {
    this.age += deltaTime;

    for (const player of players.values()) {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= player.radius + 30) {
        this.collected = true;
        return player.id;
      }
    }

    if (this.age >= this.maxAge) {
      return 'expired';
    }
    return null;
  }

  getState() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      value: this.value,
      age: this.age,
      maxAge: this.maxAge,
    };
  }
}
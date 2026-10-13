export class Projectile {
  constructor(id, x, y, vx, vy, damage, ownerId, sourceId, type = 'arrow') {
    this.id = id;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.ownerId = ownerId;
    this.sourceId = sourceId;
    this.type = type;
    this.life = 3;
    this.radius = 4;
  }

  update(deltaTime, worldWidth, worldHeight, entities) {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.life -= deltaTime;

    if (this.life <= 0) {
      return true;
    }

    if (this.x < 0 || this.x > worldWidth || this.y < 0 || this.y > worldHeight) {
      return true;
    }

    for (const entity of entities.values()) {
      if (entity.id === this.ownerId) continue;
      if (entity.id === this.sourceId) continue;
      if (entity.hp === undefined) continue;

      const dx = entity.x - this.x;
      const dy = entity.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= this.radius + (entity.radius || 10)) {
        if (entity.takeDamage) {
          entity.takeDamage(this.damage, this.ownerId);
        } else {
          entity.hp = Math.max(0, entity.hp - this.damage);
        }
        return true;
      }
    }

    return false;
  }

  getState() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      type: this.type,
      damage: this.damage,
      ownerId: this.ownerId,
    };
  }
}
import { Balance } from '../data/balance.js';

export class Structure {
  constructor(id, type, x, y, ownerId, rotation = 0) {
    this.id = id;
    this.type = type;
    this.x = x;
    this.y = y;
    this.ownerId = ownerId;
    this.rotation = rotation;
    const config = Balance.structures[type];
    this.hp = config.maxHp;
    this.maxHp = config.maxHp;
    this.buildProgress = 1;
    this.isBuilt = true;
    this.lastDamageTime = 0;
    this.goldGenerated = 0;
    this.goldGenerationRate = type === 'windmill' ? 1 : 0;
    this.goldGenerationTimer = 0;
  }

  takeDamage(amount, attackerId) {
    this.hp = Math.max(0, this.hp - amount);
    this.lastDamageTime = Date.now();
    return this.hp <= 0;
  }

  update(deltaTime) {
    if (this.type === 'windmill' && this.isBuilt) {
      this.goldGenerationTimer += deltaTime;
      if (this.goldGenerationTimer >= 10) {
        this.goldGenerated += this.goldGenerationRate;
        this.goldGenerationTimer = 0;
      }
    }
  }

  getState() {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      ownerId: this.ownerId,
      rotation: this.rotation,
      hp: this.hp,
      maxHp: this.maxHp,
      isBuilt: this.isBuilt,
      buildProgress: this.buildProgress,
      goldGenerated: this.goldGenerated,
    };
  }
}

export class Wall extends Structure {
  constructor(id, x, y, ownerId, rotation = 0) {
    super(id, 'wall', x, y, ownerId, rotation);
  }
}

export class Spike extends Structure {
  constructor(id, x, y, ownerId, rotation = 0) {
    super(id, 'spike', x, y, ownerId, rotation);
    this.damage = Balance.structures.spike.damage;
    this.damageCooldown = Balance.structures.spike.damageCooldown;
    this.lastDamageTime = 0;
  }
}

export class Turret extends Structure {
  constructor(id, x, y, ownerId, rotation = 0) {
    super(id, 'turret', x, y, ownerId, rotation);
    this.range = 300;
    this.fireRate = 1.5;
    this.fireTimer = 0;
    this.projectileSpeed = 400;
    this.projectileDamage = 25;
    this.target = null;
  }

  update(deltaTime, entities) {
    super.update(deltaTime);
    this.fireTimer -= deltaTime;

    if (this.fireTimer <= 0) {
      this.target = this.findTarget(entities);
      if (this.target) {
        this.fireTimer = this.fireRate;
        return this.createProjectile();
      }
    }
    return null;
  }

  findTarget(entities) {
    let closest = null;
    let closestDist = this.range;

    for (const entity of entities.values()) {
      if (entity.id === this.ownerId) continue;
      if (entity.type === 'player' || entity.type === 'animal') {
        const dx = entity.x - this.x;
        const dy = entity.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < closestDist) {
          closestDist = dist;
          closest = entity;
        }
      }
    }
    return closest;
  }

  createProjectile() {
    if (!this.target) return null;
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const angle = Math.atan2(dy, dx);
    return {
      id: `proj_${Date.now()}_${Math.random()}`,
      x: this.x + Math.cos(angle) * 25,
      y: this.y + Math.sin(angle) * 25,
      vx: Math.cos(angle) * this.projectileSpeed,
      vy: Math.sin(angle) * this.projectileSpeed,
      damage: this.projectileDamage,
      ownerId: this.ownerId,
      sourceId: this.id,
      type: 'arrow',
      life: 3,
    };
  }

  getState() {
    const state = super.getState();
    state.targetId = this.target?.id || null;
    return state;
  }
}

export class Windmill extends Structure {
  constructor(id, x, y, ownerId, rotation = 0) {
    super(id, 'windmill', x, y, ownerId, rotation);
    this.goldGenerationRate = 2;
  }
}

export class Campfire extends Structure {
  constructor(id, x, y, ownerId, rotation = 0) {
    super(id, 'campfire', x, y, ownerId, rotation);
    this.healRadius = 100;
    this.healRate = 5;
    this.healTimer = 0;
  }

  update(deltaTime, entities) {
    super.update(deltaTime);
    this.healTimer -= deltaTime;
    if (this.healTimer <= 0) {
      this.healTimer = 2;
      for (const entity of entities.values()) {
        if (entity.type === 'player' && entity.ownerId === this.ownerId) {
          const dx = entity.x - this.x;
          const dy = entity.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= this.healRadius && entity.hp < entity.maxHp) {
            entity.hp = Math.min(entity.maxHp, entity.hp + this.healRate);
          }
        }
      }
    }
  }
}
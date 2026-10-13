import { Balance } from '../data/balance.js';

const PetSpecies = {
  fire_fox: {
    name: 'Fire Fox',
    element: 'fire',
    baseHp: 80,
    baseDamage: 15,
    baseSpeed: 150,
    radius: 14,
    color: '#ff6600',
    ability: 'burn',
    abilityCooldown: 3,
    abilityDesc: 'Attacks apply Burn (DoT for 3s)',
  },
  water_turtle: {
    name: 'Water Turtle',
    element: 'water',
    baseHp: 120,
    baseDamage: 10,
    baseSpeed: 80,
    radius: 18,
    color: '#0088ff',
    ability: 'slow',
    abilityCooldown: 4,
    abilityDesc: 'Attacks apply Slow (-50% speed for 2s)',
  },
  rock_golem: {
    name: 'Rock Golem',
    element: 'rock',
    baseHp: 180,
    baseDamage: 20,
    baseSpeed: 50,
    radius: 20,
    color: '#887766',
    ability: 'stun',
    abilityCooldown: 5,
    abilityDesc: 'Attacks have 25% chance to Stun for 1s',
  },
  electric_squirrel: {
    name: 'Electric Squirrel',
    element: 'electric',
    baseHp: 60,
    baseDamage: 12,
    baseSpeed: 180,
    radius: 12,
    color: '#ffcc00',
    ability: 'chain',
    abilityCooldown: 3,
    abilityDesc: 'Attacks chain to nearby enemies',
  },
  ice_wolf: {
    name: 'Ice Wolf',
    element: 'ice',
    baseHp: 90,
    baseDamage: 14,
    baseSpeed: 130,
    radius: 16,
    color: '#88ddff',
    ability: 'freeze',
    abilityCooldown: 6,
    abilityDesc: 'Attacks apply Freeze (root for 1.5s)',
  },
  poison_snake: {
    name: 'Poison Snake',
    element: 'poison',
    baseHp: 70,
    baseDamage: 8,
    baseSpeed: 140,
    radius: 13,
    color: '#88ff00',
    ability: 'poison',
    abilityCooldown: 2,
    abilityDesc: 'Attacks apply Poison (DoT for 5s, stacks)',
  },
};

export class Pet {
  constructor(id, speciesId, ownerId, x, y) {
    this.id = id;
    this.speciesId = speciesId;
    this.ownerId = ownerId;
    this.x = x;
    this.y = y;

    const species = PetSpecies[speciesId] || PetSpecies.fire_fox;
    this.name = species.name;
    this.element = species.element;
    this.maxHp = species.baseHp;
    this.hp = this.maxHp;
    this.damage = species.baseDamage;
    this.speed = species.baseSpeed;
    this.radius = species.radius;
    this.color = species.color;
    this.ability = species.ability;
    this.abilityCooldown = species.abilityCooldown;
    this.abilityDesc = species.abilityDesc;

    this.level = 1;
    this.xp = 0;
    this.xpToNext = 100;

    this.state = 'following';
    this.target = null;
    this.attackTarget = null;
    this.attackTimer = 0;
    this.abilityTimer = 0;
    this.followDistance = 50;
    this.attackRange = this.radius + 20;

    this.activeEffects = new Map();
  }

  update(deltaTime, owner, entities) {
    this.attackTimer -= deltaTime;
    this.abilityTimer -= deltaTime;

    for (const [effectId, effect] of this.activeEffects) {
      effect.remaining -= deltaTime;
      if (effect.remaining <= 0) {
        this.activeEffects.delete(effectId);
      }
    }

    if (this.state === 'following') {
      this.followOwner(owner, deltaTime);
      this.findAttackTarget(entities);
    } else if (this.state === 'attacking') {
      this.doAttack(entities, deltaTime);
    }

    this.x = Math.max(this.radius, Math.min(5000 - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(5000 - this.radius, this.y));
  }

  followOwner(owner, deltaTime) {
    if (!owner) return;

    const dx = owner.x - this.x;
    const dy = owner.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > this.followDistance) {
      const angle = Math.atan2(dy, dx);
      this.x += Math.cos(angle) * this.speed * deltaTime;
      this.y += Math.sin(angle) * this.speed * deltaTime;
    }
  }

  findAttackTarget(entities) {
    if (!this.ownerId) return;

    let closest = null;
    let closestDist = 300;

    for (const entity of entities.values()) {
      if (entity.id === this.ownerId) continue;
      if (entity.type === 'player' && entity.ownerId !== this.ownerId) {
        const dx = entity.x - this.x;
        const dy = entity.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < closestDist) {
          closestDist = dist;
          closest = entity;
        }
      } else if (entity.type === 'animal' && entity.state !== 'tamed' && entity.state !== 'dead') {
        const dx = entity.x - this.x;
        const dy = entity.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < closestDist) {
          closestDist = dist;
          closest = entity;
        }
      }
    }

    if (closest && closestDist <= this.attackRange) {
      this.state = 'attacking';
      this.attackTarget = closest;
    } else {
      this.state = 'following';
      this.attackTarget = null;
    }
  }

  doAttack(entities, deltaTime) {
    if (!this.attackTarget || this.attackTimer > 0) return;

    const target = entities.get(this.attackTarget.id);
    if (!target || (target.hp !== undefined && target.hp <= 0)) {
      this.attackTarget = null;
      this.state = 'following';
      return;
    }

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > this.attackRange + (target.radius || 0)) {
      this.attackTarget = null;
      this.state = 'following';
      return;
    }

    this.attackTimer = 1.0;

    let damage = this.damage;
    let effect = null;

    if (this.abilityTimer <= 0 && Math.random() < 0.3) {
      effect = this.triggerAbility(target);
      this.abilityTimer = this.abilityCooldown;
    }

    if (target.takeDamage) {
      target.takeDamage(damage, this.id, effect);
    } else if (target.hp !== undefined) {
      target.hp = Math.max(0, target.hp - damage);
    }

    return { targetId: target.id, damage, effect };
  }

  triggerAbility(target) {
    switch (this.ability) {
      case 'burn':
        return { type: 'burn', damage: 5, duration: 3, tickRate: 1 };
      case 'slow':
        return { type: 'slow', factor: 0.5, duration: 2 };
      case 'stun':
        return { type: 'stun', duration: 1 };
      case 'chain':
        return { type: 'chain', damage: this.damage * 0.5, range: 150 };
      case 'freeze':
        return { type: 'freeze', duration: 1.5 };
      case 'poison':
        return { type: 'poison', damage: 3, duration: 5, tickRate: 1 };
      default:
        return null;
    }
  }

  addXp(amount) {
    this.xp += amount;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.levelUp();
    }
  }

  levelUp() {
    this.level++;
    this.maxHp += 10;
    this.hp = this.maxHp;
    this.damage += 2;
    this.xpToNext = Math.floor(this.xpToNext * 1.5);
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) {
      this.state = 'dead';
    }
    return this.hp <= 0;
  }

  applyEffect(effect) {
    const effectId = `${effect.type}_${Date.now()}`;
    this.activeEffects.set(effectId, { ...effect, remaining: effect.duration });
  }

  getState() {
    return {
      id: this.id,
      speciesId: this.speciesId,
      name: this.name,
      ownerId: this.ownerId,
      x: this.x,
      y: this.y,
      radius: this.radius,
      color: this.color,
      element: this.element,
      hp: this.hp,
      maxHp: this.maxHp,
      damage: this.damage,
      level: this.level,
      xp: this.xp,
      xpToNext: this.xpToNext,
      state: this.state,
      attackTargetId: this.attackTarget?.id || null,
      ability: this.ability,
      abilityDesc: this.abilityDesc,
      activeEffects: Array.from(this.activeEffects.values()),
    };
  }
}
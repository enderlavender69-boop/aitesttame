import { Balance } from '../data/balance.js';
import { AgeTiers, LevelUpRewards, getRandomRewards, getCurrentAgeTier } from '../data/ageTiers.js';

export class Player {
  constructor(id, x, y, ws) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.ws = ws;
    this.radius = 20;
    this.baseSpeed = Balance.player.baseSpeed;
    this.speed = this.baseSpeed;
    this.color = this.generateColor();
    this.input = { up: false, down: false, left: false, right: false };
    this.direction = 0;

    this.hp = Balance.player.baseHp;
    this.maxHp = Balance.player.baseHp;
    this.lastDamageTime = 0;
    this.invulnerableTime = 0;

    this.inventory = new Inventory(Balance.player.maxInventorySlots);
    this.equippedTool = null;
    this.equippedStructure = null;

    this.gold = 0;
    this.xp = 0;
    this.level = 1;
    this.xpToNext = 100;
    this.attributePoints = 0;
    this.ageTier = 0;
    this.pendingLevelUpRewards = null;
    this.gatherSpeedMultiplier = 1;
    this.goldMultiplier = 1;

    this.activePets = [];
    this.benchedPets = [];
    this.maxActivePets = 3;
    this.maxBenchedPets = 3;

    this.pvpEnabled = false;
    this.lastAttackTime = 0;
    this.attackCooldown = 0.5;
    this.attackRange = 40;
    this.baseDamage = 10;

    this.isDead = false;
    this.respawnTimer = 0;
  }

  generateColor() {
    const hue = Math.random() * 360;
    return `hsl(${hue}, 70%, 50%)`;
  }

  update(deltaTime, worldWidth, worldHeight) {
    if (this.isDead) {
      this.respawnTimer -= deltaTime;
      if (this.respawnTimer <= 0) {
        this.respawn();
      }
      return;
    }

    this.invulnerableTime = Math.max(0, this.invulnerableTime - deltaTime);
    this.lastAttackTime += deltaTime;

    let dx = 0;
    let dy = 0;

    if (this.input.up) dy -= 1;
    if (this.input.down) dy += 1;
    if (this.input.left) dx -= 1;
    if (this.input.right) dx += 1;

    if (dx !== 0 || dy !== 0) {
      if (dx !== 0 && dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        dx /= len;
        dy /= len;
      }
      this.direction = Math.atan2(dy, dx);

      this.x += dx * this.speed * deltaTime;
      this.y += dy * this.speed * deltaTime;
    }

    this.x = Math.max(this.radius, Math.min(worldWidth - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(worldHeight - this.radius, this.y));

    this.speed = this.baseSpeed;
    if (this.equippedTool === 'axe') this.speed *= 1.0;
    if (this.equippedTool === 'pickaxe') this.speed *= 1.0;
  }

  takeDamage(amount, attackerId = null) {
    if (this.isDead || this.invulnerableTime > 0) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.lastDamageTime = Date.now();
    this.invulnerableTime = 0.3;

    if (this.hp <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  die() {
    this.isDead = true;
    this.respawnTimer = 5;

    const dropXP = Math.floor(this.xp * 0.1);
    this.xp = Math.max(0, this.xp - dropXP);

    for (const [resource, count] of this.inventory.items) {
      if (Math.random() < 0.3) {
        const dropCount = Math.floor(count * 0.5);
        this.inventory.remove(resource, dropCount);
      }
    }
  }

  respawn() {
    this.isDead = false;
    this.hp = this.maxHp;
    this.x = 2500 + (Math.random() - 0.5) * 100;
    this.y = 2500 + (Math.random() - 0.5) * 100;
    this.invulnerableTime = 2;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  addXp(amount) {
    this.xp += amount;
    while (this.xp >= this.xpToNext) {
      this.levelUp();
    }
  }

  levelUp() {
    this.level++;
    this.xp -= this.xpToNext;
    this.xpToNext = Math.floor(this.xpToNext * 1.5);
    this.attributePoints += 3;
    this.maxHp += 10;
    this.hp = this.maxHp;
    this.baseDamage += 1;

    const newTier = getCurrentAgeTier(this.level).age;
    if (newTier > this.ageTier) {
      this.ageTier = newTier;
    }

    this.pendingLevelUpRewards = getRandomRewards(3);
  }

  spendAttributePoints(attr, amount) {
    if (this.attributePoints < amount) return false;
    this.attributePoints -= amount;
    switch (attr) {
      case 'health':
        this.maxHp += amount * 10;
        this.hp = this.maxHp;
        break;
      case 'damage':
        this.baseDamage += amount * 2;
        break;
      case 'speed':
        this.baseSpeed += amount * 5;
        break;
    }
    return true;
  }

  claimLevelUpReward(rewardIndex) {
    if (!this.pendingLevelUpRewards || rewardIndex < 0 || rewardIndex >= this.pendingLevelUpRewards.length) {
      return false;
    }
    const reward = this.pendingLevelUpRewards[rewardIndex];
    const rewardKey = Object.keys(LevelUpRewards).find(k => LevelUpRewards[k].name === reward.name);
    if (rewardKey && LevelUpRewards[rewardKey].apply) {
      LevelUpRewards[rewardKey].apply(this);
    }
    this.pendingLevelUpRewards = null;
    return true;
  }

  canCarry(resource, amount) {
    return this.inventory.canAdd(resource, amount);
  }

  addToInventory(resource, amount) {
    return this.inventory.add(resource, amount);
  }

  removeFromInventory(resource, amount) {
    return this.inventory.remove(resource, amount);
  }

  hasResources(costs) {
    for (const [resource, amount] of Object.entries(costs)) {
      if (!this.inventory.has(resource, amount)) return false;
    }
    return true;
  }

  equipTool(toolId) {
    if (this.inventory.has(toolId, 1)) {
      this.equippedTool = toolId;
      return true;
    }
    return false;
  }

  equipStructure(structureId) {
    if (this.inventory.has(structureId, 1)) {
      this.equippedStructure = structureId;
      return true;
    }
    return false;
  }

  placeStructure(structureId, x, y, rotation) {
    if (!this.inventory.has(structureId, 1)) return null;
    this.inventory.remove(structureId, 1);
    return { structureId, x, y, rotation };
  }

  addPet(pet) {
    if (this.activePets.length < this.maxActivePets) {
      this.activePets.push(pet.id);
      return 'active';
    } else if (this.benchedPets.length < this.maxBenchedPets) {
      this.benchedPets.push(pet.id);
      return 'benched';
    }
    return 'full';
  }

  removePet(petId) {
    const activeIndex = this.activePets.indexOf(petId);
    if (activeIndex !== -1) {
      this.activePets.splice(activeIndex, 1);
      return true;
    }
    const benchIndex = this.benchedPets.indexOf(petId);
    if (benchIndex !== -1) {
      this.benchedPets.splice(benchIndex, 1);
      return true;
    }
    return false;
  }

  swapPet(activeIndex, benchIndex) {
    if (activeIndex >= 0 && activeIndex < this.activePets.length &&
        benchIndex >= 0 && benchIndex < this.benchedPets.length) {
      const temp = this.activePets[activeIndex];
      this.activePets[activeIndex] = this.benchedPets[benchIndex];
      this.benchedPets[benchIndex] = temp;
      return true;
    }
    return false;
  }

  attack(entities) {
    if (this.lastAttackTime < this.attackCooldown) return null;
    this.lastAttackTime = 0;

    let damage = this.baseDamage;
    if (this.equippedTool === 'axe') damage += 5;

    let closest = null;
    let closestDist = this.attackRange;

    for (const entity of entities.values()) {
      if (entity.id === this.id) continue;
      if (entity.type === 'player' && !this.pvpEnabled) continue;
      if (entity.type === 'player' && entity.pvpEnabled === false) continue;
      if (entity.hp === undefined) continue;

      const dx = entity.x - this.x;
      const dy = entity.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const targetRadius = entity.radius || 10;
      if (dist <= this.attackRange + targetRadius) {
        const angleDiff = Math.abs(this.direction - Math.atan2(dy, dx));
        if (angleDiff < Math.PI / 3 || angleDiff > Math.PI * 5 / 3) {
          if (dist < closestDist) {
            closestDist = dist;
            closest = entity;
          }
        }
      }
    }

    if (closest) {
      if (closest.takeDamage) {
        closest.takeDamage(damage, this.id);
      } else {
        closest.hp = Math.max(0, closest.hp - damage);
      }
      return { targetId: closest.id, damage };
    }
    return null;
  }

  shootProjectile(projectileClass, entities) {
    if (this.lastAttackTime < this.attackCooldown) return null;
    this.lastAttackTime = 0;

    const angle = this.direction;
    return new projectileClass(
      `proj_${Date.now()}_${Math.random()}`,
      this.x + Math.cos(angle) * 30,
      this.y + Math.sin(angle) * 30,
      Math.cos(angle) * 500,
      Math.sin(angle) * 500,
      this.baseDamage + 5,
      this.id,
      this.id,
      'arrow'
    );
  }

  getState() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      radius: this.radius,
      color: this.color,
      direction: this.direction,
      hp: this.hp,
      maxHp: this.maxHp,
      speed: this.speed,
      gold: this.gold,
      xp: this.xp,
      level: this.level,
      xpToNext: this.xpToNext,
      attributePoints: this.attributePoints,
      ageTier: this.ageTier,
      pendingLevelUpRewards: this.pendingLevelUpRewards,
      gatherSpeedMultiplier: this.gatherSpeedMultiplier,
      goldMultiplier: this.goldMultiplier,
      inventory: this.inventory.getState(),
      equippedTool: this.equippedTool,
      equippedStructure: this.equippedStructure,
      activePets: this.activePets,
      benchedPets: this.benchedPets,
      pvpEnabled: this.pvpEnabled,
      isDead: this.isDead,
      respawnTimer: this.respawnTimer,
    };
  }
}

class Inventory {
  constructor(maxSlots) {
    this.maxSlots = maxSlots;
    this.items = new Map();
    this.stackLimits = {
      wood: 999,
      stone: 999,
      food: 999,
      axe: 1,
      pickaxe: 1,
      wall: 1,
      spike: 1,
      campfire: 1,
    };
  }

  canAdd(resource, amount) {
    const current = this.items.get(resource) || 0;
    const limit = this.stackLimits[resource] || 999;
    if (current + amount > limit) return false;
    if (current === 0 && this.getUsedSlots() >= this.maxSlots) return false;
    return true;
  }

  add(resource, amount) {
    if (!this.canAdd(resource, amount)) return false;
    const current = this.items.get(resource) || 0;
    this.items.set(resource, current + amount);
    return true;
  }

  remove(resource, amount) {
    const current = this.items.get(resource) || 0;
    if (current < amount) return false;
    const remaining = current - amount;
    if (remaining <= 0) {
      this.items.delete(resource);
    } else {
      this.items.set(resource, remaining);
    }
    return true;
  }

  has(resource, amount) {
    return (this.items.get(resource) || 0) >= amount;
  }

  getCount(resource) {
    return this.items.get(resource) || 0;
  }

  getUsedSlots() {
    return this.items.size;
  }

  getState() {
    const state = {};
    for (const [resource, count] of this.items) {
      state[resource] = count;
    }
    return state;
  }
}
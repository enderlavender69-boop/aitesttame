import { Balance } from '../data/balance.js';

const AnimalTypes = {
  rabbit: { hp: 30, speed: 80, radius: 12, color: '#aaa', wanderRange: 100, tamingChance: 0.3, element: null },
  wolf: { hp: 80, speed: 120, radius: 18, color: '#666', wanderRange: 200, tamingChance: 0.15, element: null },
  bear: { hp: 150, speed: 60, radius: 25, color: '#443311', wanderRange: 150, tamingChance: 0.1, element: null },
  fire_fox: { hp: 60, speed: 150, radius: 15, color: '#ff6600', wanderRange: 250, tamingChance: 0.2, element: 'fire' },
  water_turtle: { hp: 100, speed: 50, radius: 20, color: '#0088ff', wanderRange: 100, tamingChance: 0.15, element: 'water' },
  rock_golem: { hp: 200, speed: 30, radius: 22, color: '#887766', wanderRange: 80, tamingChance: 0.08, element: 'rock' },
};

export class Animal {
  constructor(id, type, x, y) {
    this.id = id;
    this.type = type;
    this.x = x;
    this.y = y;
    const config = AnimalTypes[type] || AnimalTypes.rabbit;
    this.hp = config.hp;
    this.maxHp = config.hp;
    this.speed = config.speed;
    this.radius = config.radius;
    this.color = config.color;
    this.wanderRange = config.wanderRange;
    this.tamingChance = config.tamingChance;
    this.element = config.element;

    this.direction = Math.random() * Math.PI * 2;
    this.targetX = x;
    this.targetY = y;
    this.wanderTimer = 0;
    this.wanderInterval = 3 + Math.random() * 5;

    this.state = 'wandering';
    this.sleepTimer = 0;
    this.sleepDuration = 5 + Math.random() * 10;
    this.isSleeping = false;

    this.tameProgress = 0;
    this.tamingPlayerId = null;
    this.tameRequiredProgress = 100;

    this.lastAttackTime = 0;
    this.attackCooldown = 2;
    this.attackRange = this.radius + 10;
    this.attackDamage = 10;
  }

  update(deltaTime, worldWidth, worldHeight, players) {
    if (this.state === 'sleeping') {
      this.sleepTimer -= deltaTime;
      if (this.sleepTimer <= 0) {
        this.state = 'wandering';
        this.isSleeping = false;
        this.wanderTimer = this.wanderInterval;
      }
      return;
    }

    if (this.state === 'taming') {
      this.tameProgress += deltaTime * 10;
      if (this.tameProgress >= this.tameRequiredProgress) {
        this.state = 'tamed';
      }
      return;
    }

    if (this.state === 'tamed') {
      return;
    }

    this.wanderTimer -= deltaTime;
    if (this.wanderTimer <= 0) {
      this.pickNewWanderTarget(worldWidth, worldHeight);
      this.wanderTimer = this.wanderInterval;
    }

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 5) {
      this.direction = Math.atan2(dy, dx);
      this.x += Math.cos(this.direction) * this.speed * deltaTime;
      this.y += Math.sin(this.direction) * this.speed * deltaTime;
    }

    this.x = Math.max(this.radius, Math.min(worldWidth - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(worldHeight - this.radius, this.y));

    this.sleepTimer -= deltaTime;
    if (this.sleepTimer <= 0 && Math.random() < 0.01) {
      this.state = 'sleeping';
      this.isSleeping = true;
      this.sleepTimer = this.sleepDuration;
    }

    if (this.type === 'wolf' || this.type === 'bear' || this.element) {
      this.tryAttackPlayer(players, deltaTime);
    }
  }

  pickNewWanderTarget(worldWidth, worldHeight) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * this.wanderRange;
    this.targetX = Math.max(this.radius, Math.min(worldWidth - this.radius, this.x + Math.cos(angle) * dist));
    this.targetY = Math.max(this.radius, Math.min(worldHeight - this.radius, this.y + Math.sin(angle) * dist));
  }

  tryAttackPlayer(players, deltaTime) {
    this.lastAttackTime += deltaTime;
    if (this.lastAttackTime < this.attackCooldown) return;

    for (const player of players.values()) {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= this.attackRange + player.radius) {
        player.takeDamage(this.attackDamage);
        this.lastAttackTime = 0;

        if (this.element) {
          return {
            type: 'elemental_attack',
            element: this.element,
            targetId: player.id,
            damage: this.attackDamage,
          };
        }
        break;
      }
    }
    return null;
  }

  startTaming(playerId) {
    if (this.state !== 'wandering' && this.state !== 'sleeping') return false;
    this.state = 'taming';
    this.tamingPlayerId = playerId;
    this.tameProgress = 0;
    return true;
  }

  attemptTame(playerId) {
    if (this.tamingPlayerId !== playerId) return { success: false, reason: 'Not taming this animal' };
    if (this.state !== 'taming') return { success: false, reason: 'Not in taming state' };

    const roll = Math.random();
    const success = roll < this.tamingChance;

    if (success) {
      this.state = 'tamed';
      return { success: true, animal: this.getState() };
    } else {
      this.state = 'wandering';
      this.tamingPlayerId = null;
      this.tameProgress = 0;
      return { success: false, reason: 'Taming failed', roll, chance: this.tamingChance };
    }
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) {
      this.state = 'dead';
    }
    if (this.state === 'sleeping') {
      this.state = 'wandering';
      this.isSleeping = false;
    }
    if (this.state === 'taming') {
      this.state = 'wandering';
      this.tamingPlayerId = null;
      this.tameProgress = 0;
    }
    return this.hp <= 0;
  }

  getState() {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      radius: this.radius,
      color: this.color,
      direction: this.direction,
      hp: this.hp,
      maxHp: this.maxHp,
      state: this.state,
      isSleeping: this.isSleeping,
      element: this.element,
      tamingChance: this.tamingChance,
      tameProgress: this.tameProgress,
      tamingPlayerId: this.tamingPlayerId,
    };
  }
}
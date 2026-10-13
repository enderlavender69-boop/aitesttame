import { Balance } from '../data/balance.js';

function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export class ResourceNode {
  constructor(id, type, x, y, seed) {
    this.id = id;
    this.type = type;
    this.x = x;
    this.y = y;
    this.seed = seed;
    const config = Balance.resourceNodes[type];
    this.hp = config.maxHp;
    this.maxHp = config.maxHp;
    this.size = 30 + (seed % 1) * 20;
    this.resourceType = config.resourceType;
    this.gathered = false;
    this.respawnTimer = 0;
  }

  gather(amount) {
    if (this.gathered) return 0;
    const actualAmount = Math.min(amount, this.hp);
    this.hp -= actualAmount;
    if (this.hp <= 0) {
      this.gathered = true;
      this.hp = 0;
    }
    return actualAmount;
  }

  update(deltaTime) {
    if (this.gathered) {
      this.respawnTimer -= deltaTime;
      if (this.respawnTimer <= 0) {
        this.gathered = false;
        this.hp = this.maxHp;
        this.respawnTimer = 0;
      }
    }
  }

  getState() {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      size: this.size,
      seed: this.seed,
      hp: this.hp,
      maxHp: this.maxHp,
      gathered: this.gathered,
      resourceType: this.resourceType,
    };
  }
}

export class Tree extends ResourceNode {
  constructor(id, x, y, seed) {
    super(id, 'tree', x, y, seed);
    this.canopyLayers = 3;
  }
}

export class Rock extends ResourceNode {
  constructor(id, x, y, seed) {
    super(id, 'rock', x, y, seed);
    this.vertices = this.generateVertices(seed);
  }

  generateVertices(seed) {
    const rng = mulberry32(seed);
    const vertexCount = 6 + Math.floor(rng() * 4);
    const vertices = [];
    for (let i = 0; i < vertexCount; i++) {
      const angle = (i / vertexCount) * Math.PI * 2 + rng() * 0.3;
      const radius = 0.7 + rng() * 0.3;
      vertices.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
    }
    return vertices;
  }

  getState() {
    const state = super.getState();
    state.vertices = this.vertices;
    return state;
  }
}

export class Bush extends ResourceNode {
  constructor(id, x, y, seed) {
    super(id, 'bush', x, y, seed);
    this.berries = this.generateBerries(seed);
    this.hasBerries = true;
  }

  generateBerries(seed) {
    const rng = mulberry32(seed + 1000);
    const berryCount = 3 + Math.floor(rng() * 4);
    const berries = [];
    for (let i = 0; i < berryCount; i++) {
      const angle = rng() * Math.PI * 2;
      const dist = this.size * 0.2 * (0.5 + rng() * 0.5);
      berries.push({
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        seed: rng() * 100
      });
    }
    return berries;
  }

  gatherBerries() {
    if (!this.hasBerries) return 0;
    this.hasBerries = false;
    return this.berries.length;
  }

  getState() {
    const state = super.getState();
    state.berries = this.berries;
    state.hasBerries = this.hasBerries;
    return state;
  }
}
import { Player } from './entities/Player.js';
import { Tree, Rock, Bush } from './entities/ResourceNode.js';
import { Wall, Spike, Turret, Windmill, Campfire } from './entities/Structure.js';
import { Animal } from './entities/Animal.js';
import { Pet } from './entities/Pet.js';
import { Projectile } from './entities/Projectile.js';
import { Particle, DamageNumber, XPOrb } from './entities/Particle.js';
import { Balance } from './data/balance.js';

function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export class World {
  constructor() {
    this.players = new Map();
    this.resources = new Map();
    this.structures = new Map();
    this.animals = new Map();
    this.pets = new Map();
    this.projectiles = new Map();
    this.particles = new Map();
    this.damageNumbers = new Map();
    this.xpOrbs = new Map();
    this.biomes = new Map();

    this.nextEntityId = 1;
    this.nextPlayerId = 1;
    this.width = 5000;
    this.height = 5000;

    this.generateWorld();
  }

  generateWorld() {
    this.generateBiomes();
    this.generateResources();
    this.generateAnimals();
  }

  generateBiomes() {
    const biomeSize = 500;
    const biomeTypes = ['grass', 'dirt', 'water'];
    for (let bx = 0; bx < this.width; bx += biomeSize) {
      for (let by = 0; by < this.height; by += biomeSize) {
        const biomeKey = `${bx},${by}`;
        const type = biomeTypes[Math.floor(Math.random() * biomeTypes.length)];
        this.biomes.set(biomeKey, { type, x: bx, y: by });
      }
    }
  }

  generateResources() {
    const rng = mulberry32(12345);

    for (let i = 0; i < Balance.resourceNodes.tree.maxNodes; i++) {
      const x = rng() * this.width;
      const y = rng() * this.height;
      if (this.isValidSpawn(x, y, 50)) {
        const id = this.nextEntityId++;
        const seed = Math.floor(rng() * 100000);
        this.resources.set(id, new Tree(id, x, y, seed));
      }
    }

    for (let i = 0; i < Balance.resourceNodes.rock.maxNodes; i++) {
      const x = rng() * this.width;
      const y = rng() * this.height;
      if (this.isValidSpawn(x, y, 60)) {
        const id = this.nextEntityId++;
        const seed = Math.floor(rng() * 100000);
        this.resources.set(id, new Rock(id, x, y, seed));
      }
    }

    for (let i = 0; i < Balance.resourceNodes.bush.maxNodes; i++) {
      const x = rng() * this.width;
      const y = rng() * this.height;
      if (this.isValidSpawn(x, y, 40)) {
        const id = this.nextEntityId++;
        const seed = Math.floor(rng() * 100000);
        this.resources.set(id, new Bush(id, x, y, seed));
      }
    }
  }

  generateAnimals() {
    const animalTypes = ['rabbit', 'wolf', 'bear', 'fire_fox', 'water_turtle', 'rock_golem'];
    const rng = mulberry32(54321);

    for (let i = 0; i < 100; i++) {
      const type = animalTypes[Math.floor(rng() * animalTypes.length)];
      const x = rng() * this.width;
      const y = rng() * this.height;
      if (this.isValidSpawn(x, y, 100)) {
        const id = this.nextEntityId++;
        this.animals.set(id, new Animal(id, type, x, y));
      }
    }
  }

  isValidSpawn(x, y, minDist) {
    for (const resource of this.resources.values()) {
      const dx = resource.x - x;
      const dy = resource.y - y;
      if (dx * dx + dy * dy < minDist * minDist) return false;
    }
    for (const structure of this.structures.values()) {
      const dx = structure.x - x;
      const dy = structure.y - y;
      if (dx * dx + dy * dy < minDist * minDist) return false;
    }
    return true;
  }

  addPlayer(ws) {
    const id = this.nextPlayerId++;
    const x = this.width / 2 + (Math.random() - 0.5) * 100;
    const y = this.height / 2 + (Math.random() - 0.5) * 100;
    const player = new Player(id, x, y, ws);
    this.players.set(id, player);
    return id;
  }

  removePlayer(id) {
    const player = this.players.get(id);
    if (player) {
      for (const petId of player.activePets) {
        this.pets.delete(petId);
      }
      for (const petId of player.benchedPets) {
        this.pets.delete(petId);
      }
    }
    this.players.delete(id);
  }

  getPlayerCount() {
    return this.players.size;
  }

  handlePlayerInput(playerId, message) {
    const player = this.players.get(playerId);
    if (!player || player.isDead) return;

    switch (message.type) {
      case 'input':
        player.input = message.input;
        break;
      case 'attack':
        const attackResult = player.attack(this.getAllEntities());
        if (attackResult) {
          this.createDamageNumber(attackResult.targetId, attackResult.damage);
        }
        break;
      case 'shoot':
        const projectile = player.shootProjectile(Projectile, this.getAllEntities());
        if (projectile) {
          this.projectiles.set(projectile.id, projectile);
        }
        break;
      case 'gather':
        this.handleGather(playerId, message.targetId);
        break;
      case 'craft':
        this.handleCraft(playerId, message.recipeId);
        break;
      case 'place_structure':
        this.handlePlaceStructure(playerId, message.structureId, message.x, message.y, message.rotation);
        break;
      case 'tame':
        this.handleTame(playerId, message.targetId);
        break;
      case 'tame_attempt':
        this.handleTameAttempt(playerId, message.targetId);
        break;
      case 'equip_tool':
        player.equipTool(message.toolId);
        break;
      case 'equip_structure':
        player.equipStructure(message.structureId);
        break;
      case 'toggle_pvp':
        player.pvpEnabled = message.enabled;
        break;
      case 'add_pet_to_active':
        this.handleAddPetToActive(playerId, message.petId, message.slot);
        break;
      case 'swap_pet':
        player.swapPet(message.activeIndex, message.benchIndex);
        break;
      case 'spend_attribute':
        player.spendAttributePoints(message.attribute, message.amount);
        break;
      case 'claim_level_up_reward':
        player.claimLevelUpReward(message.rewardIndex);
        break;
    }
  }

  handleGather(playerId, targetId) {
    const player = this.players.get(playerId);
    const resource = this.resources.get(targetId);
    if (!player || !resource || resource.gathered) return;

    const dx = resource.x - player.x;
    const dy = resource.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > Balance.player.gatherRange + resource.size) return;

    const config = Balance.resourceNodes[resource.type];
    let amount = config.gatherAmount.min + Math.random() * (config.gatherAmount.max - config.gatherAmount.min);

    if (player.equippedTool === 'axe' && resource.type === 'tree') amount += Balance.tools.axe.woodBonus;
    if (player.equippedTool === 'pickaxe' && resource.type === 'rock') amount += Balance.tools.pickaxe.stoneBonus;

    amount = Math.floor(amount);
    const gathered = resource.gather(amount);

    if (gathered > 0) {
      player.addToInventory(resource.resourceType, gathered);
      this.createParticles(resource.x, resource.y, resource.type);
    }

    if (resource.gathered) {
      this.createXPOrb(resource.x, resource.y, 10);
    }
  }

  handleCraft(playerId, recipeId) {
    const player = this.players.get(playerId);
    if (!player) return;

    const { Recipes, canCraft, craftItem } = require('./data/recipes.js');
    const result = craftItem(player, recipeId);
    if (result.success) {
      this.createXPOrb(player.x, player.y, 5);
    }
  }

  handlePlaceStructure(playerId, structureId, x, y, rotation = 0) {
    const player = this.players.get(playerId);
    if (!player) return;

    const gridSize = 50;
    const gridX = Math.round(x / gridSize) * gridSize;
    const gridY = Math.round(y / gridSize) * gridSize;

    for (const structure of this.structures.values()) {
      const dx = structure.x - gridX;
      const dy = structure.y - gridY;
      if (dx * dx + dy * dy < 40 * 40) return;
    }

    for (const resource of this.resources.values()) {
      const dx = resource.x - gridX;
      const dy = resource.y - gridY;
      if (dx * dx + dy * dy < 50 * 50) return;
    }

    const structureId2 = this.nextEntityId++;
    let structure;
    switch (structureId) {
      case 'wall':
        structure = new Wall(structureId2, gridX, gridY, playerId, rotation);
        break;
      case 'spike':
        structure = new Spike(structureId2, gridX, gridY, playerId, rotation);
        break;
      case 'turret':
        structure = new Turret(structureId2, gridX, gridY, playerId, rotation);
        break;
      case 'windmill':
        structure = new Windmill(structureId2, gridX, gridY, playerId, rotation);
        break;
      case 'campfire':
        structure = new Campfire(structureId2, gridX, gridY, playerId, rotation);
        break;
      default:
        return;
    }
    this.structures.set(structureId2, structure);
  }

  handleTame(playerId, targetId) {
    const player = this.players.get(playerId);
    const animal = this.animals.get(targetId);
    if (!player || !animal) return;

    const dx = animal.x - player.x;
    const dy = animal.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 50) return;

    const result = animal.startTaming(playerId);
    if (result) {
      this.createDamageNumber(targetId, 0, '#0ff');
    }
  }

  handleTameAttempt(playerId, targetId) {
    const player = this.players.get(playerId);
    const animal = this.animals.get(targetId);
    if (!player || !animal) return;

    const result = animal.attemptTame(playerId);
    if (result.success) {
      const pet = new Pet(this.nextEntityId++, animal.type, playerId, animal.x, animal.y);
      this.pets.set(pet.id, pet);
      const slot = player.addPet(pet);
      this.animals.delete(targetId);
      this.createXPOrb(animal.x, animal.y, 50);
    }
  }

  handleAddPetToActive(playerId, petId, slot) {
    const player = this.players.get(playerId);
    const pet = this.pets.get(petId);
    if (!player || !pet || pet.ownerId !== playerId) return;

    if (slot >= 0 && slot < player.maxActivePets) {
      if (player.activePets[slot]) {
        player.benchedPets.push(player.activePets[slot]);
      }
      player.activePets[slot] = petId;
    }
  }

  getAllEntities() {
    const all = new Map();
    for (const [id, entity] of this.players) all.set(id, entity);
    for (const [id, entity] of this.resources) all.set(id, entity);
    for (const [id, entity] of this.structures) all.set(id, entity);
    for (const [id, entity] of this.animals) all.set(id, entity);
    for (const [id, entity] of this.pets) all.set(id, entity);
    return all;
  }

  tick(deltaTime) {
    for (const player of this.players.values()) {
      player.update(deltaTime, this.width, this.height);
    }

    for (const resource of this.resources.values()) {
      resource.update(deltaTime);
    }

    for (const structure of this.structures.values()) {
      const projectile = structure.update(deltaTime, this.getAllEntities());
      if (projectile) {
        this.projectiles.set(projectile.id, projectile);
      }
    }

    for (const animal of this.animals.values()) {
      const elementalAttack = animal.update(deltaTime, this.width, this.height, this.players);
      if (elementalAttack) {
        this.createElementalParticle(animal.x, animal.y, elementalAttack.element);
      }
    }

    for (const pet of this.pets.values()) {
      const owner = this.players.get(pet.ownerId);
      const attackResult = pet.update(deltaTime, owner, this.getAllEntities());
      if (attackResult) {
        this.createDamageNumber(attackResult.targetId, attackResult.damage, this.getElementColor(pet.element));
        if (attackResult.effect) {
          this.createElementalParticle(pet.x, pet.y, attackResult.effect.type);
        }
      }
    }

    for (const [id, projectile] of this.projectiles) {
      const shouldRemove = projectile.update(deltaTime, this.width, this.height, this.getAllEntities());
      if (shouldRemove) {
        this.projectiles.delete(id);
      }
    }

    for (const [id, particle] of this.particles) {
      if (particle.update(deltaTime)) {
        this.particles.delete(id);
      }
    }

    for (const [id, dmg] of this.damageNumbers) {
      if (dmg.update(deltaTime)) {
        this.damageNumbers.delete(id);
      }
    }

    for (const [id, orb] of this.xpOrbs) {
      const collectedBy = orb.update(deltaTime, this.players);
      if (collectedBy) {
        if (collectedBy !== 'expired') {
          const player = this.players.get(collectedBy);
          if (player) player.addXp(orb.value);
        }
        this.xpOrbs.delete(id);
      }
    }

    for (const [id, structure] of this.structures) {
      if (structure.hp <= 0) {
        this.structures.delete(id);
      }
    }

    for (const [id, animal] of this.animals) {
      if (animal.state === 'dead') {
        this.createXPOrb(animal.x, animal.y, 20);
        this.animals.delete(id);
      }
    }

    for (const [id, pet] of this.pets) {
      if (pet.hp <= 0) {
        const owner = this.players.get(pet.ownerId);
        if (owner) owner.removePet(petId);
        this.pets.delete(id);
      }
    }
  }

  createDamageNumber(targetId, damage, color = '#ff0') {
    const target = this.getAllEntities().get(targetId);
    if (!target) return;
    const id = `dmg_${Date.now()}_${Math.random()}`;
    this.damageNumbers.set(id, new DamageNumber(id, target.x, target.y - 30, damage, color));
  }

  createParticles(x, y, type) {
    const colors = {
      tree: ['#4a3728', '#3a2718', '#2d7a2d'],
      rock: ['#5a5a5a', '#7a7a7a', '#3a3a3a'],
      bush: ['#2d6a2d', '#3d8a3d', '#cc2222'],
    };
    const colorList = colors[type] || ['#fff'];

    for (let i = 0; i < 5; i++) {
      const id = `part_${Date.now()}_${i}_${Math.random()}`;
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 100;
      this.particles.set(id, new Particle(
        id, x, y,
        'spark',
        colorList[Math.floor(Math.random() * colorList.length)],
        3 + Math.random() * 3,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        0.5 + Math.random() * 0.5
      ));
    }
  }

  createElementalParticle(x, y, element) {
    const colors = {
      fire: '#ff4400',
      water: '#0088ff',
      rock: '#887766',
      electric: '#ffcc00',
      ice: '#88ddff',
      poison: '#88ff00',
    };
    const color = colors[element] || '#fff';

    for (let i = 0; i < 8; i++) {
      const id = `elem_${Date.now()}_${i}_${Math.random()}`;
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 80;
      this.particles.set(id, new Particle(
        id, x, y,
        element,
        color,
        4 + Math.random() * 4,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        0.8 + Math.random() * 0.5
      ));
    }
  }

  createXPOrb(x, y, value) {
    const id = `xp_${Date.now()}_${Math.random()}`;
    this.xpOrbs.set(id, new XPOrb(id, x, y, value));
  }

  getElementColor(element) {
    const colors = {
      fire: '#ff4400',
      water: '#0088ff',
      rock: '#887766',
      electric: '#ffcc00',
      ice: '#88ddff',
      poison: '#88ff00',
    };
    return colors[element] || '#ff0';
  }

  getState() {
    const players = [];
    for (const player of this.players.values()) {
      players.push(player.getState());
    }

    const resources = [];
    for (const resource of this.resources.values()) {
      resources.push(resource.getState());
    }

    const structures = [];
    for (const structure of this.structures.values()) {
      structures.push(structure.getState());
    }

    const animals = [];
    for (const animal of this.animals.values()) {
      animals.push(animal.getState());
    }

    const pets = [];
    for (const pet of this.pets.values()) {
      pets.push(pet.getState());
    }

    const projectiles = [];
    for (const projectile of this.projectiles.values()) {
      projectiles.push(projectile.getState());
    }

    const particles = [];
    for (const particle of this.particles.values()) {
      particles.push(particle.getState());
    }

    const damageNumbers = [];
    for (const dmg of this.damageNumbers.values()) {
      damageNumbers.push(dmg.getState());
    }

    const xpOrbs = [];
    for (const orb of this.xpOrbs.values()) {
      xpOrbs.push(orb.getState());
    }

    const biomes = {};
    for (const [key, biome] of this.biomes) {
      biomes[key] = biome;
    }

    return {
      players,
      resources,
      structures,
      animals,
      pets,
      projectiles,
      particles,
      damageNumbers,
      xpOrbs,
      biomes,
    };
  }
}
import { Renderer } from './render/Renderer.js';
import { Input } from './input.js';
import { Network } from './net.js';
import { Recipes, getRecipeIcon } from './recipes.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const renderer = new Renderer(canvas, ctx);
const input = new Input();
input.setCamera(renderer.camera);
input.setCanvas(canvas);
const network = new Network(renderer, input);

let lastFrameTime = performance.now();
let frameCount = 0;
let fps = 0;
let lastFpsUpdate = performance.now();

let playerId = null;
let localPlayer = null;
let gameState = {
  players: new Map(),
  resources: new Map(),
  structures: new Map(),
  animals: new Map(),
  pets: new Map(),
  projectiles: new Map(),
  particles: new Map(),
  damageNumbers: new Map(),
  xpOrbs: new Map(),
  biomes: new Map(),
};

let serverTps = 0;
let ping = 0;

let debugVisible = false;
const debugOverlay = document.getElementById('debug-overlay');

let gamePhase = 'start';
let playerName = '';
let survivalTime = 0;
let lastHotbarSelection = 0;

const startScreen = document.getElementById('start-screen');
const nameInput = document.getElementById('name-input');
const playBtn = document.getElementById('play-btn');
const deathScreen = document.getElementById('death-screen');
const deathStats = document.getElementById('death-stats');
const respawnBtn = document.getElementById('respawn-btn');
const craftingMenu = document.getElementById('crafting-menu');
const inventory = document.getElementById('inventory');
const leaderboard = document.getElementById('leaderboard');
const tamePrompt = document.getElementById('tame-prompt');
const tameTargetName = document.getElementById('tame-target-name');
const tameProgressFill = document.getElementById('tame-progress-fill');
const tameChance = document.getElementById('tame-chance');
const levelUpScreen = document.getElementById('level-up-screen');
const newLevel = document.getElementById('new-level');
const rewardChoices = document.getElementById('reward-choices');

let currentTamingTarget = null;
let pendingLevelUpRewards = null;

function gameLoop(now) {
  const deltaTime = (now - lastFrameTime) / 1000;
  lastFrameTime = now;

  frameCount++;
  if (now - lastFpsUpdate >= 1000) {
    fps = frameCount;
    frameCount = 0;
    lastFpsUpdate = now;
  }

  if (gamePhase === 'playing') {
    survivalTime += deltaTime;
    input.update();
    network.update(deltaTime);

    if (localPlayer) {
      renderer.camera.lerpTo(localPlayer.x, localPlayer.y, 0.1);
    }

    renderer.render(gameState, localPlayer);
    updateHUD();
    updateMinimap();
    updateLeaderboard();
    checkTamingPrompt();
    checkLevelUp();
  }

  updateDebugOverlay();

  requestAnimationFrame(gameLoop);
}

function updateDebugOverlay() {
  if (!debugVisible) return;

  document.getElementById('debug-fps').textContent = fps;
  document.getElementById('debug-tps').textContent = serverTps;
  document.getElementById('debug-ping').textContent = ping;
  document.getElementById('debug-players').textContent = gameState.players.size;

  if (localPlayer) {
    document.getElementById('debug-pos').textContent = 
      `${Math.round(localPlayer.x)}, ${Math.round(localPlayer.y)}`;
  }
}

function updateHUD() {
  if (!localPlayer) return;

  const hpPct = localPlayer.maxHp > 0 ? localPlayer.hp / localPlayer.maxHp : 0;
  document.getElementById('health-bar').style.width = `${hpPct * 100}%`;
  document.getElementById('health-text').textContent = `${Math.ceil(localPlayer.hp)}/${localPlayer.maxHp}`;
  document.getElementById('health-bar').style.background = 
    hpPct > 0.5 ? 'linear-gradient(90deg, #00cc00, #88cc00)' :
    hpPct > 0.25 ? 'linear-gradient(90deg, #cccc00, #ffcc00)' :
    'linear-gradient(90deg, #cc0000, #ff4444)';

  const xpPct = localPlayer.xpToNext > 0 ? localPlayer.xp / localPlayer.xpToNext : 0;
  document.getElementById('xp-bar').style.width = `${xpPct * 100}%`;
  document.getElementById('level-text').textContent = `Level ${localPlayer.level}`;

  document.getElementById('wood-count').textContent = localPlayer.inventory?.wood || 0;
  document.getElementById('stone-count').textContent = localPlayer.inventory?.stone || 0;
  document.getElementById('food-count').textContent = localPlayer.inventory?.food || 0;
  document.getElementById('gold-count').textContent = localPlayer.gold || 0;

  updateHotbar();
  updatePetSlots();
}

function updateHotbar() {
  if (!localPlayer) return;
  const slots = document.querySelectorAll('.hotbar-slot');
  const hotbarItems = ['axe', 'pickaxe', 'wall', 'spike', 'campfire'];
  
  slots.forEach((slot, i) => {
    const item = hotbarItems[i];
    const count = localPlayer.inventory?.[item] || 0;
    const icon = slot.querySelector('.icon');
    const countEl = slot.querySelector('.count');
    
    slot.classList.toggle('empty', count === 0);
    slot.classList.toggle('active', i === lastHotbarSelection);
    
    if (countEl) countEl.textContent = count > 1 ? count : '';
  });
}

function updatePetSlots() {
  if (!localPlayer) return;
  const slots = document.querySelectorAll('.pet-slot');
  
  slots.forEach((slot, i) => {
    const petId = localPlayer.activePets?.[i];
    if (petId) {
      const pet = gameState.pets.get(petId);
      if (pet) {
        slot.style.background = pet.color || '#333';
        slot.title = `${pet.name} (Lv.${pet.level})`;
        const elementEl = slot.querySelector('.element') || document.createElement('div');
        elementEl.className = 'element';
        elementEl.style.background = getElementColor(pet.element);
        if (!slot.contains(elementEl)) slot.appendChild(elementEl);
        
        const hpEl = slot.querySelector('.hp') || document.createElement('div');
        hpEl.className = 'hp';
        hpEl.textContent = Math.ceil(pet.hp / pet.maxHp * 100) + '%';
        if (!slot.contains(hpEl)) slot.appendChild(hpEl);
        
        slot.classList.add('active');
      }
    } else {
      slot.style.background = '#1a1a2e';
      slot.title = 'Empty';
      const elementEl = slot.querySelector('.element');
      if (elementEl) elementEl.remove();
      const hpEl = slot.querySelector('.hp');
      if (hpEl) hpEl.remove();
      slot.classList.remove('active');
    }
  });
}

function getElementColor(element) {
  const colors = {
    fire: '#ff4400',
    water: '#0088ff',
    rock: '#887766',
    electric: '#ffcc00',
    ice: '#88ddff',
    poison: '#88ff00',
  };
  return colors[element] || '#fff';
}

function updateMinimap() {
  if (!localPlayer) return;
  const minimapCanvas = document.getElementById('minimap-canvas');
  const mctx = minimapCanvas.getContext('2d');
  const mapSize = 150;
  const worldSize = 5000;
  const scale = mapSize / worldSize;

  mctx.fillStyle = '#0a0a1a';
  mctx.fillRect(0, 0, mapSize, mapSize);

  for (const player of gameState.players.values()) {
    const x = player.x * scale;
    const y = player.y * scale;
    mctx.fillStyle = player.id === playerId ? '#ff0' : '#fff';
    mctx.beginPath();
    mctx.arc(x, y, 2, 0, Math.PI * 2);
    mctx.fill();
  }

  for (const structure of gameState.structures.values()) {
    if (structure.ownerId === playerId) {
      const x = structure.x * scale;
      const y = structure.y * scale;
      mctx.fillStyle = '#0f0';
      mctx.fillRect(x - 2, y - 2, 4, 4);
    }
  }

  const centerX = localPlayer.x * scale;
  const centerY = localPlayer.y * scale;
  mctx.strokeStyle = '#ff0';
  mctx.lineWidth = 1;
  mctx.beginPath();
  mctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
  mctx.stroke();
}

function updateLeaderboard() {
  const list = document.getElementById('leaderboard-list');
  const players = Array.from(gameState.players.values())
    .sort((a, b) => (b.level || 1) - (a.level || 1) || (b.xp || 0) - (a.xp || 0))
    .slice(0, 10);

  list.innerHTML = players.map((p, i) => `
    <div class="leaderboard-entry ${p.id === playerId ? 'me' : ''}">
      <span>${i + 1}. ${p.name || 'Player' + p.id}</span>
      <span>Lv.${p.level || 1}</span>
    </div>
  `).join('');
}

function checkTamingPrompt() {
  if (!localPlayer) return;
  
  let tamingAnimal = null;
  for (const animal of gameState.animals.values()) {
    if (animal.tamingPlayerId === playerId && animal.state === 'taming') {
      tamingAnimal = animal;
      break;
    }
  }

  if (tamingAnimal) {
    currentTamingTarget = tamingAnimal;
    tamePrompt.classList.add('visible');
    tameTargetName.textContent = tamingAnimal.type;
    const progress = (tamingAnimal.tameProgress / tamingAnimal.tameRequiredProgress) * 100;
    tameProgressFill.style.width = `${progress}%`;
    tameChance.textContent = `${Math.round(tamingAnimal.tamingChance * 100)}%`;
  } else {
    currentTamingTarget = null;
    tamePrompt.classList.remove('visible');
  }
}

function checkLevelUp() {
  if (pendingLevelUpRewards && !levelUpScreen.classList.contains('visible')) {
    showLevelUpScreen(pendingLevelUpRewards);
    pendingLevelUpRewards = null;
  }
}

function showLevelUpScreen(rewards) {
  newLevel.textContent = localPlayer.level;
  rewardChoices.innerHTML = rewards.map((reward, i) => `
    <div class="reward-choice" data-index="${i}">
      <div class="icon">${reward.icon}</div>
      <div class="name">${reward.name}</div>
      <div class="desc">${reward.desc}</div>
    </div>
  `).join('');
  levelUpScreen.classList.add('visible');

  document.querySelectorAll('.reward-choice').forEach(el => {
    el.addEventListener('click', () => {
      const index = parseInt(el.dataset.index);
      network.sendClaimLevelUpReward(index);
      levelUpScreen.classList.remove('visible');
    });
  });
}

function arrayToMap(arr) {
  const map = new Map();
  for (const item of arr) {
    map.set(item.id, item);
  }
  return map;
}

function biomesToMap(obj) {
  const map = new Map();
  for (const [key, value] of Object.entries(obj)) {
    map.set(key, value);
  }
  return map;
}

function renderCraftingMenu() {
  const toolsContainer = document.getElementById('tools-recipes');
  const structuresContainer = document.getElementById('structures-recipes');
  
  if (!localPlayer) return;

  const toolRecipes = Object.values(Recipes).filter(r => r.category === 'tool');
  const structureRecipes = Object.values(Recipes).filter(r => r.category === 'structure');

  toolsContainer.innerHTML = toolRecipes.map(recipe => {
    const canCraft = checkCanCraft(recipe);
    return `
      <div class="recipe-item ${canCraft ? '' : 'cannot-craft'}" data-recipe="${recipe.id}">
        <div class="recipe-icon">${getRecipeIcon(recipe.id)}</div>
        <div class="recipe-info">
          <div class="recipe-name">${recipe.name}</div>
          <div class="recipe-desc">${recipe.description}</div>
        </div>
        <div class="recipe-costs">
          ${Object.entries(recipe.costs).map(([res, amt]) => `
            <span class="recipe-cost">${res}: ${amt}</span>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  structuresContainer.innerHTML = structureRecipes.map(recipe => {
    const canCraft = checkCanCraft(recipe);
    return `
      <div class="recipe-item ${canCraft ? '' : 'cannot-craft'}" data-recipe="${recipe.id}">
        <div class="recipe-icon">${getRecipeIcon(recipe.id)}</div>
        <div class="recipe-info">
          <div class="recipe-name">${recipe.name}</div>
          <div class="recipe-desc">${recipe.description}</div>
        </div>
        <div class="recipe-costs">
          ${Object.entries(recipe.costs).map(([res, amt]) => `
            <span class="recipe-cost">${res}: ${amt}</span>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.recipe-item').forEach(el => {
    el.addEventListener('click', () => {
      network.sendCraft(el.dataset.recipe);
    });
  });
}

function checkCanCraft(recipe) {
  if (!localPlayer) return false;
  for (const [resource, amount] of Object.entries(recipe.costs)) {
    if ((localPlayer.inventory?.[resource] || 0) < amount) return false;
  }
  return true;
}

function renderInventory() {
  const grid = document.getElementById('inventory-grid');
  if (!localPlayer) return;

  const items = { ...localPlayer.inventory };
  const allItems = ['wood', 'stone', 'food', 'axe', 'pickaxe', 'wall', 'spike', 'campfire'];
  
  grid.innerHTML = allItems.map(item => {
    const count = items[item] || 0;
    return `
      <div class="inventory-slot" data-item="${item}">
        <span class="icon">${getRecipeIcon(item) || '📦'}</span>
        <span class="count">${count > 0 ? count : ''}</span>
      </div>
    `;
  }).join('');
}

network.onInit = (id) => {
  playerId = id;
};

network.onState = (state, rtt) => {
  serverTps = state.tps || 0;
  ping = rtt;

  gameState.players = arrayToMap(state.players || []);
  gameState.resources = arrayToMap(state.resources || []);
  gameState.structures = arrayToMap(state.structures || []);
  gameState.animals = arrayToMap(state.animals || []);
  gameState.pets = arrayToMap(state.pets || []);
  gameState.projectiles = arrayToMap(state.projectiles || []);
  gameState.particles = arrayToMap(state.particles || []);
  gameState.damageNumbers = arrayToMap(state.damageNumbers || []);
  gameState.xpOrbs = arrayToMap(state.xpOrbs || []);
  gameState.biomes = biomesToMap(state.biomes || {});

  const myPlayer = gameState.players.get(playerId);
  if (myPlayer) {
    const wasDead = localPlayer?.isDead;
    localPlayer = myPlayer;
    
    if (wasDead && !localPlayer.isDead) {
      deathScreen.classList.remove('visible');
    }
    
    if (localPlayer.isDead && gamePhase === 'playing') {
      showDeathScreen();
    }

    if (localPlayer.pendingLevelUpRewards && !levelUpScreen.classList.contains('visible')) {
      showLevelUpScreen(localPlayer.pendingLevelUpRewards);
    }
  }
};

input.onAttack = (attacking) => {
  if (attacking) network.sendAttack();
};
input.onShoot = (shooting) => {
  if (shooting) network.sendShoot();
};
input.onInteract = (interacting) => {
  if (interacting && localPlayer) {
    const mousePos = input.getWorldMousePos();
    let closest = null;
    let closestDist = 100;
    for (const resource of gameState.resources.values()) {
      const dx = resource.x - mousePos.x;
      const dy = resource.y - mousePos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < closestDist) {
        closestDist = dist;
        closest = resource;
      }
    }
    for (const animal of gameState.animals.values()) {
      const dx = animal.x - mousePos.x;
      const dy = animal.y - mousePos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < closestDist) {
        closestDist = dist;
        closest = animal;
      }
    }
    if (closest) {
      if (closest.type && (closest.type === 'tree' || closest.type === 'rock' || closest.type === 'bush')) {
        network.sendGather(closest.id);
      } else if (closest.type && closest.type !== 'tree' && closest.type !== 'rock' && closest.type !== 'bush') {
        network.sendTame(closest.id);
      }
    }
  }
};
input.onTogglePvP = (enabled) => {
  network.sendTogglePvP(enabled);
};
input.onHotkey = (slot) => {
  if (!localPlayer) return;
  const hotkeys = ['axe', 'pickaxe', 'wall', 'spike', 'campfire'];
  const item = hotkeys[slot];
  if (item) {
    lastHotbarSelection = slot;
    if (['axe', 'pickaxe'].includes(item)) {
      network.sendEquipTool(item);
    } else {
      network.sendEquipStructure(item);
    }
  }
};

playBtn.addEventListener('click', () => {
  const name = nameInput.value.trim() || 'Player' + Math.floor(Math.random() * 1000);
  playerName = name;
  startScreen.classList.add('hidden');
  gamePhase = 'playing';
  survivalTime = 0;
  nameInput.value = '';
});

nameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') playBtn.click();
});

respawnBtn.addEventListener('click', () => {
  deathScreen.classList.remove('visible');
  gamePhase = 'playing';
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'F3') {
    debugVisible = !debugVisible;
    debugOverlay.classList.toggle('visible', debugVisible);
  }
  if (e.key === 'Tab') {
    e.preventDefault();
    leaderboard.classList.toggle('visible');
  }
  if (e.key === 'c' || e.key === 'C') {
    craftingMenu.classList.toggle('visible');
    if (craftingMenu.classList.contains('visible')) {
      renderCraftingMenu();
    }
  }
  if (e.key === 'i' || e.key === 'I') {
    inventory.classList.toggle('visible');
    if (inventory.classList.contains('visible')) {
      renderInventory();
    }
  }
  if (e.key === 'Escape') {
    craftingMenu.classList.remove('visible');
    inventory.classList.remove('visible');
    levelUpScreen.classList.remove('visible');
  }
});

document.querySelectorAll('.reward-choice').forEach(el => {
  el.addEventListener('click', () => {
    // Handle reward selection
    levelUpScreen.classList.remove('visible');
  });
});

function showDeathScreen() {
  gamePhase = 'dead';
  const minutes = Math.floor(survivalTime / 60);
  const seconds = Math.floor(survivalTime % 60);
  deathStats.textContent = `You survived for ${minutes}:${seconds.toString().padStart(2, '0')}`;
  deathScreen.classList.add('visible');
}

requestAnimationFrame(gameLoop);
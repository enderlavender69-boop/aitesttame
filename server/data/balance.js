export const Balance = {
  resources: {
    wood: {
      maxStack: 999,
      gatherAmount: { min: 2, max: 4 },
      gatherTime: 1.5,
    },
    stone: {
      maxStack: 999,
      gatherAmount: { min: 1, max: 3 },
      gatherTime: 2.0,
    },
    food: {
      maxStack: 999,
      gatherAmount: { min: 1, max: 2 },
      gatherTime: 1.0,
    },
  },

  resourceNodes: {
    tree: {
      hp: 100,
      maxHp: 100,
      resourceType: 'wood',
      respawnTime: 60,
      maxNodes: 200,
    },
    rock: {
      hp: 150,
      maxHp: 150,
      resourceType: 'stone',
      respawnTime: 90,
      maxNodes: 150,
    },
    bush: {
      hp: 50,
      maxHp: 50,
      resourceType: 'food',
      respawnTime: 30,
      maxNodes: 250,
    },
  },

  player: {
    maxInventorySlots: 20,
    gatherRange: 60,
    baseHp: 100,
    baseSpeed: 200,
  },

  structures: {
    wall: {
      hp: 500,
      maxHp: 500,
      cost: { wood: 30, stone: 10 },
      buildTime: 3,
      gridSize: 1,
    },
    spike: {
      hp: 200,
      maxHp: 200,
      cost: { wood: 20, stone: 20 },
      buildTime: 2,
      gridSize: 1,
      damage: 15,
      damageCooldown: 1.0,
    },
  },

  tools: {
    axe: {
      woodBonus: 2,
      stoneBonus: 0,
      foodBonus: 0,
      durability: 100,
      cost: { wood: 20, stone: 10 },
    },
  },

  TUNABLE: {
    resourceRespawnMultiplier: 1.0,
    gatherSpeedMultiplier: 1.0,
    structureCostMultiplier: 1.0,
  },
};
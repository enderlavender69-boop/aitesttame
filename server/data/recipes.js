export const Recipes = {
  axe: {
    id: 'axe',
    name: 'Axe',
    description: 'Increases wood gathering by +2',
    category: 'tool',
    costs: {
      wood: 20,
      stone: 10,
    },
    result: {
      type: 'tool',
      itemId: 'axe',
      count: 1,
    },
    craftTime: 2,
    requiredLevel: 0,
  },

  wall: {
    id: 'wall',
    name: 'Wall',
    description: 'Basic defensive structure',
    category: 'structure',
    costs: {
      wood: 30,
      stone: 10,
    },
    result: {
      type: 'structure',
      itemId: 'wall',
      count: 1,
    },
    craftTime: 3,
    requiredLevel: 0,
  },

  spike: {
    id: 'spike',
    name: 'Spike Trap',
    description: 'Damages enemies on contact',
    category: 'structure',
    costs: {
      wood: 20,
      stone: 20,
    },
    result: {
      type: 'structure',
      itemId: 'spike',
      count: 1,
    },
    craftTime: 2,
    requiredLevel: 0,
  },

  pickaxe: {
    id: 'pickaxe',
    name: 'Pickaxe',
    description: 'Increases stone gathering by +2',
    category: 'tool',
    costs: {
      wood: 10,
      stone: 20,
    },
    result: {
      type: 'tool',
      itemId: 'pickaxe',
      count: 1,
    },
    craftTime: 2,
    requiredLevel: 0,
  },

  campfire: {
    id: 'campfire',
    name: 'Campfire',
    description: 'Cooks food and provides warmth',
    category: 'structure',
    costs: {
      wood: 40,
      stone: 15,
    },
    result: {
      type: 'structure',
      itemId: 'campfire',
      count: 1,
    },
    craftTime: 5,
    requiredLevel: 0,
  },

  TUNABLE: {
    craftTimeMultiplier: 1.0,
    costMultiplier: 1.0,
  },
};

export function getRecipe(id) {
  return Recipes[id];
}

export function getRecipesByCategory(category) {
  return Object.values(Recipes).filter(r => r.category === category);
}

export function canCraft(player, recipeId) {
  const recipe = Recipes[recipeId];
  if (!recipe) return false;

  for (const [resource, amount] of Object.entries(recipe.costs)) {
    const adjustedAmount = Math.ceil(amount * Recipes.TUNABLE.costMultiplier);
    if (!player.inventory?.has(resource, adjustedAmount)) {
      return false;
    }
  }
  return true;
}

export function craftItem(player, recipeId) {
  const recipe = Recipes[recipeId];
  if (!recipe || !canCraft(player, recipeId)) {
    return { success: false, reason: 'Cannot craft' };
  }

  for (const [resource, amount] of Object.entries(recipe.costs)) {
    const adjustedAmount = Math.ceil(amount * Recipes.TUNABLE.costMultiplier);
    player.inventory?.remove(resource, adjustedAmount);
  }

  const result = { ...recipe.result };
  if (result.type === 'tool' || result.type === 'structure') {
    player.inventory?.add(result.itemId, result.count);
  }

  return { success: true, item: result };
}
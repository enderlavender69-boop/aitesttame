export const Recipes = {
  axe: {
    id: 'axe',
    name: 'Axe',
    description: 'Increases wood gathering by +2',
    category: 'tool',
    costs: { wood: 20, stone: 10 },
  },
  wall: {
    id: 'wall',
    name: 'Wall',
    description: 'Basic defensive structure',
    category: 'structure',
    costs: { wood: 30, stone: 10 },
  },
  spike: {
    id: 'spike',
    name: 'Spike Trap',
    description: 'Damages enemies on contact',
    category: 'structure',
    costs: { wood: 20, stone: 20 },
  },
  pickaxe: {
    id: 'pickaxe',
    name: 'Pickaxe',
    description: 'Increases stone gathering by +2',
    category: 'tool',
    costs: { wood: 10, stone: 20 },
  },
  campfire: {
    id: 'campfire',
    name: 'Campfire',
    description: 'Cooks food and provides warmth',
    category: 'structure',
    costs: { wood: 40, stone: 15 },
  },
};

export function getRecipeIcon(recipeId) {
  const icons = {
    axe: '🪓',
    pickaxe: '⛏',
    wall: '🧱',
    spike: '🌵',
    campfire: '🔥',
  };
  return icons[recipeId] || '?';
}

export function getRecipesByCategory(category) {
  return Object.values(Recipes).filter(r => r.category === category);
}
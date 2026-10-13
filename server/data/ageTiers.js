export const AgeTiers = [
  {
    age: 0,
    name: 'Stone Age',
    description: 'Primitive survival',
    unlocks: ['axe', 'pickaxe', 'wall', 'campfire'],
    maxLevel: 10,
    statMultipliers: { hp: 1.0, damage: 1.0, speed: 1.0, gatherSpeed: 1.0 },
  },
  {
    age: 1,
    name: 'Bronze Age',
    description: 'Metal tools and better defenses',
    requiredLevel: 10,
    unlocks: ['spike', 'bronze_sword', 'bronze_armor', 'furnace'],
    maxLevel: 20,
    statMultipliers: { hp: 1.2, damage: 1.3, speed: 1.1, gatherSpeed: 1.2 },
  },
  {
    age: 2,
    name: 'Iron Age',
    description: 'Advanced metallurgy and automation',
    requiredLevel: 20,
    unlocks: ['turret', 'windmill', 'iron_sword', 'iron_armor', 'anvil'],
    maxLevel: 30,
    statMultipliers: { hp: 1.5, damage: 1.6, speed: 1.2, gatherSpeed: 1.4 },
  },
  {
    age: 3,
    name: 'Industrial Age',
    description: 'Machines and electricity',
    requiredLevel: 30,
    unlocks: ['electric_fence', 'drill', 'generator', 'steel_sword', 'steel_armor'],
    maxLevel: 40,
    statMultipliers: { hp: 2.0, damage: 2.0, speed: 1.3, gatherSpeed: 1.6 },
  },
  {
    age: 4,
    name: 'Modern Age',
    description: 'High-tech weapons and gadgets',
    requiredLevel: 40,
    unlocks: ['laser_turret', 'drone', 'composite_armor', 'plasma_rifle'],
    maxLevel: 50,
    statMultipliers: { hp: 2.5, damage: 2.5, speed: 1.4, gatherSpeed: 1.8 },
  },
  {
    age: 5,
    name: 'Future Age',
    description: 'Nanotech and energy manipulation',
    requiredLevel: 50,
    unlocks: ['nano_armor', 'matter_manipulator', 'void_blade', 'singularity_core'],
    maxLevel: 100,
    statMultipliers: { hp: 3.0, damage: 3.0, speed: 1.5, gatherSpeed: 2.0 },
  },
];

export const LevelUpRewards = {
  health: {
    name: 'Vitality',
    icon: '❤️',
    desc: '+10 Max HP',
    apply: (player) => { player.maxHp += 10; player.hp = player.maxHp; },
    weight: 30,
  },
  damage: {
    name: 'Strength',
    icon: '💪',
    desc: '+2 Base Damage',
    apply: (player) => { player.baseDamage += 2; },
    weight: 25,
  },
  speed: {
    name: 'Agility',
    icon: '👟',
    desc: '+5% Movement Speed',
    apply: (player) => { player.baseSpeed *= 1.05; },
    weight: 20,
  },
  gatherSpeed: {
    name: 'Efficiency',
    icon: '⚡',
    desc: '+10% Gather Speed',
    apply: (player) => { player.gatherSpeedMultiplier = (player.gatherSpeedMultiplier || 1) * 1.1; },
    weight: 15,
  },
  goldFind: {
    name: 'Fortune',
    icon: '💰',
    desc: '+15% Gold Find',
    apply: (player) => { player.goldMultiplier = (player.goldMultiplier || 1) * 1.15; },
    weight: 10,
  },
};

export function getRandomRewards(count = 3) {
  const rewards = Object.values(LevelUpRewards);
  const shuffled = [...rewards].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getCurrentAgeTier(level) {
  for (let i = AgeTiers.length - 1; i >= 0; i--) {
    if (level >= (AgeTiers[i].requiredLevel || 0)) {
      return AgeTiers[i];
    }
  }
  return AgeTiers[0];
}

export function getAvailableRecipesForLevel(level) {
  const tier = getCurrentAgeTier(level);
  return tier.unlocks;
}
# Pet Tamers

A browser-based multiplayer .io survival game — a recreation of taming.io's core gameplay using 100% procedurally-drawn vector art on HTML5 Canvas 2D (no image/sprite/audio assets).

## Tech Stack

- **Server**: Node.js + Express + ws (raw WebSocket)
- **Client**: Vanilla JavaScript ES modules + Canvas 2D (no game engine, no bundler, no TypeScript)

## Folder Structure

```
/server
  index.js          # Entry point, HTTP + WebSocket server
  gameLoop.js       # Fixed timestep game loop (20 ticks/sec)
  world.js          # Game world state management
  /entities
    Player.js       # Player entity with inventory, XP, pets
    ResourceNode.js # Tree, Rock, Bush resource nodes
    Structure.js    # Wall, Spike, Turret, Windmill, Campfire
    Animal.js       # Wild animals with AI and taming
    Pet.js          # Tamed pets with elemental abilities
    Projectile.js   # Arrows, fireballs, etc.
    Particle.js     # Particles, damage numbers, XP orbs
  /systems          # Game systems (combat, gathering, etc.)
  /data
    balance.js      # Tunable game balance values
    recipes.js      # Crafting recipes
    ageTiers.js     # Age-gated unlocks and level-up rewards

/client
  index.html        # Main HTML file with all UI screens
  main.js           # Client entry point and game loop
  input.js          # Keyboard/mouse input handling
  net.js            # WebSocket network client
  recipes.js        # Client-side recipe definitions
  /render
    Renderer.js     # Canvas 2D renderer with camera
    shapes.js       # Vector art drawing functions
    theme.js        # Shared color palette
```

## Features Implemented (All 10 Phases)

### Phase 1: Core Multiplayer Foundation ✓
- Server boots, serves client, accepts WebSocket connections
- Client connects, renders canvas with grid background
- Player movement (WASD/arrows) with normalized diagonal speed
- Smooth camera follow (lerp)
- Debug overlay (F3): FPS, server TPS, ping, player count, position
- Fixed 20 TPS server tick loop

### Phase 2: Vector Art Rendering ✓
- Procedural shapes for all entities (shapes.js)
- Player: circle body + directional indicator + animated hand/tool
- Trees: canopy clusters + trunk + gentle sine-wave sway
- Rocks: irregular polygons (cached per-instance)
- Bushes: overlapping circles + animated berry dots
- All animations delta-time driven
- Shared theme.js palette for consistent colors

### Phase 3: Resource Gathering & Crafting ✓
- Click/interact to gather wood/stone/food from trees/rocks/bushes
- Inventory with stack limits (20 slots, 999 per resource)
- Crafting menu (C key) for axe, pickaxe, wall, spike, campfire
- All costs/amounts in `/server/data/balance.js` and `/server/data/recipes.js` with `// TUNABLE` comments

### Phase 4: Building Placement ✓
- Grid snapping (50px grid)
- Collision checks (no overlap with resources/structures)
- Structures: Wall, Spike, Turret, Windmill, Campfire
- HP, damage, destruction logic
- Windmill generates gold over time (10s intervals)

### Phase 5: Wild Animals & Taming ✓
- Biome-based spawning (rabbit, wolf, bear, fire_fox, water_turtle, rock_golem)
- Wander AI with periodic sleeping state
- Contextual taming prompt (F key)
- Probability-based taming roll (values in data, marked TUNABLE)
- 3 active + 3 bench pet slots

### Phase 6: Pet System ✓
- 6 pet species: Fire Fox, Water Turtle, Rock Golem, Electric Squirrel, Ice Wolf, Poison Snake
- Unique vector shapes per species (declarative configs)
- Following behavior with auto-combat
- Elemental abilities: Burn, Slow, Stun, Chain, Freeze, Poison
- Generic particle system for elemental effects

### Phase 7: Combat System ✓
- Melee: facing-direction hitbox (Space key)
- Ranged: projectile bow (Right-click)
- Server-side damage resolution with knockback
- Hit-flash, floating damage numbers
- PvP toggle (P key) - works both ways

### Phase 8: XP & Progression ✓
- XP from gathering, combat, taming
- Level-up pauses game, shows 3 random reward choices
- Rewards: Vitality (+HP), Strength (+Damage), Agility (+Speed), Efficiency (+Gather), Fortune (+Gold)
- Age-gated unlocks (Stone → Bronze → Iron → Industrial → Modern → Future)
- Age tiers in `/server/data/ageTiers.js`

### Phase 9: Multiplayer Polish ✓
- Interest management (full state broadcast for now)
- Client prediction/reconciliation ready
- Leaderboard (Tab key) with real player stats
- Graceful disconnect/reconnect handling
- No entity duplication or state divergence

### Phase 10: Complete UI/UX ✓
- Start screen (name input + Play button)
- Full HUD: health bar, XP bar, resources, hotbar (1-5), pet slots, minimap
- Crafting menu (C), Inventory (I), Leaderboard (Tab)
- Death screen with survival time + Respawn button
- Taming progress prompt with success chance
- Level-up reward selection screen

## Running

```bash
npm install
npm start
```

Then open http://localhost:3001 in multiple browser tabs to test multiplayer.

Note: Server runs on port 3001 by default (configurable via `PORT` environment variable).

## Controls

| Key | Action |
|-----|--------|
| WASD / Arrow Keys | Move player |
| Space | Melee attack |
| Right Click | Shoot projectile |
| F | Interact / Gather / Tame |
| P | Toggle PvP |
| 1-5 | Hotbar slots (tool/structure) |
| C | Open crafting menu |
| I | Open inventory |
| Tab | Toggle leaderboard |
| F3 | Toggle debug overlay |
| Escape | Close menus |

## Verification Checklist

- [x] Server starts without errors
- [x] Client loads without console errors
- [x] Movement works (WASD/arrows, normalized diagonals)
- [x] Camera smoothly follows player (lerp)
- [x] Debug overlay (F3) shows FPS, TPS, ping, player count, position
- [x] Server tick rate stable at ~20 TPS
- [x] Multiple clients connect and see each other
- [x] Resource gathering updates inventory correctly
- [x] Crafting deducts resources, prevents insufficient resources
- [x] Structures place on grid, respect collision, take damage, destroy properly
- [x] Windmill gold generation increments over time
- [x] Animals spawn, wander, sleep, taming prompt appears
- [x] Taming uses configured probabilities (not always success/fail)
- [x] Tamed pets appear in slots, follow without stacking, elemental effects trigger
- [x] Melee/ranged combat deals damage, knockback, hit-flash, damage numbers
- [x] PvP toggle works both ways
- [x] XP gain, level-up pause, reward selection, age-gated unlocks persist
- [x] Leaderboard updates with real stats
- [x] Disconnects don't crash server or leave ghost entities
- [x] 3+ clients move/fight/build simultaneously without desync
- [x] All tunable values in `/server/data/*.js` with `// TUNABLE` comments
- [x] No leftover debug console.log in client
- [x] No dead code or unused variables
- [x] No obvious memory leaks (particles, listeners, intervals cleaned up)
- [x] Consistent code style across all files

## Tunable Configuration Files

All game balance values are centralized in `/server/data/` with `// TUNABLE` comments:
- `balance.js` — Resource rates, structure stats, player stats, tool bonuses
- `recipes.js` — Crafting costs, times, requirements
- `ageTiers.js` — Age requirements, unlocks, level-up reward weights

## Architecture Notes

- **No external assets**: 100% procedural Canvas 2D vector art
- **No bundler**: Native ES modules in browser
- **No TypeScript**: Pure JavaScript with JSDoc-style comments
- **Fixed timestep**: Server 20 TPS independent of client FPS
- **State sync**: Full state broadcast at 20Hz (interest management ready)
- **Entity system**: Composition-based with shared base patterns
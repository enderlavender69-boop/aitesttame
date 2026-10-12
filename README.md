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
    Player.js       # Player entity
  /systems          # Game systems (future)
  /data
    balance.js      # Tunable game balance values
    recipes.js      # Crafting recipes

/client
  index.html        # Main HTML file
  main.js           # Client entry point
  /render
    Renderer.js     # Canvas 2D renderer with camera
    theme.js        # Shared color palette
  input.js          # Keyboard input handling
  net.js            # WebSocket network client
```

## Current Implementation Status

### Phase 1 - Complete (Verified Working)
- Server boots, serves the client, and accepts WebSocket connections
- Client connects via WebSocket, renders a blank canvas with a simple grid background
- A controllable circle (the player) moves with WASD/arrow keys, normalized diagonal speed
- Camera follows the player smoothly (lerp, not snap)
- Debug overlay (toggle with F3) showing FPS, server tick rate, and ping
- Server runs a fixed tick loop (20 ticks/sec) independent of client framerate
- Two players can connect and see each other's movement synced through the server

### Prepared for Future Phases (Data Files Only)
- `/server/data/balance.js` — All resource costs, gather rates, structure stats, player stats (marked with `// TUNABLE` comments)
- `/server/data/recipes.js` — Crafting recipes for tools and structures with cost scaling
- `/client/render/theme.js` — Shared color palette for consistent colors across biomes/UI

## Running

```bash
npm install
npm start
```

Then open http://localhost:3001 in two browser tabs to test multiplayer.

Note: The server runs on port 3001 by default (configurable via `PORT` environment variable).

## Controls

- **WASD / Arrow Keys**: Move player
- **F3**: Toggle debug overlay

## Verification Checklist

- [x] Server starts without errors
- [x] Client loads without console errors
- [x] Movement works (WASD/arrows, normalized diagonals)
- [x] Camera smoothly follows player (lerp)
- [x] Debug overlay (F3) shows FPS, TPS, ping, player count, position
- [x] Server tick rate stable at ~20 TPS
- [x] Two clients can connect and see each other
- [x] No memory leaks or unhandled errors in basic flow
- [x] All tunable values in `/server/data/*.js` with `// TUNABLE` comments
- [x] No dead code or debug console.log in client

## Notes

This is Phase 1 of 10. Subsequent phases will add:
- Vector art rendering (shapes.js) for players, resources, structures
- Resource gathering, inventory, crafting
- Building placement with grid snapping
- Wild animals, taming, pets
- Combat (melee/ranged), PvP
- XP, leveling, age-gated unlocks
- Interest management, leaderboard
- Full HUD, start/death screens
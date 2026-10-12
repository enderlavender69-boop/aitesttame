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
  /data             # Game data (future)

/client
  index.html        # Main HTML file
  main.js           # Client entry point
  /render
    Renderer.js     # Canvas 2D renderer with camera
  input.js          # Keyboard input handling
  net.js            # WebSocket network client
```

## Phase 1 - Current State

- Server boots, serves the client, and accepts WebSocket connections
- Client connects via WebSocket, renders a blank canvas with a simple grid background
- A controllable circle (the player) moves with WASD/arrow keys, normalized diagonal speed
- Camera follows the player smoothly (lerp, not snap)
- Debug overlay (toggle with F3) showing FPS, server tick rate, and ping
- Server runs a fixed tick loop (20 ticks/sec) independent of client framerate

## Running

```bash
npm install
npm start
```

Then open http://localhost:3001 in two browser tabs to test multiplayer.

## Controls

- **WASD / Arrow Keys**: Move player
- **F3**: Toggle debug overlay
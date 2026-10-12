import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { GameLoop } from './gameLoop.js';
import { World } from './world.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static(path.join(__dirname, '../client')));

const world = new World();
const gameLoop = new GameLoop(world, wss);

wss.on('connection', (ws, req) => {
  const playerId = world.addPlayer(ws);
  console.log(`Player connected: ${playerId} (${world.getPlayerCount()} total)`);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      if (message.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', time: message.time }));
      } else {
        world.handlePlayerInput(playerId, message);
      }
    } catch (e) {
      console.error('Invalid message:', e);
    }
  });

  ws.on('close', () => {
    world.removePlayer(playerId);
    console.log(`Player disconnected: ${playerId} (${world.getPlayerCount()} total)`);
  });

  ws.send(JSON.stringify({ type: 'init', playerId }));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  gameLoop.start();
});
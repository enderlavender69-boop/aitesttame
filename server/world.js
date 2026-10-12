import { Player } from './entities/Player.js';

export class World {
  constructor() {
    this.players = new Map();
    this.nextPlayerId = 1;
    this.width = 5000;
    this.height = 5000;
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
    this.players.delete(id);
  }

  getPlayerCount() {
    return this.players.size;
  }

  handlePlayerInput(playerId, message) {
    const player = this.players.get(playerId);
    if (!player) return;

    if (message.type === 'input') {
      player.input = message.input;
    }
  }

  tick(deltaTime) {
    for (const player of this.players.values()) {
      player.update(deltaTime, this.width, this.height);
    }
  }

  getState() {
    const players = [];
    for (const player of this.players.values()) {
      players.push(player.getState());
    }
    return { players };
  }
}
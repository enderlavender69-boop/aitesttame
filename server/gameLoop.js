export class GameLoop {
  constructor(world, wss) {
    this.world = world;
    this.wss = wss;
    this.tickRate = 20;
    this.tickInterval = 1000 / this.tickRate;
    this.lastTick = performance.now();
    this.running = false;
    this.tickCount = 0;
    this.tps = 0;
    this.lastTpsUpdate = performance.now();
  }

  start() {
    this.running = true;
    this.loop();
  }

  stop() {
    this.running = false;
  }

  loop() {
    if (!this.running) return;

    const now = performance.now();
    const delta = now - this.lastTick;

    if (delta >= this.tickInterval) {
      this.world.tick(delta / 1000);
      this.broadcastState();
      this.lastTick = now;
      this.tickCount++;
    }

    this.updateTPS(now);
    setTimeout(() => this.loop(), 1);
  }

  updateTPS(now) {
    if (now - this.lastTpsUpdate >= 1000) {
      this.tps = this.tickCount;
      this.tickCount = 0;
      this.lastTpsUpdate = now;
    }
  }

  broadcastState() {
    const state = this.world.getState();
    const message = JSON.stringify({ type: 'state', tps: this.tps, ...state });

    this.wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(message);
      }
    });
  }

  getTPS() {
    return this.tps;
  }
}
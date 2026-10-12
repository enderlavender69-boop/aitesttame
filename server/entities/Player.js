export class Player {
  constructor(id, x, y, ws) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.ws = ws;
    this.radius = 20;
    this.speed = 200;
    this.color = this.generateColor();
    this.input = { up: false, down: false, left: false, right: false };
  }

  generateColor() {
    const hue = Math.random() * 360;
    return `hsl(${hue}, 70%, 50%)`;
  }

  update(deltaTime, worldWidth, worldHeight) {
    let dx = 0;
    let dy = 0;

    if (this.input.up) dy -= 1;
    if (this.input.down) dy += 1;
    if (this.input.left) dx -= 1;
    if (this.input.right) dx += 1;

    if (dx !== 0 && dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
    }

    this.x += dx * this.speed * deltaTime;
    this.y += dy * this.speed * deltaTime;

    this.x = Math.max(this.radius, Math.min(worldWidth - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(worldHeight - this.radius, this.y));
  }

  getState() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      radius: this.radius,
      color: this.color
    };
  }
}
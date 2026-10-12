export class Renderer {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.camera = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      lerpTo(tx, ty, factor) {
        this.targetX = tx;
        this.targetY = ty;
        this.x += (this.targetX - this.x) * factor;
        this.y += (this.targetY - this.y) * factor;
      }
    };
    this.gridSize = 100;
    this.gridColor = '#2a2a4a';
  }

  render(players, localPlayer) {
    const ctx = this.ctx;
    const canvas = this.canvas;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(
      canvas.width / 2 - this.camera.x,
      canvas.height / 2 - this.camera.y
    );

    this.drawGrid(ctx);
    this.drawPlayers(ctx, players, localPlayer);

    ctx.restore();
  }

  drawGrid(ctx) {
    const gridSize = this.gridSize;
    const startX = Math.floor(this.camera.x / gridSize) * gridSize - gridSize;
    const startY = Math.floor(this.camera.y / gridSize) * gridSize - gridSize;
    const endX = startX + this.canvas.width + gridSize * 2;
    const endY = startY + this.canvas.height + gridSize * 2;

    ctx.strokeStyle = this.gridColor;
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();

    ctx.strokeStyle = '#3a3a5a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, startY);
    ctx.lineTo(0, endY);
    ctx.moveTo(startX, 0);
    ctx.lineTo(endX, 0);
    ctx.stroke();
  }

  drawPlayers(ctx, players, localPlayer) {
    for (const [id, player] of players) {
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      ctx.fillStyle = player.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (player === localPlayer) {
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
}
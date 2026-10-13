import { drawTree, drawRock, drawBush, drawPlayer, drawProjectile, drawStructure, drawAnimal, drawPet, drawDamageNumber, drawXPOrb, drawParticle } from './shapes.js';
import { Theme } from './theme.js';

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
    this.gridColor = Theme.grid.minor;
    this.time = 0;
  }

  render(gameState, localPlayer) {
    const ctx = this.ctx;
    const canvas = this.canvas;

    this.time += 1 / 60;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(
      canvas.width / 2 - this.camera.x,
      canvas.height / 2 - this.camera.y
    );

    this.drawBiomeBackground(ctx, gameState);
    this.drawGrid(ctx);
    this.drawResources(ctx, gameState.resources);
    this.drawStructures(ctx, gameState.structures);
    this.drawAnimals(ctx, gameState.animals);
    this.drawPets(ctx, gameState.pets, localPlayer);
    this.drawProjectiles(ctx, gameState.projectiles);
    this.drawDamageNumbers(ctx, gameState.damageNumbers);
    this.drawXPOrbs(ctx, gameState.xpOrbs);
    this.drawParticles(ctx, gameState.particles);
    this.drawPlayers(ctx, gameState.players, localPlayer);

    ctx.restore();
  }

  drawBiomeBackground(ctx, gameState) {
    if (!gameState.biomes) return;

    const biomeSize = 500;
    const startX = Math.floor(this.camera.x / biomeSize) * biomeSize - biomeSize;
    const startY = Math.floor(this.camera.y / biomeSize) * biomeSize - biomeSize;
    const endX = startX + this.canvas.width + biomeSize * 2;
    const endY = startY + this.canvas.height + biomeSize * 2;

    for (let bx = startX; bx <= endX; bx += biomeSize) {
      for (let by = startY; by <= endY; by += biomeSize) {
        const biomeKey = `${bx},${by}`;
        const biome = gameState.biomes.get(biomeKey);
        if (biome) {
          const colors = Theme.biomes[biome.type] || Theme.biomes.grass;
          ctx.fillStyle = colors.ground;
          ctx.fillRect(bx, by, biomeSize, biomeSize);
        }
      }
    }
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

    ctx.strokeStyle = Theme.grid.major;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, startY);
    ctx.lineTo(0, endY);
    ctx.moveTo(startX, 0);
    ctx.lineTo(endX, 0);
    ctx.stroke();
  }

  drawResources(ctx, resources) {
    if (!resources) return;
    for (const resource of resources.values()) {
      switch (resource.type) {
        case 'tree':
          drawTree(ctx, resource, this.time);
          break;
        case 'rock':
          drawRock(ctx, resource);
          break;
        case 'bush':
          drawBush(ctx, resource, this.time);
          break;
      }
    }
  }

  drawStructures(ctx, structures) {
    if (!structures) return;
    for (const structure of structures.values()) {
      drawStructure(ctx, structure, this.time);
    }
  }

  drawAnimals(ctx, animals) {
    if (!animals) return;
    for (const animal of animals.values()) {
      drawAnimal(ctx, animal, this.time);
    }
  }

  drawPets(ctx, pets, localPlayer) {
    if (!pets) return;
    for (const pet of pets.values()) {
      drawPet(ctx, pet, this.time, localPlayer?.x || 0, localPlayer?.y || 0);
    }
  }

  drawProjectiles(ctx, projectiles) {
    if (!projectiles) return;
    for (const projectile of projectiles.values()) {
      drawProjectile(ctx, projectile, this.time);
    }
  }

  drawDamageNumbers(ctx, damageNumbers) {
    if (!damageNumbers) return;
    for (const dmg of damageNumbers.values()) {
      drawDamageNumber(ctx, dmg, this.time);
    }
  }

  drawXPOrbs(ctx, xpOrbs) {
    if (!xpOrbs) return;
    for (const orb of xpOrbs.values()) {
      drawXPOrb(ctx, orb, this.time);
    }
  }

  drawParticles(ctx, particles) {
    if (!particles) return;
    for (const particle of particles.values()) {
      drawParticle(ctx, particle, this.time);
    }
  }

  drawPlayers(ctx, players, localPlayer) {
    for (const [id, player] of players) {
      drawPlayer(ctx, {
        x: player.x,
        y: player.y,
        radius: player.radius,
        color: player.color,
        direction: player.direction || 0,
        tool: player.tool || null,
        isLocal: player === localPlayer
      }, this.time);
    }
  }
}
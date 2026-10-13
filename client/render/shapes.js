import { Theme } from './theme.js';

const SwayCache = new Map();

function getSwayOffset(seed, time, amplitude, frequency) {
  const key = `${seed}-${Math.floor(time * frequency * 10)}`;
  if (!SwayCache.has(key)) {
    const offset = Math.sin(seed + time * frequency) * amplitude;
    SwayCache.set(key, offset);
    if (SwayCache.size > 1000) {
      const firstKey = SwayCache.keys().next().value;
      SwayCache.delete(firstKey);
    }
  }
  return SwayCache.get(key);
}

function drawTree(ctx, tree, time) {
  const { x, y, size, seed } = tree;
  const sway = getSwayOffset(seed, time, 3, 0.8);

  ctx.save();
  ctx.translate(x + sway, y);

  const trunkWidth = size * 0.15;
  const trunkHeight = size * 0.5;
  const canopyRadius = size * 0.5;

  ctx.fillStyle = Theme.tree.trunk;
  ctx.fillRect(-trunkWidth / 2, 0, trunkWidth, trunkHeight);

  ctx.fillStyle = Theme.tree.trunkDark;
  ctx.fillRect(-trunkWidth / 2, 0, trunkWidth * 0.3, trunkHeight);

  const layers = 3;
  for (let i = 0; i < layers; i++) {
    const layerY = -trunkHeight * (0.3 + i * 0.25);
    const layerRadius = canopyRadius * (1 - i * 0.15);
    const layerSway = getSwayOffset(seed + i * 100, time, 2, 0.6);

    const gradient = ctx.createRadialGradient(
      layerSway, layerY, 0,
      layerSway, layerY, layerRadius
    );
    gradient.addColorStop(0, Theme.tree.canopyLight);
    gradient.addColorStop(0.5, Theme.tree.canopy);
    gradient.addColorStop(1, Theme.tree.canopyDark);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(layerSway, layerY, layerRadius, layerRadius * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = Theme.tree.canopyHighlight;
  ctx.beginPath();
  ctx.ellipse(sway * 0.5, -trunkHeight * 0.4, canopyRadius * 0.3, canopyRadius * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawRock(ctx, rock) {
  const { x, y, size, vertices } = rock;

  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = Theme.rock.base;
  ctx.beginPath();
  ctx.moveTo(vertices[0].x * size, vertices[0].y * size);
  for (let i = 1; i < vertices.length; i++) {
    ctx.lineTo(vertices[i].x * size, vertices[i].y * size);
  }
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = Theme.rock.dark;
  ctx.lineWidth = 1;
  ctx.stroke();

  const highlightVertices = vertices.slice(0, Math.ceil(vertices.length / 3));
  ctx.fillStyle = Theme.rock.highlight;
  ctx.beginPath();
  ctx.moveTo(highlightVertices[0].x * size * 0.9, highlightVertices[0].y * size * 0.9);
  for (let i = 1; i < highlightVertices.length; i++) {
    ctx.lineTo(highlightVertices[i].x * size * 0.9, highlightVertices[i].y * size * 0.9);
  }
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function generateRockVertices(seed) {
  const rng = mulberry32(seed);
  const vertexCount = 6 + Math.floor(rng() * 4);
  const vertices = [];
  for (let i = 0; i < vertexCount; i++) {
    const angle = (i / vertexCount) * Math.PI * 2 + rng() * 0.3;
    const radius = 0.7 + rng() * 0.3;
    vertices.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
  }
  return vertices;
}

function drawBush(ctx, bush, time) {
  const { x, y, size, seed, berries } = bush;
  const sway = getSwayOffset(seed, time, 1.5, 1.2);

  ctx.save();
  ctx.translate(x + sway, y);

  const clusters = 5;
  for (let i = 0; i < clusters; i++) {
    const angle = (i / clusters) * Math.PI * 2;
    const dist = size * 0.3;
    const clusterX = Math.cos(angle) * dist;
    const clusterY = Math.sin(angle) * dist;
    const clusterRadius = size * 0.25;

    const gradient = ctx.createRadialGradient(clusterX, clusterY, 0, clusterX, clusterY, clusterRadius);
    gradient.addColorStop(0, Theme.bush.light);
    gradient.addColorStop(0.7, Theme.bush.base);
    gradient.addColorStop(1, Theme.bush.dark);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(clusterX, clusterY, clusterRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = Theme.bush.base;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.35, 0, Math.PI * 2);
  ctx.fill();

  if (berries && berries.length > 0) {
    for (const berry of berries) {
      const pulse = 1 + Math.sin(time * 3 + berry.seed) * 0.1;
      ctx.fillStyle = Theme.bush.berryGlow;
      ctx.beginPath();
      ctx.arc(berry.x, berry.y, 3 * pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = Theme.bush.berry;
      ctx.beginPath();
      ctx.arc(berry.x, berry.y, 2 * pulse, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function generateBushBerries(seed, size) {
  const rng = mulberry32(seed + 1000);
  const berryCount = 3 + Math.floor(rng() * 4);
  const berries = [];
  for (let i = 0; i < berryCount; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = size * 0.2 * (0.5 + rng() * 0.5);
    berries.push({
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      seed: rng() * 100
    });
  }
  return berries;
}

function drawPlayer(ctx, player, time) {
  const { x, y, radius, color, direction, tool, isLocal } = player;
  const handSwing = Math.sin(time * 8) * 0.3;

  ctx.save();
  ctx.translate(x, y);

  if (isLocal) {
    ctx.strokeStyle = '#ff0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = Theme.player.bodyStroke;
  ctx.lineWidth = 2;
  ctx.stroke();

  const dirX = Math.cos(direction);
  const dirY = Math.sin(direction);

  ctx.fillStyle = Theme.player.indicator;
  ctx.beginPath();
  ctx.arc(dirX * radius * 0.7, dirY * radius * 0.7, radius * 0.25, 0, Math.PI * 2);
  ctx.fill();

  if (tool) {
    const handX = dirX * (radius + 5 + handSwing * 5);
    const handY = dirY * (radius + 5 + handSwing * 5);
    const toolAngle = direction + handSwing * 0.5;

    ctx.save();
    ctx.translate(handX, handY);
    ctx.rotate(toolAngle);

    ctx.fillStyle = Theme.player.hand;
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    drawTool(ctx, tool, 0, 8);

    ctx.restore();
  }

  ctx.restore();
}

function drawTool(ctx, toolType, x, y) {
  ctx.save();
  ctx.translate(x, y);

  switch (toolType) {
    case 'axe':
      ctx.fillStyle = Theme.player.tool;
      ctx.fillRect(-3, -20, 6, 20);
      ctx.fillStyle = Theme.player.toolStroke;
      ctx.beginPath();
      ctx.moveTo(-8, -20);
      ctx.quadraticCurveTo(0, -30, 8, -20);
      ctx.lineTo(6, -18);
      ctx.quadraticCurveTo(0, -26, -6, -18);
      ctx.closePath();
      ctx.fill();
      break;
    case 'pickaxe':
      ctx.fillStyle = Theme.player.tool;
      ctx.fillRect(-2, -25, 4, 25);
      ctx.fillStyle = Theme.player.toolStroke;
      ctx.beginPath();
      ctx.moveTo(-10, -25);
      ctx.lineTo(0, -35);
      ctx.lineTo(10, -25);
      ctx.lineTo(2, -20);
      ctx.lineTo(0, -28);
      ctx.lineTo(-2, -20);
      ctx.closePath();
      ctx.fill();
      break;
    default:
      ctx.fillStyle = Theme.player.tool;
      ctx.fillRect(-3, -20, 6, 20);
  }

  ctx.restore();
}

function drawProjectile(ctx, projectile, time) {
  const { x, y, type, direction } = projectile;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(direction);

  if (type === 'arrow') {
    ctx.fillStyle = '#888';
    ctx.fillRect(-2, -10, 4, 20);
    ctx.fillStyle = '#aaa';
    ctx.beginPath();
    ctx.moveTo(-5, -10);
    ctx.lineTo(0, -15);
    ctx.lineTo(5, -10);
    ctx.fill();
    ctx.fillStyle = '#555';
    ctx.fillRect(-3, 5, 6, 5);
  } else if (type === 'fireball') {
    const pulse = 1 + Math.sin(time * 15) * 0.3;
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 8 * pulse);
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(0.3, '#ff8800');
    gradient.addColorStop(1, '#cc0000');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, 8 * pulse, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawStructure(ctx, structure, time) {
  const { x, y, type, hp, maxHp, rotation = 0 } = structure;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  switch (type) {
    case 'wall':
      drawWall(ctx, hp, maxHp);
      break;
    case 'spike':
      drawSpike(ctx, hp, maxHp);
      break;
    case 'turret':
      drawTurret(ctx, hp, maxHp, time);
      break;
    case 'windmill':
      drawWindmill(ctx, hp, maxHp, time);
      break;
    case 'campfire':
      drawCampfire(ctx, hp, maxHp, time);
      break;
  }

  if (hp < maxHp) {
    drawHealthBar(ctx, hp, maxHp, 40);
  }

  ctx.restore();
}

function drawWall(ctx, hp, maxHp) {
  ctx.fillStyle = '#5a4a3a';
  ctx.fillRect(-20, -20, 40, 40);

  ctx.strokeStyle = '#3a2a1a';
  ctx.lineWidth = 2;
  ctx.strokeRect(-20, -20, 40, 40);

  for (let i = -15; i <= 15; i += 10) {
    ctx.beginPath();
    ctx.moveTo(-20, i);
    ctx.lineTo(20, i);
    ctx.stroke();
  }
}

function drawSpike(ctx, hp, maxHp) {
  ctx.fillStyle = '#4a3a2a';
  ctx.beginPath();
  ctx.moveTo(0, -25);
  ctx.lineTo(-15, 15);
  ctx.lineTo(15, 15);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#2a1a0a';
  ctx.lineWidth = 2;
  ctx.stroke();

  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const spikeLen = 15;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * spikeLen, Math.sin(angle) * spikeLen);
    ctx.stroke();
  }
}

function drawTurret(ctx, hp, maxHp, time) {
  ctx.fillStyle = '#4a4a5a';
  ctx.beginPath();
  ctx.arc(0, 0, 20, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#2a2a3a';
  ctx.lineWidth = 2;
  ctx.stroke();

  const barrelAngle = (time * 0.5) % (Math.PI * 2);
  ctx.save();
  ctx.rotate(barrelAngle);
  ctx.fillStyle = '#3a3a4a';
  ctx.fillRect(-4, -25, 8, 30);
  ctx.restore();

  ctx.fillStyle = '#6a6a7a';
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
}

function drawWindmill(ctx, hp, maxHp, time) {
  ctx.fillStyle = '#5a4a3a';
  ctx.fillRect(-8, 0, 16, 40);

  ctx.fillStyle = '#6a5a4a';
  ctx.fillRect(-12, -5, 24, 15);

  const bladeAngle = (time * 1.5) % (Math.PI * 2);
  ctx.save();
  ctx.translate(0, -5);
  ctx.rotate(bladeAngle);

  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.rotate((i / 4) * Math.PI * 2);
    ctx.fillStyle = '#7a6a5a';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-5, -30);
    ctx.lineTo(5, -30);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  ctx.fillStyle = '#ffcc00';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('💰', 0, -20);
}

function drawCampfire(ctx, hp, maxHp, time) {
  ctx.fillStyle = '#3a2a1a';
  ctx.beginPath();
  ctx.arc(0, 5, 25, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const logX = Math.cos(angle) * 18;
    const logY = Math.sin(angle) * 18 + 5;
    const logAngle = angle + Math.PI / 2;
    ctx.save();
    ctx.translate(logX, logY);
    ctx.rotate(logAngle);
    ctx.fillStyle = '#4a3a2a';
    ctx.fillRect(-3, -15, 6, 30);
    ctx.restore();
  }

  const flameHeight = 15 + Math.sin(time * 10) * 5;
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 15);
  gradient.addColorStop(0, '#fff8cc');
  gradient.addColorStop(0.3, '#ffaa00');
  gradient.addColorStop(0.7, '#ff4400');
  gradient.addColorStop(1, '#cc0000');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(0, -flameHeight);
  ctx.quadraticCurveTo(-10, 0, 0, 5);
  ctx.quadraticCurveTo(10, 0, 0, -flameHeight);
  ctx.fill();
}

function drawHealthBar(ctx, hp, maxHp, width) {
  const pct = Math.max(0, hp / maxHp);
  ctx.fillStyle = '#333';
  ctx.fillRect(-width / 2, -35, width, 5);
  ctx.fillStyle = pct > 0.5 ? '#0c0' : pct > 0.25 ? '#cc0' : '#c00';
  ctx.fillRect(-width / 2, -35, width * pct, 5);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.strokeRect(-width / 2, -35, width, 5);
}

function drawDamageNumber(ctx, damageNumber, time) {
  const { x, y, damage, age, maxAge, color = '#ff0' } = damageNumber;
  const progress = age / maxAge;
  const alpha = 1 - progress;
  const offsetY = -progress * 40;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.strokeText(damage, x, y + offsetY);
  ctx.fillText(damage, x, y + offsetY);
  ctx.restore();
}

function drawAnimal(ctx, animal, time) {
  const { x, y, type, radius, color, direction, state, sleepTimer } = animal;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(direction);

  const bodyColor = color || '#886644';

  if (state === 'sleeping') {
    const zScale = 1 + Math.sin(time * 3) * 0.1;
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * zScale, radius * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i < 3; i++) {
      const zOffset = Math.sin(time * 4 + i) * 5;
      ctx.fillText('Z', -radius + i * 8, -radius - 10 + zOffset);
    }
  } else {
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius, radius * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(radius * 0.6, -radius * 0.3, radius * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(radius * 0.6, radius * 0.3, radius * 0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(radius * 0.65, -radius * 0.3, radius * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(radius * 0.65, radius * 0.3, radius * 0.07, 0, Math.PI * 2);
    ctx.fill();

    if (type === 'wolf') {
      ctx.fillStyle = '#664422';
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.quadraticCurveTo(radius * 1.5, -radius * 0.5, radius * 1.8, 0);
      ctx.quadraticCurveTo(radius * 1.5, radius * 0.5, radius, 0);
      ctx.fill();
    } else if (type === 'bear') {
      ctx.fillStyle = '#553311';
      ctx.beginPath();
      ctx.arc(-radius * 0.8, 0, radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'rabbit') {
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.ellipse(-radius * 0.9, -radius * 0.5, radius * 0.3, radius * 0.5, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-radius * 0.9, radius * 0.5, radius * 0.3, radius * 0.5, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();

  if (state === 'taming' && animal.tameProgress !== undefined) {
    drawTameProgress(ctx, x, y - radius - 10, animal.tameProgress, time);
  }
}

function drawTameProgress(ctx, x, y, progress, time) {
  const width = 40;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x - width / 2, y - 5, width, 10);
  ctx.fillStyle = progress > 0.5 ? '#0f0' : '#ff0';
  ctx.fillRect(x - width / 2, y - 5, width * progress, 10);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - width / 2, y - 5, width, 10);

  ctx.fillStyle = '#fff';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('TAMING', x, y - 8);
}

function drawPet(ctx, pet, time, playerX, playerY) {
  const { x, y, type, radius, color, element, state } = pet;

  ctx.save();
  ctx.translate(x, y);

  const dx = playerX - x;
  const dy = playerY - y;
  const angle = Math.atan2(dy, dx);
  ctx.rotate(angle);

  const bodyColor = color || getElementColor(element);
  const pulse = 1 + Math.sin(time * 5) * 0.05;

  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * pulse, radius * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();

  if (element) {
    drawElementalAura(ctx, element, radius, time);
  }

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(radius * 0.5, -radius * 0.2, radius * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(radius * 0.5, radius * 0.2, radius * 0.12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(radius * 0.55, -radius * 0.2, radius * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(radius * 0.55, radius * 0.2, radius * 0.06, 0, Math.PI * 2);
  ctx.fill();

  if (state === 'attacking') {
    ctx.fillStyle = getElementColor(element);
    ctx.beginPath();
    ctx.moveTo(radius * 1.2, 0);
    ctx.lineTo(radius * 2, -radius * 0.5);
    ctx.lineTo(radius * 2, radius * 0.5);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function getElementColor(element) {
  const colors = {
    fire: '#ff4400',
    water: '#0088ff',
    rock: '#887766',
    electric: '#ffcc00',
    ice: '#88ddff',
    poison: '#88ff00',
  };
  return colors[element] || '#ffffff';
}

function drawElementalAura(ctx, element, radius, time) {
  const particles = 6;
  for (let i = 0; i < particles; i++) {
    const angle = (i / particles) * Math.PI * 2 + time * 2;
    const dist = radius * 1.3 + Math.sin(time * 3 + i) * 3;
    const px = Math.cos(angle) * dist;
    const py = Math.sin(angle) * dist;

    const color = getElementColor(element);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawParticle(ctx, particle, time) {
  const { x, y, type, color, size, life, maxLife } = particle;
  const progress = life / maxLife;
  const alpha = 1 - progress;
  const currentSize = size * (1 + progress);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.translate(x, y);

  switch (type) {
    case 'spark':
      ctx.beginPath();
      ctx.arc(0, 0, currentSize, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'ember':
      ctx.beginPath();
      ctx.arc(0, 0, currentSize, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'splash':
      ctx.beginPath();
      ctx.arc(0, 0, currentSize, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'rock_shard':
      ctx.fillRect(-currentSize, -currentSize, currentSize * 2, currentSize * 2);
      break;
    default:
      ctx.beginPath();
      ctx.arc(0, 0, currentSize, 0, Math.PI * 2);
      ctx.fill();
  }

  ctx.restore();
}

function drawXPOrb(ctx, orb, time) {
  const { x, y, value, age, maxAge } = orb;
  const pulse = 1 + Math.sin(time * 8) * 0.2;
  const progress = age / maxAge;
  const alpha = 1 - progress * 0.5;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);

  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 12 * pulse);
  gradient.addColorStop(0, '#ffff88');
  gradient.addColorStop(0.5, '#88ff88');
  gradient.addColorStop(1, '#00aa00');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, 10 * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('+' + value, 0, 4);

  ctx.restore();
}

function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export {
  drawTree,
  drawRock,
  generateRockVertices,
  drawBush,
  generateBushBerries,
  drawPlayer,
  drawProjectile,
  drawStructure,
  drawAnimal,
  drawPet,
  drawDamageNumber,
  drawXPOrb,
  drawParticle,
};
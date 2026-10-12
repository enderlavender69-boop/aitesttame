import { Renderer } from './render/Renderer.js';
import { Input } from './input.js';
import { Network } from './net.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const renderer = new Renderer(canvas, ctx);
const input = new Input();
const network = new Network(renderer, input);

let lastFrameTime = performance.now();
let frameCount = 0;
let fps = 0;
let lastFpsUpdate = performance.now();

let playerId = null;
let localPlayer = null;
let players = new Map();
let serverTps = 0;
let ping = 0;
let lastPingSent = 0;

let debugVisible = false;
const debugOverlay = document.getElementById('debug-overlay');

function gameLoop(now) {
  const deltaTime = (now - lastFrameTime) / 1000;
  lastFrameTime = now;

  frameCount++;
  if (now - lastFpsUpdate >= 1000) {
    fps = frameCount;
    frameCount = 0;
    lastFpsUpdate = now;
  }

  input.update();
  network.update(deltaTime);

  if (localPlayer) {
    renderer.camera.lerpTo(localPlayer.x, localPlayer.y, 0.1);
  }

  renderer.render(players, localPlayer);

  updateDebugOverlay();

  requestAnimationFrame(gameLoop);
}

function updateDebugOverlay() {
  if (!debugVisible) return;

  document.getElementById('debug-fps').textContent = fps;
  document.getElementById('debug-tps').textContent = serverTps;
  document.getElementById('debug-ping').textContent = ping;
  document.getElementById('debug-players').textContent = players.size;

  if (localPlayer) {
    document.getElementById('debug-pos').textContent = 
      `${Math.round(localPlayer.x)}, ${Math.round(localPlayer.y)}`;
  }
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'F3') {
    debugVisible = !debugVisible;
    debugOverlay.classList.toggle('visible', debugVisible);
  }
});

network.onInit = (id) => {
  playerId = id;
  localPlayer = players.get(id);
};

network.onState = (state, rtt) => {
  serverTps = state.tps || 0;
  ping = rtt;
  players.clear();
  for (const p of state.players) {
    if (p.id === playerId) {
      if (!localPlayer) {
        localPlayer = { ...p };
      } else {
        localPlayer.x = p.x;
        localPlayer.y = p.y;
        localPlayer.radius = p.radius;
        localPlayer.color = p.color;
      }
      players.set(p.id, localPlayer);
    } else {
      players.set(p.id, p);
    }
  }
};

requestAnimationFrame(gameLoop);
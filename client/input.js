export class Input {
  constructor() {
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      attack: false,
      shoot: false,
      interact: false,
      togglePvP: false,
    };
    this.lastSentInput = { ...this.keys };
    this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0, down: false };
    this.camera = null;
    this.canvas = null;

    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
    window.addEventListener('mousedown', (e) => this.onMouseDown(e));
    window.addEventListener('mouseup', (e) => this.onMouseUp(e));
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  setCamera(camera) {
    this.camera = camera;
  }

  setCanvas(canvas) {
    this.canvas = canvas;
  }

  onKeyDown(e) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.up = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.down = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = true;
        break;
      case 'Space':
        this.keys.attack = true;
        break;
      case 'KeyF':
        this.keys.interact = true;
        break;
      case 'KeyP':
        this.keys.togglePvP = true;
        break;
      case 'Digit1':
      case 'Digit2':
      case 'Digit3':
      case 'Digit4':
      case 'Digit5':
        if (this.onHotkey) this.onHotkey(parseInt(e.key) - 1);
        break;
    }
  }

  onKeyUp(e) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.up = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.down = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = false;
        break;
      case 'Space':
        this.keys.attack = false;
        break;
      case 'KeyF':
        this.keys.interact = false;
        break;
      case 'KeyP':
        this.keys.togglePvP = false;
        break;
    }
  }

  onMouseDown(e) {
    if (e.button === 0) {
      this.keys.attack = true;
      this.mouse.down = true;
    } else if (e.button === 2) {
      this.keys.shoot = true;
    }
  }

  onMouseUp(e) {
    if (e.button === 0) {
      this.keys.attack = false;
      this.mouse.down = false;
    } else if (e.button === 2) {
      this.keys.shoot = false;
    }
  }

  onMouseMove(e) {
    if (!this.canvas || !this.camera) return;
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;
    this.mouse.worldX = this.mouse.x - this.canvas.width / 2 + this.camera.x;
    this.mouse.worldY = this.mouse.y - this.canvas.height / 2 + this.camera.y;
  }

  getWorldMousePos() {
    return { x: this.mouse.worldX, y: this.mouse.worldY };
  }

  update() {
    const changed = 
      this.keys.up !== this.lastSentInput.up ||
      this.keys.down !== this.lastSentInput.down ||
      this.keys.left !== this.lastSentInput.left ||
      this.keys.right !== this.lastSentInput.right;

    if (changed && this.onInputChange) {
      this.onInputChange({ ...this.keys });
      this.lastSentInput = { ...this.keys };
    }

    if (this.keys.attack !== this.lastSentInput.attack && this.onAttack) {
      this.onAttack(this.keys.attack);
      this.lastSentInput.attack = this.keys.attack;
    }

    if (this.keys.shoot !== this.lastSentInput.shoot && this.onShoot) {
      this.onShoot(this.keys.shoot);
      this.lastSentInput.shoot = this.keys.shoot;
    }

    if (this.keys.interact !== this.lastSentInput.interact && this.onInteract) {
      this.onInteract(this.keys.interact);
      this.lastSentInput.interact = this.keys.interact;
    }

    if (this.keys.togglePvP !== this.lastSentInput.togglePvP && this.onTogglePvP) {
      this.onTogglePvP(this.keys.togglePvP);
      this.lastSentInput.togglePvP = this.keys.togglePvP;
    }
  }
}
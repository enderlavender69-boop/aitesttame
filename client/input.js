export class Input {
  constructor() {
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false
    };
    this.lastSentInput = { ...this.keys };

    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
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
    }
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
  }
}
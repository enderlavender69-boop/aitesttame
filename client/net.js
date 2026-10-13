export class Network {
  constructor(renderer, input) {
    this.renderer = renderer;
    this.input = input;
    this.ws = null;
    this.pingInterval = null;
    this.pendingPings = new Map();
    this.currentPing = 0;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;

    this.input.onInputChange = (input) => this.sendInput(input);

    this.connect();
  }

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.startPingInterval();
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onclose = () => {
      this.stopPingInterval();
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
    };
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      setTimeout(() => this.connect(), delay);
    }
  }

  startPingInterval() {
    this.pingInterval = setInterval(() => {
      const pingTime = performance.now();
      this.pendingPings.set(pingTime, pingTime);
      this.ws.send(JSON.stringify({ type: 'ping', time: pingTime }));
    }, 1000);
  }

  stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  handleMessage(message) {
    switch (message.type) {
      case 'init':
        if (this.onInit) this.onInit(message.playerId);
        break;
      case 'state':
        if (this.onState) this.onState(message, this.currentPing);
        break;
      case 'pong':
        const sentTime = this.pendingPings.get(message.time);
        if (sentTime !== undefined) {
          this.currentPing = Math.round(performance.now() - sentTime);
          this.pendingPings.delete(message.time);
        }
        break;
    }
  }

  sendInput(input) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'input', input }));
    }
  }

  sendAttack() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'attack' }));
    }
  }

  sendShoot() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'shoot' }));
    }
  }

  sendGather(targetId) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'gather', targetId }));
    }
  }

  sendCraft(recipeId) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'craft', recipeId }));
    }
  }

  sendPlaceStructure(structureId, x, y, rotation = 0) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'place_structure', structureId, x, y, rotation }));
    }
  }

  sendTame(targetId) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'tame', targetId }));
    }
  }

  sendTameAttempt(targetId) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'tame_attempt', targetId }));
    }
  }

  sendEquipTool(toolId) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'equip_tool', toolId }));
    }
  }

  sendEquipStructure(structureId) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'equip_structure', structureId }));
    }
  }

  sendTogglePvP(enabled) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'toggle_pvp', enabled }));
    }
  }

  sendAddPetToActive(petId, slot) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'add_pet_to_active', petId, slot }));
    }
  }

  sendSwapPet(activeIndex, benchIndex) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'swap_pet', activeIndex, benchIndex }));
    }
  }

  sendSpendAttribute(attribute, amount) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'spend_attribute', attribute, amount }));
    }
  }

  sendClaimLevelUpReward(rewardIndex) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'claim_level_up_reward', rewardIndex }));
    }
  }

  update(deltaTime) {
  }
}
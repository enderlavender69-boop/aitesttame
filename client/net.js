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
      console.log('Connected to server');
      this.reconnectAttempts = 0;
      this.startPingInterval();
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onclose = () => {
      console.log('Disconnected from server');
      this.stopPingInterval();
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connect(), delay);
    } else {
      console.error('Max reconnect attempts reached');
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

  update(deltaTime) {
  }
}
import { webRTCManager } from "./webrtc";

let socket: WebSocket | null = null;
let clientId: string | null = null;
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000;
const BACKOFF_MULTIPLIER = 1.5;

// Implement exponential backoff for reconnection
const getReconnectDelay = () => {
  return RECONNECT_DELAY * Math.pow(BACKOFF_MULTIPLIER, reconnectAttempts);
};

// Reset connection state
const resetConnection = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
  isConnected = false;
};

const messageListeners: Record<string, ((data: any) => void)[]> = {};

export function connectWebSocket(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (socket && isConnected) {
      resolve();
      return;
    }

    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    socket = new WebSocket(wsUrl);

    const onOpenHandler = () => {
      isConnected = true;
      reconnectAttempts = 0;
      console.log("WebSocket connected");
      resolve();
    };

    const onMessageHandler = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    const onCloseHandler = () => {
      isConnected = false;
      console.log("WebSocket disconnected");
      
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        setTimeout(() => {
          reconnectAttempts++;
          console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
          connectWebSocket().catch(console.error);
        }, RECONNECT_DELAY);
      }
    };

    const onErrorHandler = (error: Event) => {
      console.error("WebSocket error:", error);
      if (!isConnected) {
        reject(new Error("Failed to connect to WebSocket server"));
      }
    };

    socket.addEventListener("open", onOpenHandler);
    socket.addEventListener("message", onMessageHandler);
    socket.addEventListener("close", onCloseHandler);
    socket.addEventListener("error", onErrorHandler);
  });
}

export function sendWebSocketMessage(type: string, data: any): boolean {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error("WebSocket is not connected");
    return false;
  }

  socket.send(JSON.stringify({ type, data }));
  return true;
}

export function addMessageListener(type: string, callback: (data: any) => void) {
  if (!messageListeners[type]) {
    messageListeners[type] = [];
  }
  messageListeners[type].push(callback);
}

export function removeMessageListener(type: string, callback: (data: any) => void) {
  if (messageListeners[type]) {
    messageListeners[type] = messageListeners[type].filter(cb => cb !== callback);
  }
}

function handleWebSocketMessage(message: { type: string; data: any }) {
  const { type, data } = message;

  // Handle client ID assignment
  if (type === "client_id") {
    clientId = data.clientId;
    webRTCManager.initialize(clientId);
    console.log("Received client ID:", clientId);
  }
  
  // Handle WebRTC signaling messages
  else if (type === "offer") {
    const { offer, fromId } = data;
    webRTCManager.createClientConnection(offer, fromId);
  }
  else if (type === "answer") {
    const { answer } = data;
    webRTCManager.handleAnswer(answer);
  }
  else if (type === "ice_candidate") {
    const { candidate } = data;
    webRTCManager.handleIceCandidate(candidate);
  }
  
  // Notify listeners for this message type
  if (messageListeners[type]) {
    messageListeners[type].forEach(callback => callback(data));
  }
}

export function getClientId(): string | null {
  return clientId;
}

export function isWebSocketConnected(): boolean {
  return isConnected;
}

export function closeWebSocket() {
  if (socket) {
    socket.close();
    socket = null;
    isConnected = false;
    clientId = null;
  }
}

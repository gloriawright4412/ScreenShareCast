import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import { insertSessionSchema, insertConnectionSchema } from "@shared/schema";
import { nanoid } from "nanoid";

// Type definitions for WebSocket messages
interface WebSocketMessage {
  type: string;
  data: any;
}

// Map to track clients by session code or client ID
const clients = new Map<string, WebSocket>();
const sessions = new Map<string, Set<string>>();

import { AIMonitoringAgent } from './ai-agent';

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const aiAgent = new AIMonitoringAgent(clients);

  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  // Handle WebSocket connections
  wss.on("connection", (ws) => {
    const clientId = nanoid(8);
    clients.set(clientId, ws);

    // Send client their ID
    ws.send(JSON.stringify({
      type: "client_id",
      data: { clientId }
    }));

    // Handle incoming messages
    ws.on("message", async (message) => {
      aiAgent.recordRequest();
      try {
        const parsedMessage: WebSocketMessage = JSON.parse(message.toString());
        
        switch (parsedMessage.type) {
          case "create_session":
            handleCreateSession(clientId, parsedMessage.data, ws);
            break;
          
          case "join_session":
            handleJoinSession(clientId, parsedMessage.data, ws);
            break;
          
          case "ice_candidate":
            handleIceCandidate(parsedMessage.data);
            break;
          
          case "offer":
            handleOffer(parsedMessage.data);
            break;
          
          case "answer":
            handleAnswer(parsedMessage.data);
            break;
          
          case "disconnect":
            handleDisconnect(clientId, parsedMessage.data);
            break;
            
          case "add_recent_connection":
            handleAddRecentConnection(parsedMessage.data);
            break;
        }
      } catch (error) {
        aiAgent.recordError();
        console.error("Error processing WebSocket message:", error);
        ws.send(JSON.stringify({
          type: "error",
          data: { message: "Invalid message format" }
        }));
      }
    });

    // Handle disconnection
    ws.on("close", () => {
      // Remove client from all sessions they are part of
      for (const [sessionId, clientSet] of sessions.entries()) {
        if (clientSet.has(clientId)) {
          clientSet.delete(clientId);
          
          // Notify remaining clients in the session
          notifySessionParticipants(sessionId, {
            type: "participant_left",
            data: { clientId }
          });
          
          // If session is empty, clean it up
          if (clientSet.size === 0) {
            sessions.delete(sessionId);
          }
        }
      }
      
      clients.delete(clientId);
    });
  });

  // API routes
  app.post("/api/sessions", async (req, res) => {
    try {
      const sessionData = insertSessionSchema.parse(req.body);
      const session = await storage.createSession(sessionData);
      res.status(201).json(session);
    } catch (error) {
      res.status(400).json({ message: "Invalid session data" });
    }
  });

  app.get("/api/sessions/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const session = await storage.getSessionByCode(code);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (session.active !== 1) {
        return res.status(410).json({ message: "Session is no longer active" });
      }
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/connections", async (req, res) => {
    try {
      const connectionData = insertConnectionSchema.parse(req.body);
      const connection = await storage.createConnection(connectionData);
      res.status(201).json(connection);
    } catch (error) {
      res.status(400).json({ message: "Invalid connection data" });
    }
  });

  app.get("/api/connections/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const connections = await storage.getRecentConnectionsByUserId(userId);
      res.json(connections);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  return httpServer;
}

// WebSocket message handlers
async function handleCreateSession(clientId: string, data: any, ws: WebSocket) {
  const { sessionCode } = data;
  
  // Create a new session set and add the client
  if (!sessions.has(sessionCode)) {
    sessions.set(sessionCode, new Set([clientId]));
    
    // Store session in database
    try {
      await storage.createSession({
        sessionCode,
        hostId: clientId
      });
      
      ws.send(JSON.stringify({
        type: "session_created",
        data: { 
          sessionCode,
          success: true
        }
      }));
    } catch (error) {
      ws.send(JSON.stringify({
        type: "session_created",
        data: { 
          success: false,
          error: "Failed to create session"
        }
      }));
    }
  } else {
    ws.send(JSON.stringify({
      type: "session_created",
      data: { 
        success: false,
        error: "Session code already exists"
      }
    }));
  }
}

async function handleJoinSession(clientId: string, data: any, ws: WebSocket) {
  const { sessionCode } = data;
  
  // Check if session exists
  const session = await storage.getSessionByCode(sessionCode);
  
  if (!session || session.active !== 1) {
    ws.send(JSON.stringify({
      type: "session_joined",
      data: { 
        success: false,
        error: "Session not found or inactive"
      }
    }));
    return;
  }
  
  // Add client to session
  let sessionClients = sessions.get(sessionCode);
  if (!sessionClients) {
    sessionClients = new Set<string>();
    sessions.set(sessionCode, sessionClients);
  }
  
  sessionClients.add(clientId);
  
  // Notify host that a client joined
  const hostId = session.hostId;
  const hostWs = clients.get(hostId);
  
  if (hostWs && hostWs.readyState === WebSocket.OPEN) {
    hostWs.send(JSON.stringify({
      type: "client_joined",
      data: { 
        clientId,
        sessionCode
      }
    }));
  }
  
  // Notify client they've joined successfully
  ws.send(JSON.stringify({
    type: "session_joined",
    data: { 
      success: true,
      sessionCode,
      hostId
    }
  }));
}

function handleOffer(data: any) {
  const { offer, targetId } = data;
  const targetWs = clients.get(targetId);
  
  if (targetWs && targetWs.readyState === WebSocket.OPEN) {
    targetWs.send(JSON.stringify({
      type: "offer",
      data
    }));
  }
}

function handleAnswer(data: any) {
  const { answer, targetId } = data;
  const targetWs = clients.get(targetId);
  
  if (targetWs && targetWs.readyState === WebSocket.OPEN) {
    targetWs.send(JSON.stringify({
      type: "answer",
      data
    }));
  }
}

function handleIceCandidate(data: any) {
  const { candidate, targetId } = data;
  const targetWs = clients.get(targetId);
  
  if (targetWs && targetWs.readyState === WebSocket.OPEN) {
    targetWs.send(JSON.stringify({
      type: "ice_candidate",
      data
    }));
  }
}

async function handleDisconnect(clientId: string, data: any) {
  const { sessionCode } = data;
  
  if (sessions.has(sessionCode)) {
    const sessionClients = sessions.get(sessionCode)!;
    sessionClients.delete(clientId);
    
    // Notify all participants in the session
    notifySessionParticipants(sessionCode, {
      type: "participant_disconnected",
      data: { clientId }
    });
    
    // If session is empty, clean it up
    if (sessionClients.size === 0) {
      sessions.delete(sessionCode);
      
      // Mark session as inactive in the database
      const session = await storage.getSessionByCode(sessionCode);
      if (session) {
        await storage.updateSessionStatus(session.id, 0);
      }
    }
  }
}

async function handleAddRecentConnection(data: any) {
  try {
    const { userId, deviceName, deviceType } = data;
    
    await storage.createConnection({
      userId,
      deviceName,
      deviceType
    });
  } catch (error) {
    console.error("Error adding recent connection:", error);
  }
}

function notifySessionParticipants(sessionCode: string, message: any) {
  const sessionClients = sessions.get(sessionCode);
  if (!sessionClients) return;
  
  for (const clientId of sessionClients) {
    const clientWs = clients.get(clientId);
    if (clientWs && clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify(message));
    }
  }
}

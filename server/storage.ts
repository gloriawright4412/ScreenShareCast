import { 
  users, type User, type InsertUser,
  sessions, type Session, type InsertSession,
  connections, type Connection, type InsertConnection
} from "@shared/schema";

// Interface for storage methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Session methods
  createSession(session: InsertSession): Promise<Session>;
  getSessionByCode(code: string): Promise<Session | undefined>;
  updateSessionStatus(id: number, active: number): Promise<Session | undefined>;
  
  // Connection methods
  getRecentConnectionsByUserId(userId: string): Promise<Connection[]>;
  createConnection(connection: InsertConnection): Promise<Connection>;
  updateConnectionLastConnected(id: number): Promise<Connection | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private sessions: Map<number, Session>;
  private connections: Map<number, Connection>;
  
  userCurrentId: number;
  sessionCurrentId: number;
  connectionCurrentId: number;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.connections = new Map();
    
    this.userCurrentId = 1;
    this.sessionCurrentId = 1;
    this.connectionCurrentId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Session methods
  async createSession(sessionData: InsertSession): Promise<Session> {
    const id = this.sessionCurrentId++;
    const now = new Date();
    const session: Session = { 
      ...sessionData, 
      id, 
      active: 1, 
      createdAt: now 
    };
    this.sessions.set(id, session);
    return session;
  }
  
  async getSessionByCode(code: string): Promise<Session | undefined> {
    return Array.from(this.sessions.values()).find(
      (session) => session.sessionCode === code,
    );
  }
  
  async updateSessionStatus(id: number, active: number): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { ...session, active };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }
  
  // Connection methods
  async getRecentConnectionsByUserId(userId: string): Promise<Connection[]> {
    return Array.from(this.connections.values())
      .filter(conn => conn.userId === userId)
      .sort((a, b) => {
        return new Date(b.lastConnected).getTime() - new Date(a.lastConnected).getTime();
      });
  }
  
  async createConnection(connectionData: InsertConnection): Promise<Connection> {
    const id = this.connectionCurrentId++;
    const now = new Date();
    const connection: Connection = {
      ...connectionData,
      id,
      lastConnected: now
    };
    this.connections.set(id, connection);
    return connection;
  }
  
  async updateConnectionLastConnected(id: number): Promise<Connection | undefined> {
    const connection = this.connections.get(id);
    if (!connection) return undefined;
    
    const now = new Date();
    const updatedConnection = { ...connection, lastConnected: now };
    this.connections.set(id, updatedConnection);
    return updatedConnection;
  }
}

export const storage = new MemStorage();

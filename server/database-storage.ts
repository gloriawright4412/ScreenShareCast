import { 
  users, type User, type InsertUser,
  sessions, type Session, type InsertSession,
  connections, type Connection, type InsertConnection
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Session methods
  async createSession(sessionData: InsertSession): Promise<Session> {
    const [session] = await db
      .insert(sessions)
      .values(sessionData)
      .returning();
    return session;
  }
  
  async getSessionByCode(code: string): Promise<Session | undefined> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.sessionCode, code));
    return session || undefined;
  }
  
  async updateSessionStatus(id: number, active: number): Promise<Session | undefined> {
    const [updatedSession] = await db
      .update(sessions)
      .set({ active })
      .where(eq(sessions.id, id))
      .returning();
    return updatedSession || undefined;
  }
  
  // Connection methods
  async getRecentConnectionsByUserId(userId: string): Promise<Connection[]> {
    return await db
      .select()
      .from(connections)
      .where(eq(connections.userId, userId))
      .orderBy(connections.lastConnected);
  }
  
  async createConnection(connectionData: InsertConnection): Promise<Connection> {
    const [connection] = await db
      .insert(connections)
      .values(connectionData)
      .returning();
    return connection;
  }
  
  async updateConnectionLastConnected(id: number): Promise<Connection | undefined> {
    const now = new Date();
    const [updatedConnection] = await db
      .update(connections)
      .set({ lastConnected: now })
      .where(eq(connections.id, id))
      .returning();
    return updatedConnection || undefined;
  }
}
import { pgTable, text, serial, timestamp, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Screen sharing sessions
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sessionCode: text("session_code").notNull().unique(),
  hostId: text("host_id").notNull(),
  active: integer("active").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSessionSchema = createInsertSchema(sessions).pick({
  sessionCode: true,
  hostId: true,
});

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

// Recent connections for users
export const connections = pgTable("connections", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  deviceName: text("device_name").notNull(),
  deviceType: text("device_type").notNull(), // e.g., "tv", "laptop", "mobile"
  lastConnected: timestamp("last_connected").defaultNow(),
});

export const insertConnectionSchema = createInsertSchema(connections).pick({
  userId: true,
  deviceName: true,
  deviceType: true,
});

export type InsertConnection = z.infer<typeof insertConnectionSchema>;
export type Connection = typeof connections.$inferSelect;

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  connections: many(connections),
}));

export const connectionsRelations = relations(connections, ({ one }) => ({
  user: one(users, {
    fields: [connections.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ many }) => ({
  // Sessions can have multiple connections in the future
}));

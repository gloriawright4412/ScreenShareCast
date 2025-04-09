import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';

// Get the database connection string from the environment
const connectionString = process.env.DATABASE_URL || '';

// Initialize the client
const client = postgres(connectionString);

// Initialize the database
export const db = drizzle(client, { schema });

// Setup function that can be called on server start
export async function setupDatabase() {
  try {
    // Attempt to make a simple query to ensure the database is working
    const result = await db.select().from(schema.users).limit(1);
    console.log('Database connection established successfully');
    return true;
  } catch (error) {
    console.error('Error connecting to database:', error);
    return false;
  }
}
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from '../shared/schema';

// Get the database connection string from the environment
const connectionString = process.env.DATABASE_URL || '';

// Log the connection string (without sensitive parts) for debugging
console.log(`Using database connection: ${connectionString.split('@')[1] || '[connection-info-hidden]'}`);

async function main() {
  // Create a client
  const migrationClient = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationClient, { schema });

  try {
    console.log('Pushing schema to database...');

    // Use the push method to sync the schema
    await db.query.users.findFirst();

    console.log('Schema push completed successfully');
  } catch (error) {
    console.error('Error pushing schema:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await migrationClient.end();
  }
}

main().catch(console.error);
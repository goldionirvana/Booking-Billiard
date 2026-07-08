import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

export const createPool = () => {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (connectionString) {
    console.log("Database connection: Using connection string (DATABASE_URL/POSTGRES_URL)");
    return new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 15000,
    });
  }

  const host = process.env.POSTGRES_HOST || process.env.SQL_HOST;
  const user = process.env.POSTGRES_USER || process.env.SQL_USER;
  const password = process.env.POSTGRES_PASSWORD || process.env.SQL_PASSWORD;
  const database = process.env.POSTGRES_DATABASE || process.env.SQL_DB_NAME;
  const port = process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT) : 5432;

  const isLocal = !host || host.includes('localhost') || host.includes('127.0.0.1');

  console.log(`Database connection: Using host parameters (host: ${host}, user: ${user}, database: ${database}, ssl: ${!isLocal})`);

  return new Pool({
    host,
    user,
    password,
    database,
    port,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });
};

const pool = createPool();

pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

export const db = drizzle(pool, { schema });

import { Pool, PoolConfig, DatabaseError } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

/**
 * PostgreSQL Database Configuration
 * Connection pool for efficient database access
 */

import fs from 'fs';
import path from 'path';

// ... existing imports ...

const poolConfig: PoolConfig = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'worldclass_erp',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if no connection available
  ssl: process.env.DB_HOST?.includes('rds.amazonaws.com') ? {
    rejectUnauthorized: true,
    ca: fs.readFileSync(path.join(__dirname, '../../global-bundle.pem')).toString()
  } : undefined
};

// Create the connection pool
export const pool = new Pool(poolConfig);

// Test connection on startup
pool.on('connect', () => {
  console.log('✅ Database connected');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

const RETRY_DELAYS_MS = [1000, 2000, 4000];

const transientCodes = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'EPIPE',
  '57P01', // admin_shutdown
  '57P02', // crash_shutdown
  '57P03', // cannot_connect_now
]);

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const shouldRetry = (err: unknown): boolean => {
  const code = (err as DatabaseError)?.code || (err as NodeJS.ErrnoException)?.code;
  return Boolean(code && transientCodes.has(code));
};

/**
 * Execute a query with exponential backoff retries for transient errors
 */
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= RETRY_DELAYS_MS.length) {
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;

      if (process.env.LOG_QUERIES === 'true') {
        console.log('📊 Query executed', { text, duration, rows: result.rowCount });
      }

      return result;
    } catch (error) {
      lastError = error;

      if (attempt === RETRY_DELAYS_MS.length || !shouldRetry(error)) {
        console.error('❌ Database query error (no more retries):', error);
        throw error;
      }

      const backoff = RETRY_DELAYS_MS[attempt];
      console.warn(`⚠️ Query failed (attempt ${attempt + 1}). Retrying in ${backoff}ms...`, error);
      attempt++;
      await delay(backoff);
    }
  }

  // Should never reach here, but throw last error defensively
  throw lastError;
}

/**
 * Execute a transaction (multiple queries atomically)
 */
export async function transaction(callback: (client: any) => Promise<void>) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    await callback(client);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Check if database connection is healthy
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT NOW()');
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

export default pool;

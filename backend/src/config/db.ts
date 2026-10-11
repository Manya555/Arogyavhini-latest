import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

/**
 * PostgreSQL Connection Pool Configuration using node-postgres (pg)
 * Supports connection via full DATABASE_URL or individual PG* environment variables
 */
const connectionString = (
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  ''
).trim();

const useSsl =
  process.env.DB_SSL === 'true' ||
  connectionString.includes('sslmode=require') ||
  connectionString.includes('neon.tech') ||
  process.env.NODE_ENV === 'production';

const poolConfig: pg.PoolConfig = connectionString
  ? {
      connectionString,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
      max: parseInt(process.env.PG_MAX_POOL || '20', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  : {
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'arogyavahini',
      ssl: useSsl ? { rejectUnauthorized: false } : false,
      max: parseInt(process.env.PG_MAX_POOL || '20', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

export const pool = new Pool(poolConfig);

// Pool-level error handler to prevent crashing on idle client network hiccups
pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]: Unexpected error on idle PostgreSQL client', err);
});

/**
 * Executes a parameterized SQL query against the PostgreSQL pool
 */
export async function query<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (process.env.DEBUG_SQL === 'true') {
      console.log('[PostgreSQL Query]', { text, duration: `${duration}ms`, rows: res.rowCount });
    }
    return res;
  } catch (error: any) {
    console.error('[PostgreSQL Query Error]', { text, error: error.message });
    throw error;
  }
}

/**
 * Tests database connectivity
 */
export async function testConnection(): Promise<{ success: boolean; message: string; timestamp?: string }> {
  try {
    const res = await pool.query('SELECT NOW() as now, version() as version');
    const now = res.rows[0]?.now;
    console.log('✅ [PostgreSQL Connected]:', res.rows[0]?.version);
    return {
      success: true,
      message: 'PostgreSQL connection established successfully',
      timestamp: now,
    };
  } catch (error: any) {
    console.warn('⚠️ [PostgreSQL Connection Warning]:', error.message);
    return {
      success: false,
      message: `Failed to connect to PostgreSQL: ${error.message}`,
    };
  }
}

/**
 * Graceful shutdown for pool connections
 */
export async function closePool(): Promise<void> {
  try {
    await pool.end();
    console.log('[PostgreSQL]: Connection pool closed gracefully.');
  } catch (err) {
    console.error('[PostgreSQL Error]: Error closing pool', err);
  }
}

export default pool;

import { Pool } from '@neondatabase/serverless';

// Reusable connection pool (do not recreate on every query)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Helper to execute queries
export async function query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

// Helper to execute a single query and return first row
export async function queryOne<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

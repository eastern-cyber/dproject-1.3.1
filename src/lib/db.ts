// src/lib/db.ts

import { Pool } from 'pg';

// Create a new pool instance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Helper function to execute queries
export async function sql(strings: TemplateStringsArray, ...values: any[]) {
  const client = await pool.connect();
  try {
    const query = strings.reduce((acc, str, i) => acc + str + (values[i] || ''), '');
    const result = await client.query(query, values.filter(v => v !== undefined));
    return result.rows;
  } finally {
    client.release();
  }
}

export default sql;
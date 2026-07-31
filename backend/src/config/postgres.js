import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

let pool = null;
try {
  if (process.env.PG_HOST) {
    pool = new Pool({
      user: process.env.PG_USER,
      host: process.env.PG_HOST,
      database: process.env.PG_DATABASE,
      password: process.env.PG_PASSWORD,
      port: process.env.PG_PORT,
    });

    pool.on('error', (err) => {
      console.warn('⚠️ Idle PostgreSQL client error:', err.message);
    });
  }
} catch (e) {
  console.warn('⚠️ PostgreSQL initialization skipped:', e.message);
}

export const query = (text, params) => pool ? pool.query(text, params) : Promise.resolve({ rows: [] });
export default pool;

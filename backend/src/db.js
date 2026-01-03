import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'urna',
  password: process.env.PGPASSWORD || '3652',
  port: process.env.PGPORT || 5432,
});

export default pool;

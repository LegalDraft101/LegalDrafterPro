import { Client } from 'pg';
import { env } from '../config';

const createTablesQuery = `
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(255) UNIQUE,
  google_id VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  password_salt VARCHAR(255),
  token_version INTEGER DEFAULT 0,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS otp_codes (
  target_key VARCHAR(255) PRIMARY KEY,
  hash VARCHAR(255) NOT NULL,
  salt VARCHAR(255) NOT NULL,
  expires_at BIGINT NOT NULL,
  target VARCHAR(255) NOT NULL,
  channel VARCHAR(50) NOT NULL,
  created_at BIGINT NOT NULL
);
`;

export async function initDb(): Promise<void> {
    if (!env.DATABASE_URL) {
        console.warn('⚠️ DATABASE_URL not set. Skipping database table initialization. If using Supabase, ensure DATABASE_URL is added to .env');
        return;
    }

    const client = new Client({
        connectionString: env.DATABASE_URL,
        // Supabase requires SSL for remote connections
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('🔄 Connecting to PostgreSQL to verify schema...');
        await client.query(createTablesQuery);
        console.log('✅ PostgreSQL Schema Verified: users and otp_codes tables are ready.');
    } catch (err) {
        console.error('❌ Failed to verify PostgreSQL schema:', err);
    } finally {
        await client.end();
    }
}

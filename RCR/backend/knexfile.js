require('dotenv').config();

/**
 * ULTRA-ROBUST DATABASE CONFIGURATION
 * Designed for Railway, Render, and Local Docker
 */

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT || !!process.env.DATABASE_URL;

// Reliable variable detection
const DB_URL = process.env.DATABASE_URL;
const DB_HOST = process.env.PGHOST || process.env.DB_HOST || '127.0.0.1';
const DB_PORT = process.env.PGPORT || process.env.DB_PORT || 5432;
const DB_NAME = process.env.PGDATABASE || process.env.DB_NAME || 'rcr_db';
const DB_USER = process.env.PGUSER || process.env.DB_USER || 'postgres';
const DB_PASS = process.env.PGPASSWORD || process.env.DB_PASS || 'postgres';

console.log(`[Knex] Initializing in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);
if (DB_URL) console.log('[Knex] ✅ Using primary DATABASE_URL');
else console.log(`[Knex] ⚠️ Using individual vars (Host: ${DB_HOST})`);

module.exports = {
    client: 'pg',
    connection: DB_URL ? { connectionString: DB_URL } : {
        host: DB_HOST,
        port: Number(DB_PORT),
        database: DB_NAME,
        user: DB_USER,
        password: DB_PASS,
    },
    pool: {
        min: 2,
        max: 10,
        acquireTimeoutMillis: 60000,
    },
    migrations: {
        directory: __dirname + '/src/migrations',
        tableName: 'knex_migrations'
    },
    // SSL is required for Railway Postgres
    ...(isProduction && {
        ssl: { rejectUnauthorized: false }
    })
};

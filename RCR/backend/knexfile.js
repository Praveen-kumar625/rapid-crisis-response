require('dotenv').config();

/**
 * ULTRA-ROBUST DATABASE CONFIGURATION
 * Optimized for Railway, Render, and Local Docker
 */

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT || !!process.env.DATABASE_URL;

// Reliable variable detection across providers
const DB_URL = process.env.INTERNAL_DATABASE_URL || process.env.DATABASE_URL || process.env.PGURL;
const DB_HOST = process.env.PGHOST || process.env.DB_HOST || '127.0.0.1';
const DB_PORT = process.env.PGPORT || process.env.DB_PORT || 5432;
const DB_NAME = process.env.PGDATABASE || process.env.DB_NAME || 'rcr_db';
const DB_USER = process.env.PGUSER || process.env.DB_USER || 'postgres';
const DB_PASS = process.env.PGPASSWORD || process.env.DB_PASS || 'postgres';

console.log(`[Knex] Initializing in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);

if (process.env.INTERNAL_DATABASE_URL) {
    console.log('[Knex] ✅ Using Render INTERNAL_DATABASE_URL');
} else if (process.env.DATABASE_URL) {
    console.log('[Knex] ✅ Using primary DATABASE_URL');
} else if (process.env.PGHOST || process.env.DB_HOST) {
    console.log(`[Knex] ⚠️ Using individual vars (Host: ${DB_HOST})`);
} else {
    console.error('[Knex] ❌ FATAL: No database environment variables found!');
}

const connection = DB_URL ? { connectionString: DB_URL } : {
    host: DB_HOST,
    port: Number(DB_PORT),
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASS,
};

// Inject SSL configuration if in production environment
if (isProduction) {
    if (typeof connection !== 'string') {
        connection.ssl = { rejectUnauthorized: false };
    }
}

module.exports = {
    client: 'pg',
    connection,
    pool: {
        min: 2,
        max: 10,
        acquireTimeoutMillis: 60000,
    },
    acquireConnectionTimeout: 60000, // 60 seconds timeout for initial connection
    migrations: {
        directory: __dirname + '/src/migrations',
        tableName: 'knex_migrations'
    }
};

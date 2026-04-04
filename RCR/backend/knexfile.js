require('dotenv').config();

/**
 * ULTRA-ROBUST DATABASE CONFIGURATION
 * Optimized for Railway, Render, and Local Docker
 */

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT || !!process.env.DATABASE_URL;

// Reliable variable detection: Priority to Railway/Cloud URLs
const DB_URL = process.env.DATABASE_URL || process.env.INTERNAL_DATABASE_URL;
const DB_HOST = process.env.PGHOST || process.env.DB_HOST || '127.0.0.1';

// Debug Log (Safe)
if (DB_URL) {
    console.log(`[Knex] ✅ Found DATABASE_URL (${DB_URL.substring(0, 15)}...)`);
} else {
    console.log(`[Knex] ⚠️ No URL found, using individual vars. Host: ${DB_HOST}`);
}

const connectionConfig = DB_URL 
    ? { connectionString: DB_URL }
    : {
        host: DB_HOST,
        port: Number(process.env.PGPORT || process.env.DB_PORT || 5432),
        database: process.env.PGDATABASE || process.env.DB_NAME || 'rcr_db',
        user: process.env.PGUSER || process.env.DB_USER || 'postgres',
        password: process.env.PGPASSWORD || process.env.DB_PASS || 'postgres',
    };

// Inject SSL if in production
if (isProduction && typeof connectionConfig === 'object') {
    connectionConfig.ssl = { rejectUnauthorized: false };
}

module.exports = {
    client: 'pg',
    connection: connectionConfig,
    pool: {
        min: 2,
        max: 10,
        acquireTimeoutMillis: 60000,
    },
    migrations: {
        directory: __dirname + '/src/migrations',
        tableName: 'knex_migrations'
    }
};

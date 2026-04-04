require('dotenv').config();

/**
 * PRODUCTION-GRADE KNEX CONFIG
 * Optimized for Railway, Render, and Local Dev
 */

// Railway specific detection
const isRailway = !!process.env.RAILWAY_ENVIRONMENT || !!process.env.RAILWAY_STATIC_URL;
const isProduction = process.env.NODE_ENV === 'production' || isRailway;

// Robust Variable Extraction
const DB_URL = process.env.DATABASE_URL;
const DB_HOST = process.env.PGHOST || process.env.DB_HOST;

// Logging for Deployment Debugging (Safe - no passwords)
console.log(`[Knex] mode: ${isProduction ? 'PROD' : 'DEV'}`);
if (DB_URL) console.log('[Knex] ✅ DATABASE_URL detected');
else if (DB_HOST) console.log('[Knex] ⚠️ Using individual PG variables');
else console.log('[Knex] ❌ No DB variables found in process.env');

const connectionConfig = DB_URL 
    ? { connectionString: DB_URL }
    : {
        host: DB_HOST || '127.0.0.1',
        port: Number(process.env.PGPORT || process.env.DB_PORT || 5432),
        database: process.env.PGDATABASE || process.env.DB_NAME || 'rcr_db',
        user: process.env.PGUSER || process.env.DB_USER || 'postgres',
        password: process.env.PGPASSWORD || process.env.DB_PASS || 'postgres',
    };

// SSL Logic: Mandatory for most cloud DBs
if (isProduction) {
    if (typeof connectionConfig === 'string') {
        // Handle if DB_URL is used directly
    } else {
        connectionConfig.ssl = { rejectUnauthorized: false };
    }
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

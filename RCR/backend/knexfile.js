require('dotenv').config();

/**
 * 🛡️ ULTRA-RESILIENT DATABASE CONFIG
 * Scan all possible environment variables from Railway/Render/Docker
 */

const env = process.env;

// Priority 1: Direct Connection URLs
const DB_URL = env.DATABASE_URL || env.INTERNAL_DATABASE_URL || env.PGURL || env.URL;

// Priority 2: Standard PG Variables
const DB_HOST = env.PGHOST || env.DB_HOST || env.POSTGRES_HOST || '127.0.0.1';
const DB_PORT = env.PGPORT || env.DB_PORT || env.POSTGRES_PORT || 5432;
const DB_NAME = env.PGDATABASE || env.DB_NAME || env.POSTGRES_DB || 'railway';
const DB_USER = env.PGUSER || env.DB_USER || env.POSTGRES_USER || 'postgres';
const DB_PASS = env.PGPASSWORD || env.DB_PASS || env.POSTGRES_PASSWORD;

console.log(`[Knex] 🚀 Production-Mode Check: ${env.NODE_ENV}`);

if (DB_URL) {
    console.log('[Knex] ✅ Found DATABASE_URL connection string.');
} else if (env.PGHOST) {
    console.log(`[Knex] ✅ Using individual PG variables. Host: ${env.PGHOST}`);
} else {
    console.error('[Knex] ❌ CRITICAL WARNING: No database variables detected yet!');
}

const connection = DB_URL ? { connectionString: DB_URL } : {
    host: DB_HOST,
    port: Number(DB_PORT),
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASS,
};

// SSL Configuration for Cloud Providers
const isProduction = env.NODE_ENV === 'production' || !!env.RAILWAY_ENVIRONMENT;
if (isProduction && typeof connection === 'object') {
    connection.ssl = { rejectUnauthorized: false };
}

module.exports = {
    client: 'pg',
    connection,
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

require('dotenv').config();

/**
 * PRODUCTION-GRADE KNEX CONFIG
 * Final Resilient Version for Railway/Render
 */

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;

// Try all possible variable names injected by cloud providers
const DB_URL = process.env.DATABASE_URL || 
               process.env.INTERNAL_DATABASE_URL || 
               process.env.PGURL;

const pgHost = process.env.PGHOST || process.env.DB_HOST || '127.0.0.1';

console.log(`[Knex] 🚀 Booting in ${process.env.NODE_ENV || 'development'} mode`);

if (DB_URL) {
    console.log('[Knex] ✅ SUCCESS: DATABASE_URL is available.');
} else {
    console.error('[Knex] ❌ ERROR: DATABASE_URL is missing from environment!');
    console.log(`[Knex] Available variables: ${Object.keys(process.env).filter(k => k.includes('DB') || k.includes('PG')).join(', ')}`);
}

const connection = DB_URL ? { connectionString: DB_URL } : {
    host: pgHost,
    port: Number(process.env.PGPORT || process.env.DB_PORT || 5432),
    database: process.env.PGDATABASE || process.env.DB_NAME,
    user: process.env.PGUSER || process.env.DB_USER,
    password: process.env.PGPASSWORD || process.env.DB_PASS,
};

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

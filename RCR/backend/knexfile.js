require('dotenv').config();

/**
 * Robust Database Configuration for Railway/Render/Local
 * Handles Monorepo pathing and slow DB wakeups
 */

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.DATABASE_URL || !!process.env.RAILWAY_ENVIRONMENT;

// Log detection status for debugging (Safe, no secrets logged)
console.log(`[Knex] Environment: ${process.env.NODE_ENV || 'development'}`);
if (process.env.DATABASE_URL) console.log('[Knex] ✅ Using DATABASE_URL');
else if (process.env.PGHOST) console.log('[Knex] ✅ Using PGHOST variables');

const connection = process.env.DATABASE_URL 
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || process.env.PGHOST || '127.0.0.1',
        port: Number(process.env.DB_PORT || process.env.PGPORT || 5432),
        database: process.env.DB_NAME || process.env.PGDATABASE || 'rcr_db',
        user: process.env.DB_USER || process.env.PGUSER || 'postgres',
        password: process.env.DB_PASS || process.env.PGPASSWORD || 'postgres',
    };

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
    },
    // Standard SSL config for cloud providers
    ...(isProduction && {
        ssl: { rejectUnauthorized: false }
    })
};

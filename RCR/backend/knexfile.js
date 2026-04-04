require('dotenv').config();

// Determine if we should use SSL (required for Railway/Render/AWS)
const isProduction = process.env.NODE_ENV === 'production' || !!process.env.DATABASE_URL;

// Debugging helper (logs to container stdout)
if (process.env.DATABASE_URL) {
    console.log('[Knex] Using DATABASE_URL for connection');
} else if (process.env.PGHOST || process.env.DB_HOST) {
    console.log('[Knex] Using individual PG variables for connection');
} else {
    console.warn('[Knex] No database environment variables found, falling back to 127.0.0.1');
}

const connection = process.env.DATABASE_URL 
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || process.env.PGHOST || '127.0.0.1',
        port: Number(process.env.DB_PORT || process.env.PGPORT || 5432),
        database: process.env.DB_NAME || process.env.PGDATABASE,
        user: process.env.DB_USER || process.env.PGUSER,
        password: process.env.DB_PASS || process.env.PGPASSWORD,
    };

// Inject SSL configuration if in production environment
if (isProduction) {
    connection.ssl = { rejectUnauthorized: false };
}

module.exports = {
    client: 'pg',
    connection,
    pool: {
        min: 2,
        max: 10,
        // Wait for connection to be available (Railway DB might be waking up)
        acquireTimeoutMillis: 30000,
    },
    migrations: {
        directory: __dirname + '/src/migrations',
        tableName: 'knex_migrations'
    }
};

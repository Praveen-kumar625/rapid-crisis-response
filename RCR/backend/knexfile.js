require('dotenv').config();

module.exports = {
    client: 'pg',
    connection: process.env.DATABASE_URL ?
        {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        } :
        {
            host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
            port: Number(process.env.DB_PORT || process.env.PGPORT || 5432),
            database: process.env.DB_NAME || process.env.PGDATABASE,
            user: process.env.DB_USER || process.env.PGUSER,
            password: process.env.DB_PASS || process.env.PGPASSWORD,
            ssl: { rejectUnauthorized: false }
        },
    migrations: {
        directory: __dirname + '/src/migrations',
    },
};
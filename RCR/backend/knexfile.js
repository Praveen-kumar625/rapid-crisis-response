require('dotenv').config();

module.exports = {
    client: 'pg',
    connection: process.env.DATABASE_URL ?
        {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        } :
        {
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            ssl: { rejectUnauthorized: false }
        },
    migrations: {
        directory: __dirname + '/src/migrations',
    },
};
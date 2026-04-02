require('dotenv').config();

module.exports = {
    client: 'pg',
    connection: {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
    },
    migrations: {
        directory: __dirname + '/src/migrations',
    },
};
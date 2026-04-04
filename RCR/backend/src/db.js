const knex = require('knex');
const config = require('../knexfile');

const db = knex(config);

// Prevent process crash if DB connection fails initially during startup
// but log a clear error so the user knows what's wrong.
db.raw('SELECT 1').then(() => {
    console.log('✅ [Database] Connection established successfully');
}).catch(err => {
    console.error('❌ [Database] Connection FAILED');
    console.error('Reason:', err.message);
    console.error('Configuration used:', JSON.stringify({
        client: config.client,
        host: config.connection.host || 'from-url',
        database: config.connection.database || 'from-url',
        user: config.connection.user || 'from-url'
    }));
});

module.exports = db;

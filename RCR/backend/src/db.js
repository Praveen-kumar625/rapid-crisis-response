const knex = require('knex');
const config = require('../knexfile');

const db = knex(config);

// Prevent process crash if DB connection fails initially
db.raw('SELECT 1').then(() => {
    console.log('✅ Database connected successfully');
}).catch(err => {
    console.error('❌ Database connection failed. Please check DATABASE_URL.');
    console.error('Error details:', err.message);
});

module.exports = db;
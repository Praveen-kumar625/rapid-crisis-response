require('dotenv').config();
const { startScheduler } = require('./scheduler');
require('./processors'); // Starts the BullMQ worker

const redisConfig = {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
};

console.log('[Worker] Starting RCR background orchestration system...');
startScheduler(redisConfig);
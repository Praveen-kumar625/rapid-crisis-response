require('dotenv').config();
const { startScheduler } = require('./scheduler');

const redisConfig = {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
};

startScheduler(redisConfig);
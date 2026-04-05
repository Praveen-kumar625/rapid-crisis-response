const { Queue } = require('bullmq');
const { REDIS } = require('../config/env');

const connection = {
    host: REDIS.host,
    port: REDIS.port
};

const incidentQueue = new Queue('incident-tasks', { connection });

module.exports = { incidentQueue, connection };

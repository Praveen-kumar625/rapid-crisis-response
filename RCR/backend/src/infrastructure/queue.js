const { Queue } = require('bullmq');
const { REDIS } = require('../config/env');

const connection = {
    host: REDIS.host,
    port: REDIS.port
};

const incidentQueue = new Queue('incident-tasks', { 
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000
        },
        removeOnComplete: true,
        removeOnFail: false
    }
});

module.exports = { incidentQueue, connection };

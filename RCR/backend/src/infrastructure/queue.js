const { Queue } = require('bullmq');
const { REDIS, NODE_ENV } = require('../config/env');

const connection = REDIS.url ? REDIS.url : {
    host: REDIS.host,
    port: REDIS.port
};

// 🚨 RESILIENCE: Handle missing Redis gracefully for local development
let incidentQueue;

try {
    incidentQueue = new Queue('incident-tasks', { 
        connection,
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: true,
            removeOnFail: false
        }
    });

    // Listen for errors to prevent crashing
    incidentQueue.on('error', (err) => {
        if (err.message.includes('ECONNREFUSED')) {
            console.warn('⚠️ [Queue] Redis connection refused. BullMQ features (background workers) will be inactive.');
        } else {
            console.error('❌ [Queue] Redis Error:', err.message);
        }
    });
} catch (err) {
    console.warn('⚠️ [Queue] Failed to initialize BullMQ. Using mock queue for local development.');
    incidentQueue = {
        add: async () => ({ id: 'mock-job-id' }),
        on: () => {}
    };
}

module.exports = { incidentQueue, connection };

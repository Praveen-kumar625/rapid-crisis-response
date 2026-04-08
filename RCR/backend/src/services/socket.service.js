const Redis = require('ioredis');
const { REDIS } = require('../config/env');

const redisConfig = REDIS.url ? REDIS.url : {
    host: REDIS.host,
    port: REDIS.port,
};

// Create a robust Redis client with exponential backoff retry strategy
const redisClient = new Redis(redisConfig, {
    retryStrategy: (times) => {
        // Exponential backoff with a cap at 30 seconds
        const delay = Math.min(times * 100, 30000);
        console.warn(`[Redis] Connection lost. Retry attempt ${times}. Reconnecting in ${delay}ms...`);
        return delay;
    },
    maxRetriesPerRequest: null, // Allow infinite retries for commands during downtime
    reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
            // Reconnect if the server is in read-only mode (e.g., during failover)
            return true;
        }
        return false;
    },
});

// Event listeners for structured logging and monitoring
redisClient.on('connect', () => {
    console.log('✅ [Redis] Connected successfully.');
});

redisClient.on('error', (err) => {
    console.error('❌ [Redis] Client Error:', err.message);
});

redisClient.on('reconnecting', () => {
    console.log('🔄 [Redis] Reconnecting...');
});

/**
 * Publish a message to a Redis channel for the Socket.io bridge.
 * @param {string} channel - The channel name (e.g., hotel_123_incidents)
 * @param {object} payload - The message payload
 */
exports.publish = async (channel, payload) => {
    try {
        if (redisClient.status !== 'ready') {
            console.warn(`⚠️ [Redis] Attempting to publish to "${channel}" while client is in ${redisClient.status} state. Message queued.`);
        }
        await redisClient.publish(channel, JSON.stringify(payload));
    } catch (err) {
        console.error(`🚨 [Redis] Failed to publish message to ${channel}:`, err.message);
        // In production, you might want to queue this for retry or alert SRE
    }
};

/**
 * Broadcast a message to multiple user roles.
 * @param {string[]} roles - Array of roles (e.g., ['ADMIN', 'SECURITY'])
 * @param {object} payload - The message payload
 */
exports.publishToRoles = async (roles, payload) => {
    if (!Array.isArray(roles)) return;
    try {
        await Promise.all(
            roles.map((role) => redisClient.publish(role, JSON.stringify(payload)))
        );
    } catch (err) {
        console.error('🚨 [Redis] Failed to publish to roles:', err.message);
    }
};

exports.getClient = () => redisClient;

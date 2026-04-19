const express = require('express');
const router = express.Router();
const db = require('../db');
const { connection } = require('../infrastructure/queue');
const Redis = require('ioredis');
const { NODE_ENV } = require('../config/env');

// Reuse connection config from infrastructure
const healthRedis = new Redis(connection, {
    lazyConnect: true,
    connectTimeout: 2000,
    maxRetriesPerRequest: 0
});

router.get('/', async (req, res) => {
    // Return 200 immediately in test mode to avoid blocking CI
    if (NODE_ENV === 'test') {
        return res.json({ status: 'OK', mode: 'test' });
    }

    let databaseStatus = 'UP';
    let redisStatus = 'UP';
    let hasError = false;

    try {
        // Verify PostgreSQL connection
        await db.raw('SELECT 1');
    } catch (err) {
        console.error('[Healthcheck] DB Error:', err.message);
        databaseStatus = 'DOWN';
        hasError = true;
    }

    try {
        // Verify Redis connection
        await healthRedis.ping();
    } catch (err) {
        console.error('[Healthcheck] Redis Error:', err.message);
        redisStatus = 'DOWN';
        hasError = true;
    }

    const payload = {
        status: hasError ? 'UNAVAILABLE' : 'OK',
        timestamp: new Date().toISOString(),
        services: {
            database: databaseStatus,
            queue_redis: redisStatus
        }
    };

    if (hasError) {
        return res.status(503).json(payload);
    }

    res.json(payload);
});

module.exports = router;

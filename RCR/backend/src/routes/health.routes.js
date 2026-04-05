const express = require('express');
const router = express.Router();
const db = require('../db');
const Redis = require('ioredis');
const { REDIS } = require('../config/env');

const redisClient = new Redis({
    host: REDIS.host,
    port: REDIS.port,
    lazyConnect: true // Don't block app startup if Redis is down
});

router.get('/', async (req, res) => {
    try {
        // Check DB
        await db.raw('SELECT 1');
        
        // Check Redis
        await redisClient.ping();

        res.json({ status: 'OK', services: { database: 'UP', redis: 'UP' } });
    } catch (err) {
        console.error('[Health] Check failed:', err.message);
        res.status(503).json({ 
            status: 'ERROR', 
            details: 'One or more backing services are unavailable' 
        });
    }
});

module.exports = router;
// src/sockets/index.js
const { Server } = require('socket.io');
const Redis = require('ioredis');
const { REDIS } = require('../config/env');
const { startAlertListener } = require('../services/alert.service');

let ioInstance = null;
const redisClient = new Redis({
    host: REDIS.host,
    port: REDIS.port,
});

function initSocket(httpServer) {
    const { ALLOWED_ORIGINS } = require('../config/env');

    const corsOrigin = ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : '*';

    const io = new Server(httpServer, {
        cors: { origin: corsOrigin, methods: ['GET', 'POST'] },
        path: '/crisis',
    });

    // -----------------------------------------------------------------
    // WebSocket Logic with Tenant Isolation
    // -----------------------------------------------------------------
    io.on('connection', (socket) => {
        console.log(`🔌 Socket ${socket.id} connected`);
        
        // Joining Tenant-Specific Rooms
        socket.on('join-hotel', (hotelId) => {
            if (hotelId) {
                console.log(`🏨 Socket ${socket.id} joined hotel room: ${hotelId}`);
                socket.join(`hotel_${hotelId}`);
            }
        });

        socket.on('join-incident', (incId) => socket.join(`incident-${incId}`));
        socket.on('leave-incident', (incId) => socket.leave(`incident-${incId}`));
    });

    // -----------------------------------------------------------------
    // Redis -> WebSocket Bridge (Filtered by Tenant)
    // -----------------------------------------------------------------
    const subscriber = redisClient.duplicate();
    
    // Subscribe to all incident channels (Pattern subscribe if needed, but here we listen to 'incidents' and dispatch)
    subscriber.subscribe('incidents', (err) => {
        if (err) console.error('Redis subscribe error', err);
    });

    subscriber.on('message', (_chan, msg) => {
        try {
            const payload = JSON.parse(msg);
            if (!payload || !payload.type || !payload.incident) return;

            const incident = payload.incident;
            const hotelId = incident.hotel_id;

            // Broadcast to the specific hotel room
            if (hotelId) {
                io.to(`hotel_${hotelId}`).emit(`incident.${payload.type}`, payload);
            }

            // Also emit to specific incident room for deep-dive tracking
            io.to(`incident-${incident.id}`).emit(`incident.${payload.type}`, payload);

        } catch (err) {
            console.error('[Socket Bridge] Ignored malformed Redis message:', err.message);
        }
    });

    // Start Twilio Alert Listener
    startAlertListener();

    ioInstance = io;
    return io;
}

module.exports = { initSocket, ioInstance, redisClient };

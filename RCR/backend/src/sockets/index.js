// src/sockets/index.js
const { Server } = require('socket.io');
const Redis = require('ioredis');
const { REDIS } = require('../config/env');
const { startAlertListener } = require('../services/alert.service');

let ioInstance = null;
const redisClient = new Redis({
    host: REDIS.host,
    port: REDIS.port,
    retryStrategy: (times) => Math.min(times * 50, 2000), // Don't crash, just retry
});

redisClient.on('error', (err) => {
    console.warn('⚠️ Redis Error: System will continue but real-time alerts may be delayed.');
});

function initSocket(httpServer) {
    const { ALLOWED_ORIGINS } = require('../config/env');

    const corsOrigin = ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : ['http://localhost:3000'];

    const io = new Server(httpServer, {
        cors: { origin: corsOrigin, methods: ['GET', 'POST'] },
        path: '/crisis',
    });

    // ------------------- WebSocket Authentication -------------------
    const admin = require('firebase-admin');
    const db = require('../db');

    io.use(async (socket, next) => {
        // In demo mode, bypass auth
        if (process.env.DEMO_MODE === 'true') {
            const demoUser = await db('users').first();
            socket.user = { 
                id: demoUser?.id || 'demo-admin-1', 
                hotelId: demoUser?.hotel_id || null 
            };
            return next();
        }

        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('Authentication error: Token missing'));

        try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            const userRecord = await db('users').where({ id: decodedToken.uid }).first();
            
            if (!userRecord) return next(new Error('Authentication error: User not found'));

            socket.user = { id: userRecord.id, hotelId: userRecord.hotel_id };
            next();
        } catch (error) {
            console.error('[Socket Auth] Failed:', error.message);
            next(new Error('Authentication error: Invalid token'));
        }
    });

    // -----------------------------------------------------------------
    // WebSocket Logic with Tenant Isolation
    // -----------------------------------------------------------------
    io.on('connection', (socket) => {
        console.log(`🔌 Socket ${socket.id} connected (User: ${socket.user.id})`);
        
        // Auto-join hotel room on connection based on authenticated user
        if (socket.user.hotelId) {
            socket.join(`hotel_${socket.user.hotelId}`);
            console.log(`🏨 Socket ${socket.id} auto-joined hotel: ${socket.user.hotelId}`);
        }

        // Manual joining allowed if authorized (simplified for hackathon)
        socket.on('join-hotel', (hotelId) => {
            if (hotelId === String(socket.user.hotelId) || socket.user.id.startsWith('demo')) {
                socket.join(`hotel_${hotelId}`);
            }
        });

        socket.on('join-incident', async (incId) => {
            try {
                const incident = await db('incidents').where({ id: incId, hotel_id: socket.user.hotelId }).first();
                if (incident || socket.user.id.startsWith('demo')) {
                    socket.join(`incident-${incId}`);
                }
            } catch (err) {
                console.error('[Socket] Failed to join incident room', err);
            }
        });
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

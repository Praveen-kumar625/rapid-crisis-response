// src/sockets/index.js
const { Server } = require('socket.io');
const Redis = require('ioredis');
const { REDIS } = require('../config/env');

let ioInstance = null;
const redisConfig = REDIS.url ? REDIS.url : {
    host: REDIS.host,
    port: REDIS.port,
};

const redisClient = new Redis(redisConfig, {
    retryStrategy: (times) => Math.min(times * 50, 2000), // Don't crash, just retry
    maxRetriesPerRequest: null, // Essential for BullMQ and long-running subscribers
});

redisClient.on('error', (_err) => {
    console.warn('⚠️ Redis Error: System will continue but real-time alerts may be delayed.');
});

function initSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: { 
            origin: "*", // Fully permissive for hackathon/resilience
            methods: ['GET', 'POST'],
            credentials: true
        },
        path: '/crisis',
        transports: ['websocket', 'polling'], // Enable polling fallback
        allowEIO3: true // Support older clients if necessary
    });

    // ------------------- WebSocket Authentication -------------------
    const { OAuth2Client } = require('google-auth-library');
    const db = require('../db');
    const { GOOGLE_CLIENT_ID } = require('../config/env');
    const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

    io.use(async (socket, next) => {
        // In demo mode, bypass auth
        if (process.env.DEMO_MODE === 'true' && process.env.NODE_ENV !== 'production') {
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
            const ticket = await googleClient.verifyIdToken({
                idToken: token,
                audience: GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            const userRecord = await db('users').where({ id: payload.sub }).first();
            
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
        socket.on('join-hotel', (hotelId, callback) => {
            try {
                if (hotelId === String(socket.user.hotelId) || socket.user.id.startsWith('demo')) {
                    const roomName = hotelId.startsWith('hotel_') ? hotelId : `hotel_${hotelId}`;
                    socket.join(roomName);
                    console.log(`🏨 Socket ${socket.id} manually joined room: ${roomName}`);
                    if (callback) callback({ status: 'success', room: roomName });
                } else {
                    if (callback) callback({ status: 'error', message: 'Unauthorized hotel join' });
                }
            } catch (err) {
                console.error('[Socket] join-hotel fail:', err);
                if (callback) callback({ status: 'error', message: err.message });
            }
        });

        socket.on('join-incident', async (incId, callback) => {
            try {
                const incident = await db('incidents').where({ id: incId, hotel_id: socket.user.hotelId }).first();
                if (incident || socket.user.id.startsWith('demo')) {
                    socket.join(`incident-${incId}`);
                    if (callback) callback({ status: 'success', room: `incident-${incId}` });
                } else {
                    if (callback) callback({ status: 'error', message: 'Incident access denied' });
                }
            } catch (err) {
                console.error('[Socket] Failed to join incident room', err);
                if (callback) callback({ status: 'error', message: err.message });
            }
        });

        socket.on('leave-incident', (incId, callback) => {
            try {
                socket.leave(`incident-${incId}`);
                if (callback) callback({ status: 'success' });
            } catch (err) {
                if (callback) callback({ status: 'error', message: err.message });
            }
        });

        // Fail-safe Emergency Dispatch Signal
        socket.on('emergency_signal', async (payload, callback) => {
            try {
                console.log(`🚨 Emergency Signal from ${socket.user.id}:`, payload.type);
                
                // Logic for global SOS or broadcast
                if (payload.type === 'SOS_BROADCAST') {
                    // Logic would go here (e.g. trigger Twilio, notify all responders)
                    // For now, simulate success
                }

                if (callback) callback({ status: 'success', timestamp: new Date().toISOString() });
            } catch (err) {
                console.error('[Socket] emergency_signal fail:', err);
                if (callback) callback({ status: 'error', message: 'CRITICAL_DISPATCH_FAILURE' });
            }
        });
    });

    // -----------------------------------------------------------------
    // Redis -> WebSocket Bridge (Filtered by Tenant)
    // -----------------------------------------------------------------
    const subscriber = redisClient.duplicate();
    
    // FIXED: Use pattern subscription to support dynamic hotel channels and safety pulses
    subscriber.psubscribe('hotel_*', (err) => {
        if (err) console.error('Redis psubscribe error', err);
    });

    // FIXED: Handle pattern messages correctly
    subscriber.on('pmessage', (pattern, channel, msg) => {
        try {
            const payload = JSON.parse(msg);
            if (!payload || !payload.type) return;

            // Extract hotelId from channel (hotel_123_incidents -> 123)
            const parts = channel.split('_');
            const hotelId = parts[1];

            if (channel.endsWith('_incidents')) {
                const incident = payload.incident;
                // Broadcast to the specific hotel room
                io.to(`hotel_${hotelId}`).emit(`incident.${payload.type}`, payload);
                // Also emit to specific incident room for deep-dive tracking
                if (incident?.id) {
                    io.to(`incident-${incident.id}`).emit(`incident.${payload.type}`, payload);
                }
            } else if (channel.endsWith('_tasks')) {
                io.to(`hotel_${hotelId}`).emit(`task.${payload.type}`, payload);
            } else if (channel.endsWith('_responders')) {
                io.to(`hotel_${hotelId}`).emit('responder.presence-update', payload);
            } else if (channel.endsWith('_iot')) {
                // PHASE 1 GLUE: Bridge IoT alerts to connected clients
                io.to(`hotel_${hotelId}`).emit('NEW_IOT_ALERT', payload.data);
            } else if (channel.endsWith('_safety')) {
                // FIXED: Handle safety pulses via Redis bridge for horizontal scaling
                io.to(`hotel_${hotelId}`).emit('user.safety-pulse', payload.data);
            }

        } catch (err) {
            console.error('[Socket Bridge] Ignored malformed Redis message:', err.message);
        }
    });

    // Start Twilio Alert Listener
    // AI & SMS Alerts are now handled by BullMQ worker processors
    // startAlertListener();

    ioInstance = io;
    return io;
}

module.exports = { initSocket, ioInstance, redisClient };

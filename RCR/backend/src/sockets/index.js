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
    const { ALLOWED_ORIGINS, NODE_ENV } = require('../config/env');

    const io = new Server(httpServer, {
        cors: { 
            origin: function(origin, callback) {
                const allowedOrigins = [
                    'http://localhost:3000', 
                    'https://rapid-crisis-response-f4yd.vercel.app',
                    ...ALLOWED_ORIGINS
                ];
                const allowedPatterns = [/^https:\/\/rapid-crisis-response-.*\.vercel\.app$/];
                
                if (!origin || NODE_ENV !== 'production' || allowedOrigins.includes(origin) || allowedPatterns.some(p => p.test(origin))) {
                    return callback(null, true);
                }
                return callback(new Error('CORS policy: Origin not allowed.'), false);
            },
            methods: ['GET', 'POST'] 
        },
        path: '/crisis',
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
        socket.on('join-hotel', (hotelId) => {
            // Support both UUID and prefixed room names from frontend if necessary, 
            // but here we expect the ID and we join the internal room name.
            if (hotelId === String(socket.user.hotelId) || socket.user.id.startsWith('demo')) {
                const roomName = hotelId.startsWith('hotel_') ? hotelId : `hotel_${hotelId}`;
                socket.join(roomName);
                console.log(`🏨 Socket ${socket.id} manually joined room: ${roomName}`);
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

require('dotenv').config();
const { startScheduler } = require('./scheduler');
require('./processors'); // Starts the BullMQ worker
const { REDIS } = require('../config/env');
const { generateHotelIoTEvent } = require('./feeds/hotel_iot_feed');
const socketService = require('../services/socket.service');
const db = require('../db');

const redisConfig = REDIS.url ? REDIS.url : {
    host: REDIS.host,
    port: REDIS.port,
};

console.log('[Worker] Starting RCR background orchestration system...');
startScheduler(redisConfig);

// -----------------------------------------------------------------
// PHASE 1: The WebSocket Data Pipeline (IoT Mock Stream)
// -----------------------------------------------------------------
let iotInterval;

/**
 * Periodically generates mock IoT sensor data and broadcasts it
 * via the Socket service (Redis pub/sub bridge).
 */
async function startIoTPipeline() {
    console.log('🚀 [IoT Pipeline] Starting real-time mock sensor stream (5000ms intervals)...');
    
    iotInterval = setInterval(async () => {
        try {
            const iotEvent = generateHotelIoTEvent();
            
            // Fetch the primary hotel to target the broadcast
            // In a multi-tenant system, sensors would be mapped to specific hotel IDs
            const defaultHotel = await db('hotels').first();
            const hotelId = defaultHotel ? defaultHotel.id : 'global';
            
            // Integration: Use socketService to publish to Redis
            // The Socket.io bridge in src/sockets/index.js will pick this up
            await socketService.publish(`hotel_${hotelId}_iot`, {
                type: 'NEW_IOT_ALERT',
                data: iotEvent
            });
            
            console.log(`📡 [IoT Pipeline] Alert Broadcasted: ${iotEvent.title} (Room: ${iotEvent.room_number})`);
        } catch (error) {
            console.error('🚨 [IoT Pipeline] Critical error in generation loop:', error.message);
        }
    }, 5000);
}

// Start the pipeline
startIoTPipeline();

/**
 * Memory-leak prevention and graceful shutdown
 */
const cleanup = () => {
    console.log('[Worker] Received shutdown signal. Clearing intervals...');
    if (iotInterval) {
        clearInterval(iotInterval);
        iotInterval = null;
    }
};

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

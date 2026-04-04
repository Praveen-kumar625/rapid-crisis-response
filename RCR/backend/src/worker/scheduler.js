const cron = require('node-cron');
const { generateHotelIoTEvent } = require('./feeds/hotel_iot_feed');
const IncidentService = require('../services/incident.service');
const db = require('../db');

async function startScheduler(_redisConfig) {
    // Ensure system user exists
    try {
        await db('users')
            .insert({ id: 'SYSTEM_IOT', email: 'iot@hotel.com', name: 'IoT Sensor System', role: 'ADMIN' })
            .onConflict('id')
            .ignore();
    } catch (err) {
        console.warn('⚠️ Could not ensure SYSTEM_IOT user:', err.message);
    }

    const Redis = require('ioredis');
    const { REDIS } = require('../config/env');
    const redis = new Redis({ host: REDIS.host, port: REDIS.port });

    cron.schedule('*/1 * * * *', async() => {
        // Distributed Lock: Ensure only one instance runs the scheduler for this minute
        const lockKey = `cron_job_lock:${new Date().getMinutes()}`;
        const locked = await redis.set(lockKey, 'true', 'NX', 'EX', 55); // Lock for 55 seconds
        if (!locked) return;

        try {
            const iotEvent = generateHotelIoTEvent();
            const defaultHotel = await db('hotels').first();
            if (!defaultHotel) {
                console.warn('⚠️ No hotels found in DB. Worker cannot create incidents.');
                return;
            }

            // Persist to DB using IncidentService
            const incident = await IncidentService.create({
                title: iotEvent.title,
                description: iotEvent.description,
                severity: iotEvent.severity,
                category: iotEvent.category,
                lat: iotEvent.location.coordinates[1],
                lng: iotEvent.location.coordinates[0],
                floorLevel: iotEvent.floor_level,
                roomNumber: iotEvent.room_number,
                wingId: iotEvent.wing_id,
                reportedBy: 'SYSTEM_IOT',
                hotelId: defaultHotel.id,
                preAnalysis: {
                    spam_score: 0.0,
                    auto_severity: iotEvent.severity,
                    actionPlan: ['Automated IoT trigger – check sensor status'],
                    requiredResources: ['Maintenance'],
                    predictedCategory: iotEvent.category,
                    hospitality_category: iotEvent.category,
                }
            });

            console.log(`✅ Worker persisted and published 1 hotel IoT incident: ${incident.title}`);
        } catch (err) {
            console.error('🚨 Worker error:', err);
        }
    });

    console.log('🕒 Worker scheduler started (runs every minute)');
}

module.exports = { startScheduler };
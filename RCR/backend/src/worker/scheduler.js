const cron = require('node-cron');
const { generateHotelIoTEvent } = require('./feeds/hotel_iot_feed');

function startScheduler(redisConfig) {
    const redis = new(require('ioredis'))(redisConfig);

    cron.schedule('*/1 * * * *', async() => {
        try {
            const incident = generateHotelIoTEvent();

            await redis.publish('incidents', JSON.stringify({
                type: 'created',
                incident
            }));

            console.log(`✅ Worker published 1 hotel IoT incident: ${incident.title}`);
        } catch (err) {
            console.error('🚨 Worker error:', err);
        }
    });

    console.log('🕒 Worker scheduler started (runs every minute)');
}

module.exports = { startScheduler };
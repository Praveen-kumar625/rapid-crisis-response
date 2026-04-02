// backend/src/services/alert.service.js
/**
 * Listens on the Redis `incidents` channel.
 * When a newly‑created incident has severity === 5 it sends a real SMS
 * via Twilio to every number listed in TWILIO_TO_NUMBERS.
 */

const Redis = require('ioredis');
const twilio = require('twilio');
const { REDIS, TWILIO } = require('../config/env');

const redis = new Redis({ host: REDIS.host, port: REDIS.port });

function startAlertListener() {
    const subscriber = redis.duplicate();

    subscriber.subscribe('incidents', (err) => {
        if (err) {
            console.error('[AlertService] Redis subscription error:', err);
        } else {
            console.info('[AlertService] Subscribed to `incidents` channel.');
        }
    });

    subscriber.on('message', async(_channel, rawMessage) => {
        let payload;
        try {
            payload = JSON.parse(rawMessage);
        } catch (parseErr) {
            console.error('[AlertService] Invalid JSON on incidents channel:', parseErr);
            return;
        }

        // We only care about *new* incidents (type === 'created')
        if (payload.type !== 'created') return;

        const incident = payload.incident;
        if (!incident || incident.severity !== 5) return; // only severity‑5

        // ------------------------ Twilio client ------------------------
        const client = twilio(TWILIO.accountSid, TWILIO.authToken);

        // Build a concise SMS body
        const body = `⚠️ HIGH‑SEVERITY INCIDENT
Title: ${incident.title}
Category: ${incident.category}
Severity: ${incident.severity}
Location: ${incident.location?.coordinates?.[1].toFixed(4)}, ${incident.location?.coordinates?.[0].toFixed(4)}`;

        // Destination numbers are a comma‑separated list in the env var
        const destinations = (TWILIO.toNumbers || '')
            .split(',')
            .map((n) => n.trim())
            .filter(Boolean);

        for (const to of destinations) {
            try {
                await client.messages.create({
                    body,
                    from: TWILIO.fromNumber,
                    to,
                });
                console.log(`[AlertService] ✅ SMS sent to ${to}`);
            } catch (sendErr) {
                console.error(`[AlertService] ❌ Failed to send SMS to ${to}:`, sendErr);
            }
        }
    });
}

module.exports = { startAlertListener };
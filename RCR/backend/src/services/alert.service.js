// backend/src/services/alert.service.js
const twilio = require('twilio');
const { TWILIO } = require('../config/env');

/**
 * Sends an emergency SMS via Twilio to the designated Commander phone number.
 * Triggered for high-severity incidents (Severity 4 or 5).
 * 
 * @param {object} incidentData - Data containing title, severity, roomNumber, floorLevel, etc.
 */
async function sendEmergencySMS(incidentData) {
    try {
        // 1. Initialize Twilio client
        const accountSid = process.env.TWILIO_ACCOUNT_SID || TWILIO.accountSid;
        const authToken = process.env.TWILIO_AUTH_TOKEN || TWILIO.authToken;
        const fromNumber = process.env.TWILIO_FROM_NUMBER || TWILIO.fromNumber;
        const commanderPhone = process.env.COMMANDER_PHONE_NUMBER;

        // Validation for Twilio configuration
        if (!accountSid || !authToken || !fromNumber || !commanderPhone) {
            console.warn('[AlertService] Twilio configuration or Commander phone number missing. Skipping SMS.');
            return;
        }

        // 2. Condition: ONLY trigger if severity >= 4
        if (!incidentData || incidentData.severity < 4) {
            console.log(`[AlertService] Incident severity (${incidentData?.severity}) below threshold. No SMS sent.`);
            return;
        }

        const client = twilio(accountSid, authToken);

        // 3. Build a concise, tactical SMS body
        const body = `🚨 RCR EMERGENCY ALERT
Title: ${incidentData.title}
Severity: ${incidentData.severity}/5
Location: Room ${incidentData.roomNumber || 'N/A'}, Floor ${incidentData.floorLevel || 'N/A'}, Wing ${incidentData.wingId || 'N/A'}
Status: ${incidentData.status || 'OPEN'}`;

        // 4. Resilience: Wrap API call in try...catch
        await client.messages.create({
            body,
            from: fromNumber,
            to: commanderPhone,
        });

        console.log(`[AlertService] ✅ Emergency SMS successfully sent to Commander: ${commanderPhone}`);
    } catch (error) {
        // DO NOT throw error to prevent crashing the main incident creation flow
        console.error('[AlertService] ❌ Twilio SMS Delivery Failed:', {
            message: error.message,
            code: error.code,
            incidentId: incidentData?.id
        });
    }
}

/**
 * Legacy support for the Redis listener pattern (if still needed for background sync)
 */
const startAlertListener = () => {
    console.info('[AlertService] Redis listener active (legacy). Prefer direct sendEmergencySMS calls for RCR flow.');
};

/**
 * Sends an escalation SMS for unacknowledged critical incidents.
 */
async function sendEscalationSMS(incidentData) {
    try {
        const accountSid = process.env.TWILIO_ACCOUNT_SID || TWILIO.accountSid;
        const authToken = process.env.TWILIO_AUTH_TOKEN || TWILIO.authToken;
        const fromNumber = process.env.TWILIO_FROM_NUMBER || TWILIO.fromNumber;
        const commanderPhone = process.env.COMMANDER_PHONE_NUMBER;

        if (!accountSid || !authToken || !fromNumber || !commanderPhone) return;

        const client = twilio(accountSid, authToken);
        const body = `⚠️ ESCALATION: UNACKNOWLEDGED CRITICAL\nIncident: ${incidentData.title}\nSector: ${incidentData.wingId} / FL_${incidentData.floorLevel}\nElapsed: 3m+`;

        await client.messages.create({ body, from: fromNumber, to: commanderPhone });
        console.log(`[AlertService] ✅ Escalation SMS sent to: ${commanderPhone}`);
    } catch (error) {
        console.error('[AlertService] ❌ Escalation SMS Failed:', error.message);
    }
}

module.exports = {
    sendEmergencySMS,
    sendEscalationSMS,
    startAlertListener
};


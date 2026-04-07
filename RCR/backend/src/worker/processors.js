const { Worker } = require('bullmq');
const { connection } = require('../infrastructure/queue');
const AIService = require('../services/ai.service');
const db = require('../db');
const twilio = require('twilio');
const { TWILIO } = require('../config/env');
const SocketService = require('../services/socket.service');
const StorageService = require('../infrastructure/storage');

const worker = new Worker('incident-tasks', async (job) => {
    const { type, data } = job.data;

    console.log(`[Worker] Processing job ${job.id} of type ${type}`);

    if (type === 'AI_TRIAGE') {
        const { incidentId, mediaBase64, mediaType, mediaUrl } = data;
        const incident = await db('incidents').where({ id: incidentId }).first();
        if (!incident) return;

        let finalBase64 = mediaBase64;
        
        // 🚨 RESILIENCE: If mediaBase64 is missing (optimized out by service), fetch from Storage
        if (!finalBase64 && mediaUrl && StorageService.downloadToBase64) {
            try {
                finalBase64 = await StorageService.downloadToBase64(mediaUrl);
            } catch (err) {
                console.warn(`[Worker] Failed to download media for incident ${incidentId}:`, err.message);
            }
        }

        // Perform AI Analysis
        const analysis = await AIService.analyzeReport({
            title: incident.title,
            description: incident.description,
            category: incident.category,
            userSeverity: incident.severity,
            floorLevel: incident.floor_level,
            roomNumber: incident.room_number,
            wingId: incident.wing_id,
            mediaType,
            mediaBase64: finalBase64
        });

        // Update Incident with AI results
        const [updated] = await db('incidents')
            .where({ id: incidentId })
            .update({
                auto_severity: analysis.autoSeverity,
                ai_action_plan: (analysis.actionPlan || []).join('\n'),
                ai_required_resources: JSON.stringify(analysis.requiredResources || []),
                hospitality_category: analysis.hospitalityCategory,
                spam_score: analysis.spamScore,
                status: analysis.spamScore > 0.8 ? 'REJECTED' : incident.status,
                updated_at: new Date()
            })
            .returning('*');

        // Notify via Sockets that AI analysis is complete
        await SocketService.publish(`hotel_${incident.hotel_id}_incidents`, { 
            type: 'status-updated', 
            incident: updated 
        });

        // If severity is 5, queue an SMS alert
        if (updated.severity === 5 || updated.auto_severity === 5) {
            // 🚨 CIRCULAR DEP FIX: Use global incidentQueue if possible or require just-in-time
            const { incidentQueue } = require('../infrastructure/queue');
            await incidentQueue.add('SEND_SMS', { 
                type: 'SEND_SMS', 
                data: { incidentId: updated.id } 
            }, { 
                removeOnComplete: true,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 }
            });
        }
    }

    if (type === 'SEND_SMS') {
        const { incidentId } = data;
        const incident = await db('incidents').where({ id: incidentId }).first();
        
        if (!incident || !TWILIO.accountSid || !TWILIO.authToken) {
            console.warn('[Worker] SMS skipped: Incident not found or Twilio not configured');
            return;
        }

        const client = twilio(TWILIO.accountSid, TWILIO.authToken);
        const body = `⚠️ CRITICAL INCIDENT (L5)\nTitle: ${incident.title}\nZone: Wing ${incident.wing_id}, Fl ${incident.floor_level}, Rm ${incident.room_number}\nStatus: ${incident.status}`;

        const destinations = (TWILIO.toNumbers || '').split(',').map(n => n.trim()).filter(Boolean);

        for (const to of destinations) {
            try {
                await client.messages.create({ body, from: TWILIO.fromNumber, to });
                console.log(`[Worker] ✅ SMS dispatched to ${to}`);
            } catch (err) {
                console.error(`[Worker] ❌ SMS failed for ${to}:`, err.message);
            }
        }
    }
}, { 
    connection,
    concurrency: 5 // 🚨 PERFORMANCE: Allow parallel processing
});

worker.on('completed', job => {
    console.log(`[Worker] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job.id} failed: ${err.message}`);
});

module.exports = worker;

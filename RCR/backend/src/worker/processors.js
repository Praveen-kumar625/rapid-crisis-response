const { Worker } = require('bullmq');
const { connection } = require('../infrastructure/queue');
const AIService = require('../services/ai.service');
const db = require('../db');
const twilio = require('twilio');
const { TWILIO } = require('../config/env');
const SocketService = require('../services/socket.service');
const StorageService = require('../infrastructure/storage');
const TaskService = require('../services/task.service');

const worker = new Worker('incident-tasks', async (job) => {
    const { type, data } = job.data;

    console.log(`[Worker] Processing job ${job.id} of type ${type}`);

    if (type === 'AI_TRIAGE') {
        const { incidentId, mediaBase64, mediaType, mediaUrl } = data;
        const incident = await db('incidents').where({ id: incidentId }).first();
        if (!incident) return;

        let finalBase64 = mediaBase64;
        
        if (!finalBase64 && mediaUrl && StorageService.downloadToBase64) {
            try {
                finalBase64 = await StorageService.downloadToBase64(mediaUrl);
            } catch (err) {
                console.warn(`[Worker] Failed to download media for incident ${incidentId}:`, err.message);
            }
        }

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

        if (analysis.actionPlan && analysis.actionPlan.length > 0) {
            await TaskService.createTasksFromPlan(
                incidentId, 
                analysis.actionPlan, 
                analysis.hospitalityCategory === 'MEDICAL' ? 'MEDIC' : 'SECURITY'
            );
        }

        await SocketService.publish(`hotel_${incident.hotel_id}_incidents`, { 
            type: 'status-updated', 
            incident: updated 
        });

        if (updated.severity === 5 || updated.auto_severity === 5) {
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

    if (type === 'TASK_DISPATCH') {
        const { taskId } = data;
        const task = await db('tasks').where({ id: taskId }).first();
        
        if (task && ['PENDING', 'DISPATCHED'].includes(task.status)) {
            const incident = await db('incidents').where({ id: task.incident_id }).first();
            if (!incident || !TWILIO.accountSid || !TWILIO.authToken) return;

            const client = twilio(TWILIO.accountSid, TWILIO.authToken);
            const body = `🚨 TASK OVERRIDE: ${task.assigned_role}\nTask: ${task.instruction}\nIncident: ${incident.title}\nZone: Wing ${incident.wing_id}, Fl ${incident.floor_level}`;

            const destinations = (TWILIO.toNumbers || '').split(',').map(n => n.trim()).filter(Boolean);

            for (const to of destinations) {
                try {
                    await client.messages.create({ body, from: TWILIO.fromNumber, to });
                    console.log(`[Worker] ✅ Task fallback SMS dispatched to ${to}`);
                } catch (err) {
                    console.error(`[Worker] ❌ Task fallback SMS failed:`, err.message);
                }
            }

            await db('tasks').where({ id: taskId }).update({ status: 'DISPATCHED', updated_at: new Date() });
        }
    }

    if (type === 'MASS_SMS_BROADCAST') {
        const { hotelId, message } = data;
        if (!TWILIO.accountSid || !TWILIO.authToken) return;

        const users = await db('users').where({ hotel_id: hotelId });
        const client = twilio(TWILIO.accountSid, TWILIO.authToken);

        for (const user of users) {
            try {
                // Using email as placeholder for phone if phone column not yet populated in demo
                await client.messages.create({ body: message, from: TWILIO.fromNumber, to: user.email });
                console.log(`[Worker] ✅ Mass SMS dispatched to ${user.email}`);
            } catch (err) {
                console.error(`[Worker] ❌ Mass SMS failed for ${user.email}:`, err.message);
            }
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
    concurrency: 5 
});

worker.on('completed', job => {
    console.log(`[Worker] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job.id} failed: ${err.message}`);
});

module.exports = worker;

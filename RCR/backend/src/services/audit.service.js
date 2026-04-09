// RCR/backend/src/services/audit.service.js
const db = require('../db');

/**
 * Logs a system or user action for audit purposes.
 */
exports.log = async ({ incidentId, actionType, actorId, payload = {}, description = '' }) => {
    try {
        const [logEntry] = await db('audit_logs')
            .insert({
                incident_id: incidentId,
                action_type: actionType,
                actor_id: actorId,
                payload: JSON.stringify(payload),
                description
            })
            .returning('*');
        
        console.log(`[Audit] Action Logged: ${actionType} by ${actorId}`);
        return logEntry;
    } catch (err) {
        console.error('[Audit Service] Failed to log action:', err.message);
        // We don't throw here to avoid breaking the main transaction flow, 
        // but in a real production app, we might use a secondary logging sink.
    }
};

/**
 * Retrieves audit history for a specific incident.
 */
exports.getIncidentHistory = async (incidentId) => {
    return db('audit_logs')
        .where({ incident_id: incidentId })
        .orderBy('created_at', 'desc');
};

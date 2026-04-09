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
 * Logs a specific responder action to the response_logs table for crisis auditing.
 */
exports.logResponseAction = async ({ incidentId, userId, action, previousStatus, newStatus, note = '', metadata = {} }) => {
    try {
        const [logEntry] = await db('response_logs')
            .insert({
                incident_id: incidentId,
                user_id: userId,
                action,
                previous_status: previousStatus,
                new_status: newStatus,
                note,
                metadata: JSON.stringify(metadata)
            })
            .returning('*');
        
        console.log(`[ResponseLog] Action Recorded: ${action} for incident ${incidentId}`);
        return logEntry;
    } catch (err) {
        console.error('[Audit Service] Failed to log response action:', err.message);
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

// RCR/backend/src/services/task.service.js
const db = require('../db');
const SocketService = require('./socket.service');
const { incidentQueue } = require('../infrastructure/queue');

/**
 * Create tasks from an AI-generated action plan.
 * @param {string} incidentId - The UUID of the parent incident.
 * @param {string[]} actionPlan - Array of instructions from Gemini.
 * @param {string} role - The default role to assign (e.g., 'SECURITY').
 */
exports.createTasksFromPlan = async (incidentId, actionPlan, role = 'SECURITY') => {
    if (!actionPlan || !Array.isArray(actionPlan)) return [];

    const tasksToInsert = actionPlan.map(instruction => ({
        incident_id: incidentId,
        instruction,
        assigned_role: role,
        status: 'PENDING'
    }));

    const insertedTasks = await db('tasks')
        .insert(tasksToInsert)
        .returning('*');

    // Notify via Sockets that new tasks are available
    const incident = await db('incidents').where({ id: incidentId }).first();
    if (incident) {
        await SocketService.publish(`hotel_${incident.hotel_id}_tasks`, { 
            type: 'tasks-created', 
            incidentId,
            tasks: insertedTasks 
        });

        // 🚨 ULTRA LEVEL: Schedule "Dead Man's Switch" for each task
        for (const task of insertedTasks) {
            await incidentQueue.add('TASK_DISPATCH', { 
                type: 'TASK_DISPATCH', 
                data: { taskId: task.id } 
            }, { 
                delay: 5000, // 5 seconds wait for WebSocket ACK
                jobId: `dispatch_${task.id}`, // Unique ID to allow cancellation
                removeOnComplete: true
            });
        }
    }

    return insertedTasks;
};

/**
 * Mark a task as acknowledged by a responder (cancels SMS fallback).
 */
exports.acknowledgeTask = async (taskId) => {
    // 1. Update DB
    const [task] = await db('tasks')
        .where({ id: taskId })
        .update({ 
            status: 'ACKNOWLEDGED',
            updated_at: new Date() 
        })
        .returning('*');

    if (!task) return null;

    // 2. Cancel the Dead Man's Switch (SMS fallback)
    try {
        const job = await incidentQueue.getJob(`dispatch_${taskId}`);
        if (job) await job.remove();
    } catch (err) {
        console.warn(`[TaskService] Failed to remove fallback job for task ${taskId}:`, err.message);
    }

    // 3. Broadcast
    const incident = await db('incidents').where({ id: task.incident_id }).first();
    if (incident) {
        await SocketService.publish(`hotel_${incident.hotel_id}_tasks`, { 
            type: 'task-updated', 
            task 
        });
    }

    return task;
};

/**
 * Automatically assigns a task to the most suitable available responder.
 */
exports.assignBestResponder = async (taskId) => {
    const task = await db('tasks').where({ id: taskId }).first();
    if (!task || task.assigned_to) return null;

    const incident = await db('incidents').where({ id: task.incident_id }).first();
    if (!incident) return null;

    // Find available responders with the required role in the same hotel
    const responders = await db('users')
        .where({ 
            hotel_id: incident.hotel_id, 
            role: 'RESPONDER',
            responder_status: 'AVAILABLE'
        })
        .where(function() {
            this.where('responder_role', task.assigned_role)
                .orWhere('responder_role', 'GENERAL');
        });

    if (responders.length === 0) return null;

    // Distance-weighted selection (prefer same floor/wing)
    const bestResponder = responders.reduce((best, curr) => {
        let score = 0;
        if (curr.current_floor === incident.floor_level) score += 50;
        if (curr.current_wing === incident.wing_id) score += 30;
        if (curr.responder_role === task.assigned_role) score += 20;
        
        return score > best.score ? { responder: curr, score } : best;
    }, { responder: responders[0], score: -1 }).responder;

    const [updatedTask] = await db('tasks')
        .where({ id: taskId })
        .update({ 
            assigned_to: bestResponder.id,
            status: 'DISPATCHED',
            updated_at: new Date()
        })
        .returning('*');

    // Also mark responder as BUSY
    await db('users')
        .where({ id: bestResponder.id })
        .update({ responder_status: 'BUSY' });

    // Broadcast update
    await SocketService.publish(`hotel_${incident.hotel_id}_tasks`, { 
        type: 'task-assigned', 
        task: updatedTask,
        responderName: bestResponder.name
    });

    return updatedTask;
};

/**
 * Update responder availability and location.
 */
exports.updateResponderStatus = async (userId, status, floor, wing) => {
    const [user] = await db('users')
        .where({ id: userId })
        .update({
            responder_status: status,
            current_floor: floor,
            current_wing: wing,
            last_location_update: new Date()
        })
        .returning('*');

    if (user && user.hotel_id) {
        await SocketService.publish(`hotel_${user.hotel_id}_responders`, {
            type: 'presence-update',
            responder: {
                id: user.id,
                name: user.name,
                status: user.responder_status,
                floor: user.current_floor,
                wing: user.current_wing,
                role: user.responder_role
            }
        });
    }

    return user;
};

/**
 * Update the status of a specific tactical task.
 */
exports.updateTaskStatus = async (taskId, status, evidenceUrl = null) => {
    const [task] = await db('tasks')
        .where({ id: taskId })
        .update({ 
            status, 
            evidence_url: evidenceUrl,
            updated_at: new Date() 
        })
        .returning('*');

    if (!task) return null;

    // Fetch incident to get hotel context for broadcasting
    const incident = await db('incidents').where({ id: task.incident_id }).first();
    if (incident) {
        await SocketService.publish(`hotel_${incident.hotel_id}_tasks`, { 
            type: 'task-updated', 
            task 
        });
    }

    return task;
};

/**
 * Get all tasks for a specific incident.
 */
exports.getByIncidentId = async (incidentId) => {
    return db('tasks')
        .where({ incident_id: incidentId })
        .orderBy('created_at', 'asc');
};

/**
 * Get pending/dispatched tasks for a specific role in a hotel.
 */
exports.getPendingByRole = async (hotelId, role) => {
    return db('tasks')
        .join('incidents', 'tasks.incident_id', '=', 'incidents.id')
        .where({ 
            'incidents.hotel_id': hotelId,
            'tasks.assigned_role': role 
        })
        .whereIn('tasks.status', ['PENDING', 'DISPATCHED', 'ACKNOWLEDGED'])
        .select('tasks.*', 'incidents.title as incident_title', 'incidents.severity as incident_severity');
};

// src/services/incident.service.js
const db = require('../db');
const SocketService = require('./socket.service');
const AIService = require('../services/ai.service');
const AuditService = require('./audit.service');
const { incidentQueue } = require('../infrastructure/queue');
const StorageService = require('../infrastructure/storage');

/**
 * List incidents – Simple SQL filtering (No PostGIS required)
 */
exports.list = async({ bbox, wingId, floorLevel, roomNumber, hotelId } = {}) => {
    let query = db('incidents')
        .select(
            'id', 'title', 'description', 'severity', 'category', 'status',
            'floor_level as floorLevel', 'room_number as roomNumber', 'wing_id as wingId',
            'hospitality_category as hospitalityCategory', 'spam_score', 'auto_severity',
            'triage_method as triageMethod', 'ai_action_plan as actionPlan',
            'ai_required_resources as requiredResources', 'media_type as mediaType', 'media_url as mediaUrl',
            'sensor_metadata as sensorMetadata',
            'lat', 'lng', 'indoor_lat as indoorLat', 'indoor_lng as indoorLng',
            'reported_by as reportedBy', 'hotel_id as hotelId',
            'created_at as createdAt', 'updated_at as updatedAt'
        );

    if (hotelId) query = query.where('hotel_id', hotelId);

    // Simple BBOX filtering using standard numbers
    if (bbox) {
        const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
        query = query.whereBetween('lng', [minLng, maxLng]).whereBetween('lat', [minLat, maxLat]);
    }

    if (wingId) query = query.where('wing_id', wingId);
    if (typeof floorLevel !== 'undefined') query = query.where('floor_level', Number(floorLevel));
    if (roomNumber) query = query.where('room_number', roomNumber);

    const rows = await query;
    return rows.map(r => ({
        ...r,
        location: { type: 'Point', coordinates: [r.lng, r.lat] },
        indoorLocation: r.indoorLat ? { type: 'Point', coordinates: [r.indoorLng, r.indoorLat] } : null
    }));
};

/**
 * Create a new incident
 */
exports.create = async({
    title, description, severity, category, lat, lng,
    floorLevel, roomNumber, wingId, indoorLocation,
    reportedBy, mediaType, mediaBase64, mediaUrl, hotelId,
    sensorMetadata,
    triageMethod = 'Cloud AI'
}) => {
    // 1. Upload to Cloud Storage if media exists
    let finalMediaUrl = mediaUrl;
    if (!finalMediaUrl && mediaBase64) {
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${mediaType ? mediaType.split('/')[1] : 'bin'}`;
        finalMediaUrl = await StorageService.uploadBase64(mediaBase64, mediaType, fileName);
    }

    // 2. Insert minimal incident record
    const [incident] = await db('incidents')
        .insert({
            title, description, severity, category,
            lat, lng, 
            indoor_lat: indoorLocation ? indoorLocation.lat : lat,
            indoor_lng: indoorLocation ? indoorLocation.lng : lng,
            floor_level: floorLevel || 1,
            room_number: roomNumber || 'unknown',
            wing_id: wingId || 'unknown',
            reported_by: reportedBy,
            hotel_id: hotelId,
            status: 'OPEN',
            triage_method: triageMethod,
            media_type: mediaType,
            media_url: finalMediaUrl,
            sensor_metadata: sensorMetadata || null
        })
        .returning('*');

    // 🚨 PHASE 4: AUDIT LOG
    await AuditService.log({
        incidentId: incident.id,
        actionType: 'INCIDENT_CREATED',
        actorId: reportedBy || 'system',
        description: `New ${category} incident at level ${severity} via ${triageMethod}`
    });

    // 3. Notify via Sockets
    const tenantTopic = `hotel_${hotelId}`;
    await SocketService.publish(`${tenantTopic}_incidents`, { type: 'created', incident });

    // 4. Queue Background Tasks (AI Triage)
    const shouldPassBase64 = mediaBase64 && mediaBase64.length < 500000;
    await incidentQueue.add('AI_TRIAGE', { 
        type: 'AI_TRIAGE', 
        data: { 
            incidentId: incident.id,
            mediaBase64: shouldPassBase64 ? mediaBase64 : null, 
            mediaUrl: finalMediaUrl,
            mediaType
        } 
    });

    return incident;
};

/**
 * Mass Broadcast an emergency alert to all users in a hotel.
 */
exports.broadcastAlert = async (hotelId, { message, severity = 5, wingId = null, floorLevel = null }) => {
    // 1. WebSocket Broadcast
    const topic = `hotel_${hotelId}_broadcast`;
    await SocketService.publish(topic, { 
        type: 'EMERGENCY_BROADCAST', 
        message, 
        severity, 
        wingId, 
        floorLevel 
    });

    // 2. Audit Log
    await AuditService.log({
        actionType: 'MASS_ALERT_DISPATCHED',
        actorId: 'admin',
        description: `Mass alert sent to hotel ${hotelId}: ${message}`,
        payload: { message, severity, wingId, floorLevel }
    });

    // 3. Queue SMS Broadcast for high severity
    if (severity >= 4) {
        await incidentQueue.add('MASS_SMS_BROADCAST', { 
            hotelId, 
            message: `🚨 RCR EMERGENCY: ${message}` 
        });
    }

    return { success: true };
};

exports.getById = async(id, hotelId) => {
    let query = db('incidents')
        .select(
            'id', 'title', 'description', 'severity', 'category', 'status',
            'floor_level as floorLevel', 'room_number as roomNumber', 'wing_id as wingId',
            'hospitality_category as hospitalityCategory', 'spam_score', 'auto_severity',
            'triage_method as triageMethod', 'ai_action_plan as actionPlan',
            'ai_required_resources as requiredResources', 'media_type as mediaType', 'media_url as mediaUrl',
            'sensor_metadata as sensorMetadata',
            'lat', 'lng', 'indoor_lat as indoorLat', 'indoor_lng as indoorLng',
            'reported_by as reportedBy', 'hotel_id as hotelId',
            'created_at as createdAt', 'updated_at as updatedAt'
        )
        .where({ id });

    if (hotelId) query = query.where('hotel_id', hotelId);

    const row = await query.first();
    if (!row) return null;

    return {
        ...row,
        location: { type: 'Point', coordinates: [row.lng, row.lat] },
        indoorLocation: row.indoorLat ? { type: 'Point', coordinates: [row.indoorLng, row.indoorLat] } : null
    };
};

exports.updateStatus = async(id, newStatus, hotelId) => {
    const query = db('incidents').where({ id });
    if (hotelId) query.andWhere({ hotel_id: hotelId });

    const [incident] = await query.update({ 
        status: newStatus,
        updated_at: new Date()
    }).returning('*');

    if (incident) {
        // 🚨 PHASE 4: AUDIT LOG
        await AuditService.log({
            incidentId: incident.id,
            actionType: 'STATUS_CHANGE',
            actorId: 'admin',
            description: `Status changed to ${newStatus}`,
            payload: { newStatus }
        });

        await SocketService.publish(`hotel_${hotelId}_incidents`, { type: 'status-updated', incident });
    }
    return incident;
};

exports.analyzeVoice = async({ audioBase64, audioMimeType, floorLevel, roomNumber, wingId, lat, lng, reportedBy, hotelId }) => {
    const analysis = await AIService.analyzeVoice({ audioBase64, audioMimeType, floorLevel, roomNumber, wingId, lat, lng });
    
    const incident = await exports.create({
        title: analysis.translatedText ? `Voice report: ${analysis.hospitalityCategory}` : 'Voice Incident',
        description: analysis.translatedText || '',
        severity: analysis.autoSeverity || 3,
        category: analysis.hospitalityCategory || 'INFRASTRUCTURE',
        lat, lng, floorLevel, roomNumber, wingId,
        mediaType: audioMimeType || 'audio/webm',
        mediaBase64: audioBase64,
        reportedBy, hotelId,
        triageMethod: 'Cloud AI (Voice)'
    });

    return { analysis, incident };
};

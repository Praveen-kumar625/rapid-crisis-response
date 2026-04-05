// src/services/incident.service.js
const db = require('../db');
const SocketService = require('./socket.service');
const AIService = require('../services/ai.service');

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

const { incidentQueue } = require('../infrastructure/queue');

const StorageService = require('../infrastructure/storage');

/**
 * Create a new incident
 */
exports.create = async({
    title, description, severity, category, lat, lng,
    floorLevel, roomNumber, wingId, indoorLocation,
    reportedBy, mediaType, mediaBase64, hotelId,
    triageMethod = 'Cloud AI'
}) => {
    // 1. Upload to Cloud Storage if media exists
    let mediaUrl = null;
    if (mediaBase64) {
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${mediaType.split('/')[1] || 'bin'}`;
        mediaUrl = await StorageService.uploadBase64(mediaBase64, mediaType, fileName);
    }

    // 2. Insert minimal incident record immediately for fast response
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
            media_url: mediaUrl
        })
        .returning('*');

    // 3. Notify via Sockets (Fast path)
    const tenantTopic = `hotel_${hotelId}`;
    await SocketService.publish(`${tenantTopic}_incidents`, { type: 'created', incident });

    // 4. Queue Background Tasks (AI Triage, which will later trigger SMS if needed)
    await incidentQueue.add('AI_TRIAGE', { 
        type: 'AI_TRIAGE', 
        data: { 
            incidentId: incident.id,
            mediaBase64, // Pass through for AI analysis to avoid DB/S3 roundtrip in worker
            mediaType
        } 
    });

    return incident;
};

exports.getById = async(id, hotelId) => {
    let query = db('incidents')
        .select(
            'id', 'title', 'description', 'severity', 'category', 'status',
            'floor_level as floorLevel', 'room_number as roomNumber', 'wing_id as wingId',
            'hospitality_category as hospitalityCategory', 'spam_score', 'auto_severity',
            'triage_method as triageMethod', 'ai_action_plan as actionPlan',
            'ai_required_resources as requiredResources', 'media_type as mediaType', 'media_url as mediaUrl',
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

    const [incident] = await query.update({ status: newStatus }).returning('*');
    if (incident) {
        await SocketService.publish(`hotel_${hotelId}_incidents`, { type: 'status-updated', incident });
    }
    return incident;
};

exports.analyzeVoice = async({ audioBase64, audioMimeType, floorLevel, roomNumber, wingId, lat, lng, reportedBy, hotelId }) => {
    // Note: For voice, we still do in-line transcription to show the user immediate feedback,
    // but the incident creation now follows the async pattern for everything else.
    const analysis = await AIService.analyzeVoice({ audioBase64, audioMimeType, floorLevel, roomNumber, wingId, lat, lng });
    
    const incident = await exports.create({
        title: analysis.translated_english_text ? `Voice report: ${analysis.hospitality_category}` : 'Voice Incident',
        description: analysis.translated_english_text || '',
        severity: analysis.auto_severity || 3,
        category: analysis.hospitality_category || 'INFRASTRUCTURE',
        lat, lng, floorLevel, roomNumber, wingId,
        mediaType: audioMimeType || 'audio/webm',
        mediaBase64: audioBase64,
        reportedBy, hotelId,
        triageMethod: 'Cloud AI (Voice)'
    });

    return { analysis, incident };
};

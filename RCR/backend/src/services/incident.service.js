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
            'ai_required_resources as requiredResources', 'media_type as mediaType', 'media_base64 as mediaBase64',
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
    reportedBy, mediaType, mediaBase64, hotelId,
    preAnalysis = null, triageMethod = 'Cloud AI'
}) => {
    const analysis = preAnalysis || await AIService.analyzeReport({
        title, description, category, userSeverity: severity,
        mediaType, mediaBase64, floorLevel, roomNumber, wingId
    });

    const { spam_score = 0, auto_severity = severity, hospitality_category } = analysis;

    let finalSeverity = severity;
    let status = 'OPEN';
    if (spam_score > 0.8) status = 'REJECTED';
    else if (auto_severity > severity) finalSeverity = auto_severity;

    const [incident] = await db('incidents')
        .insert({
            title, description, severity: finalSeverity, category,
            lat, lng, 
            indoor_lat: indoorLocation ? indoorLocation.lat : lat,
            indoor_lng: indoorLocation ? indoorLocation.lng : lng,
            floor_level: floorLevel || 1,
            room_number: roomNumber || 'unknown',
            wing_id: wingId || 'unknown',
            reported_by: reportedBy,
            hotel_id: hotelId,
            status,
            spam_score,
            auto_severity,
            hospitality_category: hospitality_category || 'INFRASTRUCTURE',
            triage_method: triageMethod,
            ai_action_plan: analysis.actionPlan,
            ai_required_resources: analysis.requiredResources || [],
            media_type: mediaType,
            media_base64: mediaBase64
        })
        .returning('*');

    // Notify via Sockets
    const tenantTopic = `hotel_${hotelId}`;
    await SocketService.publish(`${tenantTopic}_incidents`, { type: 'created', incident });

    return incident;
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
    const analysis = await AIService.analyzeVoice({ audioBase64, audioMimeType, floorLevel, roomNumber, wingId, lat, lng });
    const incident = await exports.create({
        title: analysis.translated_english_text ? `Voice report: ${analysis.hospitality_category}` : 'Voice Incident',
        description: analysis.translated_english_text || '',
        severity: analysis.auto_severity || 3,
        category: analysis.hospitality_category || 'INFRASTRUCTURE',
        lat, lng, floorLevel, roomNumber, wingId,
        mediaType: audioMimeType || 'audio/webm',
        mediaBase64: audioBase64,
        reportedBy, hotelId, preAnalysis: analysis,
        triageMethod: 'Cloud AI (Voice)'
    });
    return { analysis, incident };
};

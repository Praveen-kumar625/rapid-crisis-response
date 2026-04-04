// src/services/incident.service.js
const db = require('../db');
const SocketService = require('./socket.service');
const AIService = require('../services/ai.service');

/**
 * Helper – converts PostGIS geometry to GeoJSON Point
 */
function geometryToGeoJSON(geom) {
    if (!geom) return null;
    return typeof geom === 'string' ? JSON.parse(geom) : geom;
}

/**
 * List incidents – optional bbox filtering and mandatory hotelId filtering
 */
exports.list = async({ bbox, wingId, floorLevel, roomNumber, hotelId } = {}) => {
    let query = db('incidents')
        .select(
            'id',
            'title',
            'description',
            'severity',
            'category',
            'status',
            'floor_level as floorLevel',
            'room_number as roomNumber',
            'wing_id as wingId',
            'hospitality_category as hospitalityCategory',
            'spam_score',
            'auto_severity',
            'triage_method as triageMethod',
            'ai_action_plan as actionPlan',
            'ai_required_resources as requiredResources',
            'media_type as mediaType',
            'media_base64 as mediaBase64',
            db.raw('ST_AsGeoJSON(location) as location'),
            db.raw('ST_AsGeoJSON(indoor_location) as indoorLocation'),
            'reported_by as reportedBy',
            'hotel_id as hotelId',
            'created_at as createdAt',
            'updated_at as updatedAt'
        );

    // STRICT Tenant Isolation
    if (!hotelId) throw new Error('Tenant Isolation Violation: hotelId is required.');
    query = query.where('hotel_id', hotelId);

    if (bbox) {
        const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
        query = query.whereRaw(
            `ST_Intersects(location, ST_MakeEnvelope(?, ?, ?, ?, 4326))`, [minLng, minLat, maxLng, maxLat]
        );
    }

    if (wingId) query = query.where('wing_id', wingId);
    if (typeof floorLevel !== 'undefined') query = query.where('floor_level', Number(floorLevel));
    if (roomNumber) query = query.where('room_number', roomNumber);

    const rows = await query;
    return rows.map((r) => ({
        ...r,
        location: geometryToGeoJSON(r.location),
        indoorLocation: geometryToGeoJSON(r.indoorLocation),
    }));
};

/**
 * Get a single incident by ID – scoped to hotelId
 */
exports.getById = async(id, hotelId) => {
    const query = db('incidents').where({ id });
    
    if (!hotelId) throw new Error('Tenant Isolation Violation: hotelId is required.');
    query.andWhere({ hotel_id: hotelId });

    const rows = await query.select(
            'id',
            'title',
            'description',
            'severity',
            'category',
            'hospitality_category as hospitalityCategory',
            'status',
            'floor_level as floorLevel',
            'room_number as roomNumber',
            'wing_id as wingId',
            'spam_score',
            'auto_severity',
            'triage_method as triageMethod',
            'ai_action_plan as actionPlan',
            'ai_required_resources as requiredResources',
            'media_type as mediaType',
            'media_base64 as mediaBase64',
            db.raw('ST_AsGeoJSON(location) as location'),
            db.raw('ST_AsGeoJSON(indoor_location) as indoorLocation'),
            'reported_by as reportedBy',
            'hotel_id as hotelId',
            'created_at as createdAt',
            'updated_at as updatedAt'
        );

    if (!rows.length) return null;
    const inc = rows[0];
    inc.location = geometryToGeoJSON(inc.location);
    inc.indoorLocation = geometryToGeoJSON(inc.indoorLocation);
    return inc;
};

/**
 * Create a new incident – persisted with hotel_id
 */
exports.create = async({
    title,
    description,
    severity,
    category,
    lat,
    lng,
    floorLevel,
    roomNumber,
    wingId,
    indoorLocation,
    reportedBy,
    mediaType,
    mediaBase64,
    hotelId,
    preAnalysis = null,
    triageMethod = 'Cloud AI (Gemini)',
}) => {
    const validatedFloor = Number.isInteger(Number(floorLevel)) ? Number(floorLevel) : 1;
    const validatedRoom = roomNumber ? String(roomNumber) : 'unknown';
    const validatedWing = wingId ? String(wingId) : 'unknown';

    if (!hotelId) throw new Error('Tenant ID is required to create an incident.');

    // 1. AI Triage (Skip if pre-analyzed by Edge AI or Voice flow)
    const analysis = preAnalysis || await AIService.analyzeReport({
        title,
        description,
        category,
        userSeverity: severity,
        mediaType,
        mediaBase64,
        floorLevel: validatedFloor,
        roomNumber: validatedRoom,
        wingId: validatedWing,
    });

    const {
        spam_score = 0,
        auto_severity = severity,
        actionPlan,
        requiredResources,
        predictedCategory,
        hospitality_category,
    } = analysis;

    const finalCategory = predictedCategory || category;
    const finalHospitalityCategory = hospitality_category || (category ? category.toUpperCase() : 'INFRASTRUCTURE');

    // 2. Triage Logic
    let finalSeverity = severity;
    let status = 'OPEN';

    if (spam_score > 0.8) {
        status = 'REJECTED';
    } else if (auto_severity && auto_severity > severity) {
        finalSeverity = auto_severity;
    }

    // 3. PostGIS Persistence
    const location = db.raw(`ST_SetSRID(ST_MakePoint(?, ?), 4326)::geometry`, [lng, lat]);
    const indoor = indoorLocation ?
        db.raw(`ST_SetSRID(ST_MakePoint(?, ?), 4326)::geometry`, [indoorLocation.lng, indoorLocation.lat]) :
        location;

    const [incident] = await db('incidents')
        .insert({
            title,
            description,
            severity: finalSeverity,
            category: finalCategory,
            hospitality_category: finalHospitalityCategory,
            floor_level: validatedFloor,
            room_number: validatedRoom,
            wing_id: validatedWing,
            location,
            indoor_location: indoor,
            reported_by: reportedBy,
            hotel_id: hotelId, // Persist Tenant ID
            status,
            spam_score,
            auto_severity,
            triage_method: triageMethod,
            ai_action_plan: actionPlan,
            ai_required_resources: requiredResources || [],
            media_type: mediaType,
            media_base64: mediaBase64,
        })
        .returning('*');

    // 4. Real-time Segregated Notifications
    const tenantTopic = `hotel_${hotelId}`;
    
    // Notify general hotel channel
    await SocketService.publish(`${tenantTopic}_incidents`, { type: 'created', incident });

    // Notify specific role channels within the hotel
    const roleChannels = [];
    switch (finalHospitalityCategory) {
        case 'FIRE': roleChannels.push('staff_fire', 'staff_medical', 'staff_infrastructure'); break;
        case 'MEDICAL': roleChannels.push('staff_medical'); break;
        case 'SECURITY': roleChannels.push('staff_security'); break;
        default: roleChannels.push('staff_general');
    }

    for (const ch of roleChannels) {
        await SocketService.publish(`${tenantTopic}_${ch}`, { type: 'created', incident });
    }

    return incident;
};

exports.analyzeReport = async(params) => AIService.analyzeReport(params);

exports.analyzeVoice = async({ audioBase64, audioMimeType, floorLevel, roomNumber, wingId, lat, lng, reportedBy, hotelId }) => {
    const analysis = await AIService.analyzeVoice({ audioBase64, audioMimeType, floorLevel, roomNumber, wingId, lat, lng });

    const incident = await exports.create({
        title: analysis.translated_english_text ? `Voice report: ${analysis.hospitality_category}` : 'Voice Incident',
        description: analysis.translated_english_text || '',
        severity: analysis.auto_severity || 3,
        category: analysis.hospitality_category || 'INFRASTRUCTURE',
        lat,
        lng,
        floorLevel,
        roomNumber,
        wingId,
        mediaType: 'audio/base64',
        mediaBase64: audioBase64,
        reportedBy,
        hotelId,
        preAnalysis: analysis,
        triageMethod: 'Cloud AI (Gemini Voice)'
    });

    return { analysis, incident };
};

exports.updateStatus = async(id, newStatus, hotelId) => {
    const query = db('incidents').where({ id });
    if (!hotelId) throw new Error('Tenant Isolation Violation: hotelId is required.');
    query.andWhere({ hotel_id: hotelId });

    const [incident] = await query.update({ status: newStatus }).returning('*');

    if (incident) {
        await SocketService.publish(`hotel_${hotelId}_incidents`, {
            type: 'status-updated',
            incident,
        });
    }

    return incident;
};

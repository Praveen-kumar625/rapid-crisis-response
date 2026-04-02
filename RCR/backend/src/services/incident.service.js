// src/services/incident.service.js
const db = require('../db');
const SocketService = require('./socket.service');
const AIService = require('../services/ai.service'); // new mock AI service

/**
 * Helper – converts PostGIS geometry to GeoJSON Point
 */
function geometryToGeoJSON(geom) {
    return JSON.parse(geom);
}

/**
 * List incidents – optional bbox filtering
 */
exports.list = async({ bbox, wingId, floorLevel, roomNumber } = {}) => {
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
            'ai_action_plan as actionPlan',
            'ai_required_resources as requiredResources',
            'media_type as mediaType',
            'media_base64 as mediaBase64',
            db.raw('ST_AsGeoJSON(location) as location'),
            db.raw('ST_AsGeoJSON(indoor_location) as indoorLocation'),
            'reported_by as reportedBy',
            'created_at as createdAt',
            'updated_at as updatedAt'
        );

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
 * Get a single incident by ID
 */
exports.getById = async(id) => {
    const rows = await db('incidents')
        .where({ id })
        .select(
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
            'ai_action_plan as actionPlan',
            'ai_required_resources as requiredResources',
            'media_type as mediaType',
            'media_base64 as mediaBase64',
            db.raw('ST_AsGeoJSON(location) as location'),
            db.raw('ST_AsGeoJSON(indoor_location) as indoorLocation'),
            'reported_by as reportedBy',
            'created_at as createdAt',
            'updated_at as updatedAt'
        );

    if (!rows.length) return null;
    const inc = rows[0];
    inc.location = geometryToGeoJSON(inc.location);
    return inc;
};

/**
 * Create a new incident (called by the controller).
 * Includes AI verification (spam score + auto severity) before persisting.
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
}) => {
    // enforce indoor context data
    const validatedFloor = Number.isInteger(Number(floorLevel)) ? Number(floorLevel) : 1;
    const validatedRoom = roomNumber ? String(roomNumber) : 'unknown';
    const validatedWing = wingId ? String(wingId) : 'unknown';

    // -------------------------------------------------
    // 1️⃣  Call the AI verification + recommendation service
    // -------------------------------------------------
    const {
        spam_score,
        auto_severity,
        actionPlan,
        requiredResources,
        predictedCategory,
        hospitality_category,
    } = await AIService.analyzeReport({
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

    const finalCategory = predictedCategory || category;
    const finalHospitalityCategory = hospitality_category || (category ? category.toUpperCase() : 'INFRASTRUCTURE');

    // -------------------------------------------------
    // 2️⃣ Determine final status and severity
    // -------------------------------------------------
    let finalSeverity = severity;
    let status = 'OPEN';

    if (spam_score > 0.8) {
        status = 'REJECTED';
        finalSeverity = severity;
    } else {
        if (auto_severity && auto_severity > severity) {
            finalSeverity = auto_severity;
        }
    }

    // -------------------------------------------------
    // 3️⃣ Persist
    // -------------------------------------------------
    const location = db.raw(
        `ST_SetSRID(ST_MakePoint(?, ?), 4326)::geometry`, [lng, lat]
    );
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
            status,
            spam_score,
            auto_severity,
            ai_action_plan: actionPlan,
            ai_required_resources: requiredResources || [],
            media_type: mediaType,
            media_base64: mediaBase64,
        })
        .returning('*');

    // -------------------------------------------------
    // 4️⃣ Publish to Redis (global and role-selected)
    // -------------------------------------------------
    await SocketService.publish('incidents', {
        type: 'created',
        incident,
    });

    const roleChannels = [];
    switch (finalHospitalityCategory) {
        case 'FIRE':
            roleChannels.push('staff_fire', 'staff_medical', 'staff_infrastructure');
            break;
        case 'MEDICAL':
            roleChannels.push('staff_medical');
            break;
        case 'SECURITY':
        case 'INTRUDER':
            roleChannels.push('staff_security');
            break;
        default:
            roleChannels.push('staff_general');
    }

    for (const ch of roleChannels) {
        await SocketService.publish(ch, {
            type: 'created',
            incident,
        });
    }

    return incident;
};

/**
 * AI analysis endpoint (front-end prefill / sanity checks)
 */
exports.analyze = async({ title, description, category, userSeverity, mediaType, mediaBase64 }) => {
    return AIService.analyzeReport({ title, description, category, userSeverity, mediaType, mediaBase64 });
};

exports.analyzeVoice = async({ audioBase64, floorLevel, roomNumber, wingId, lat, lng, reportedBy }) => {
    // Requires ai service to transcribe and materialize text
    const analysis = await AIService.analyzeVoice({ audioBase64, floorLevel, roomNumber, wingId, lat, lng });

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
    });

    return {
        analysis,
        incident,
    };
};

/**
 * Update incident status (used by resolver / admin)
 */
exports.updateStatus = async(id, newStatus) => {
    const [incident] = await db('incidents')
        .where({ id })
        .update({ status: newStatus })
        .returning('*');

    if (incident) {
        await SocketService.publish('incidents', {
            type: 'status-updated',
            incident,
        });
    }

    return incident;
};
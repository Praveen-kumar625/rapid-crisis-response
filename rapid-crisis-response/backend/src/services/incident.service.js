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
exports.list = async(bbox) => {
    let query = db('incidents')
        .select(
            'id',
            'title',
            'description',
            'severity',
            'category',
            'status',
            'spam_score',
            'auto_severity',
            'ai_action_plan as actionPlan',
            'ai_required_resources as requiredResources',
            'media_type as mediaType',
            'media_base64 as mediaBase64',
            db.raw('ST_AsGeoJSON(location) as location'),
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

    const rows = await query;
    return rows.map((r) => ({
        ...r,
        location: geometryToGeoJSON(r.location),
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
            'status',
            'spam_score',
            'auto_severity',
            'ai_action_plan as actionPlan',
            'ai_required_resources as requiredResources',
            'media_type as mediaType',
            'media_base64 as mediaBase64',
            db.raw('ST_AsGeoJSON(location) as location'),
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
    reportedBy,
    mediaType,
    mediaBase64,
}) => {
    // -------------------------------------------------
    // 1️⃣  Call the AI verification + recommendation service
    // -------------------------------------------------
    const {
        spam_score,
        auto_severity,
        actionPlan,
        requiredResources,
        predictedCategory,
    } = await AIService.analyzeReport({
        title,
        description,
        category,
        userSeverity: severity,
        mediaType,
        mediaBase64,
    });

    // If AI gives a better category, accept it (optional)
    const finalCategory = predictedCategory || category;

    // -------------------------------------------------
    // 2️⃣ Determine final status and severity
    // -------------------------------------------------
    let finalSeverity = severity;
    let status = 'OPEN';

    if (spam_score > 0.8) {
        // Mark as rejected – do NOT store in the DB as a normal incident
        status = 'REJECTED';
        // For a rejected incident we keep the original severity (or set to 0)
        finalSeverity = severity;
    } else {
        // If the AI suggested a higher severity, respect it
        if (auto_severity && auto_severity > severity) {
            finalSeverity = auto_severity;
        }
    }

    // -------------------------------------------------
    // 3️⃣ Persist (unless status is REJECTED – we still store for audit)
    // -------------------------------------------------
    const location = db.raw(
        `ST_SetSRID(ST_MakePoint(?, ?), 4326)::geometry`, [lng, lat]
    );

    const [incident] = await db('incidents')
        .insert({
            title,
            description,
            severity: finalSeverity,
            category: finalCategory,
            location,
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
    // 4️⃣ Publish to Redis (the WS and alert listeners will receive it)
    // -------------------------------------------------
    await SocketService.publish('incidents', {
        type: 'created',
        incident,
    });

    return incident;
};

/**
 * AI analysis endpoint (front-end prefill / sanity checks)
 */
exports.analyze = async({ title, description, category, userSeverity, mediaType, mediaBase64 }) => {
    return AIService.analyzeReport({ title, description, category, userSeverity, mediaType, mediaBase64 });
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
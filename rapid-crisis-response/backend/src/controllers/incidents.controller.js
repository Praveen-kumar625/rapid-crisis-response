// src/controllers/incidents.controller.js
const IncidentService = require('../services/incident.service');

exports.getAll = async(req, res) => {
    try {
        const { bbox, wingId, floorLevel, roomNumber } = req.query;
        const incidents = await IncidentService.list({ bbox, wingId, floorLevel, roomNumber });
        res.json(incidents);
    } catch (err) {
        console.error('[IncidentsController] getAll failed:', err);
        res.status(500).json({ error: 'Failed to fetch incidents', details: err.message });
    }
};

exports.getOne = async(req, res) => {
    const incident = await IncidentService.getById(req.params.id);
    if (!incident) return res.status(404).json({ message: 'Not found' });
    res.json(incident);
};

exports.create = async(req, res) => {
    try {
        // 🚨 BUG FIX 2.3: VALIDATE req.user EXISTS
        if (!req.user || !req.user.sub) {
            return res.status(401).json({ error: 'Unauthorized: Missing or invalid JWT token' });
        }

        const {
            title,
            description = '',
            severity,
            category,
            lat,
            lng,
            floorLevel,
            roomNumber,
            wingId,
            mediaType,
            mediaBase64,
        } = req.body;

        // Validate required fields
        if (!title || !category || typeof lat === 'undefined' || typeof lng === 'undefined') {
            return res.status(400).json({ error: 'Missing required fields: title, category, lat, lng' });
        }

        const reporterId = req.user.sub;

        const incident = await IncidentService.create({
            title,
            description,
            severity,
            category,
            lat,
            lng,
            floorLevel,
            roomNumber,
            wingId,
            mediaType,
            mediaBase64,
            reportedBy: reporterId,
        });

        // If the AI flagged the report as REJECTED, we still return it but with a 202 status
        if (incident.status === 'REJECTED') {
            return res.status(202).json({
                message: 'Report received but flagged as spam – it will not be displayed publicly.',
                incident,
            });
        }

        // Normal case
        res.status(201).json(incident);
    } catch (err) {
        console.error('[IncidentsController] create failed:', err);
        res.status(500).json({ error: 'Failed to create incident', details: err.message });
    }
};

exports.analyze = async(req, res) => {
    try {
        const { title = '', description = '', category = '', severity = 3, mediaType, mediaBase64 } = req.body;

        const analysis = await IncidentService.analyze({
            title,
            description,
            category,
            userSeverity: severity,
            mediaType,
            mediaBase64,
        });

        res.json(analysis);
    } catch (err) {
        console.error('[IncidentsController] analyze failed:', err);
        res.status(500).json({ error: 'AI analysis failed', details: err.message });
    }
};

exports.createFromVoice = async(req, res) => {
    try {
        const { audioBase64, lat, lng, floorLevel, roomNumber, wingId, reportedBy } = req.body;

        if (!audioBase64) {
            return res.status(400).json({ error: 'audioBase64 is required' });
        }

        const analysis = await IncidentService.analyzeVoice({
            audioBase64,
            floorLevel,
            roomNumber,
            wingId,
            lat,
            lng,
            reportedBy: req.user ? req.user.sub : 'anonymous',
        });

        res.status(201).json(analysis);
    } catch (err) {
        console.error('[IncidentsController] createFromVoice failed:', err);
        res.status(500).json({ error: 'Voice incident creation failed.' });
    }
};

exports.updateStatus = async(req, res) => {
    const { status } = req.body;
    const updated = await IncidentService.updateStatus(req.params.id, status);
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
};
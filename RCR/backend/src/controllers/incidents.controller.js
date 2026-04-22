// src/controllers/incidents.controller.js
const IncidentService = require('../services/incident.service');
const StorageService = require('../infrastructure/storage');
const SocketService = require('../services/socket.service'); // Added import for scaling fix
const db = require('../db'); // FIXED: Hoisted database import to prevent connection pooling bloat

exports.getUploadUrl = async(req, res) => {
    try {
        const { fileName, mimeType } = req.query;
        if (!fileName || !mimeType) {
            return res.status(400).json({ error: 'Missing fileName or mimeType query parameters' });
        }

        const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${fileName}`;
        const urls = await StorageService.getPresignedUploadUrl(uniqueFileName, mimeType);
        
        if (!urls) {
            return res.status(503).json({ error: 'Storage service unavailable' });
        }
        
        res.json(urls);
    } catch (err) {
        console.error('[IncidentsController] getUploadUrl failed:', err);
        res.status(500).json({ error: 'Failed to generate upload URL', details: err.message });
    }
};

exports.getMe = async(req, res) => {
    res.json({
        id: req.user.sub,
        email: req.user.email,
        role: req.user.role,
        hotelId: req.user.hotelId
    });
};

exports.getResponders = async(req, res) => {
    try {
        const hotelId = req.user?.hotelId;
        const responders = await db('users')
            .where({ hotel_id: hotelId, role: 'RESPONDER' })
            .select('id', 'name', 'responder_role', 'responder_status', 'current_floor', 'current_wing');
        res.json(responders);
    } catch (err) {
        console.error('[IncidentsController] getResponders failed:', err);
        res.status(500).json({ error: 'Failed to fetch responders', details: err.message });
    }
};

exports.getAll = async(req, res) => {
    try {
        const { bbox, wingId, floorLevel, roomNumber } = req.query;
        const hotelId = req.user?.hotelId;
        const incidents = await IncidentService.list({ bbox, wingId, floorLevel, roomNumber, hotelId });
        res.json(incidents);
    } catch (err) {
        console.error('[IncidentsController] getAll failed:', err);
        res.status(500).json({ error: 'Failed to fetch incidents', details: err.message });
    }
};

exports.getOne = async(req, res) => {
    const hotelId = req.user?.hotelId;
    const incident = await IncidentService.getById(req.params.id, hotelId);
    if (!incident) return res.status(404).json({ message: 'Not found' });
    res.json(incident);
};

exports.create = async(req, res) => {
    try {
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
            mediaUrl,
            triageMethod,
        } = req.body;

        const reporterId = req.user.sub;
        const hotelId = req.user.hotelId;

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
            mediaUrl,
            reportedBy: reporterId,
            hotelId,
            triageMethod,
        });

        if (incident.status === 'REJECTED') {
            return res.status(202).json({
                message: 'Report received but flagged as spam – it will not be displayed publicly.',
                incident,
            });
        }

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
        const { audioBase64, audioMimeType, lat, lng, floorLevel, roomNumber, wingId, hotelId: bodyHotelId } = req.body;

        if (!audioBase64) {
            return res.status(400).json({ error: 'audioBase64 is required' });
        }

        const hotelId = bodyHotelId || req.user?.hotelId;

        const analysis = await IncidentService.analyzeVoice({
            audioBase64,
            audioMimeType,
            floorLevel,
            roomNumber,
            wingId,
            lat,
            lng,
            reportedBy: req.user ? req.user.sub : 'anonymous',
            hotelId
        });

        res.status(201).json(analysis);
    } catch (err) {
        console.error('[IncidentsController] createFromVoice failed:', err);
        res.status(500).json({ error: 'Voice incident creation failed.' });
    }
};

exports.updateStatus = async(req, res) => {
    try {
        const { status } = req.body;
        const hotelId = req.user?.hotelId;
        const updated = await IncidentService.updateStatus(req.params.id, status, hotelId, req.user?.sub);
        if (!updated) return res.status(404).json({ message: 'Not found' });
        res.json(updated);
    } catch (err) {

        console.error('[IncidentsController] updateStatus failed:', err);
        res.status(500).json({ error: 'Failed to update status' });
    }
};

exports.updateSafetyStatus = async(req, res) => {
    try {
        const { status } = req.body;
        const userId = req.user.sub;
        
        const [user] = await db('users')
            .where({ id: userId })
            .update({ 
                safety_status: status, 
                last_pulse_at: new Date() 
            })
            .returning('*');

        // FIXED: Scaling Bypass - Publish to Redis instead of direct ioInstance emit
        // This ensures all backend instances receive and forward the pulse to connected clients
        if (user.hotel_id) {
            await SocketService.publish(`hotel_${user.hotel_id}_safety`, {
                type: 'safety-pulse',
                data: {
                    userId: user.id,
                    status: user.safety_status,
                    name: user.name
                }
            });
        }

        res.json({ success: true, status: user.safety_status });
    } catch (err) {
        console.error('[IncidentsController] updateSafetyStatus failed:', err);
        res.status(500).json({ error: 'Pulse failed' });
    }
};

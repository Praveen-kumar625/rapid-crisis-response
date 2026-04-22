const express = require('express');
const router = express.Router();
const incidentsController = require('../controllers/incidents.controller');
const jwtAuth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { 
    incidentSchema, 
    voiceSchema, 
    pulseSchema, 
    statusUpdateSchema  
} = require('../api/validators/incident.validator');
const sosController = require('../controllers/sos.controller');
const { aiVerificationLimiter } = require('../middleware/rateLimiter');

// SOS endpoint (multilingual voice)
router.post('/sos/voice', jwtAuth, aiVerificationLimiter, validate(voiceSchema), sosController.handleVoiceSOS);

// User profile
router.get('/me', jwtAuth, incidentsController.getMe);
router.get('/upload-url', jwtAuth, incidentsController.getUploadUrl);

// Public read endpoints
router.get('/responders', jwtAuth, incidentsController.getResponders);
router.get('/', jwtAuth, incidentsController.getAll);
router.get('/:id', jwtAuth, incidentsController.getOne);

// Protected write endpoints (🚨 FIXED: Added validation to all routes)
router.post('/analyze', jwtAuth, aiVerificationLimiter, validate(incidentSchema), incidentsController.analyze);
router.post('/voice', jwtAuth, aiVerificationLimiter, validate(voiceSchema), incidentsController.createFromVoice);
router.post('/pulse', jwtAuth, validate(pulseSchema), incidentsController.updateSafetyStatus);
router.post('/', jwtAuth, aiVerificationLimiter, validate(incidentSchema), incidentsController.create);
router.patch('/:id/status', jwtAuth, validate(statusUpdateSchema), incidentsController.updateStatus);

module.exports = router;
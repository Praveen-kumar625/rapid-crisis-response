const express = require('express');
const router = express.Router();
const incidentsController = require('../controllers/incidents.controller');
const jwtAuth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { incidentSchema } = require('../api/validators/incident.validator');
const { aiVerificationLimiter } = require('../middleware/rateLimiter');

// User profile
router.get('/me', jwtAuth, incidentsController.getMe);

// Public read endpoints (now protected for multi-tenancy safety)
router.get('/', jwtAuth, incidentsController.getAll);
router.get('/:id', jwtAuth, incidentsController.getOne);

// Protected write endpoints (JWT required)
router.post('/analyze', jwtAuth, aiVerificationLimiter, validate(incidentSchema), incidentsController.analyze);
router.post('/voice', jwtAuth, aiVerificationLimiter, incidentsController.createFromVoice);
router.post('/pulse', jwtAuth, incidentsController.updateSafetyStatus);
router.post('/', jwtAuth, aiVerificationLimiter, validate(incidentSchema), incidentsController.create);
router.patch('/:id/status', jwtAuth, incidentsController.updateStatus);

module.exports = router;
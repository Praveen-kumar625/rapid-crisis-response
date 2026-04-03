const express = require('express');
const router = express.Router();
const incidentsController = require('../controllers/incidents.controller');
const jwtAuth = require('../middleware/auth');
const { aiVerificationLimiter } = require('../middleware/rateLimiter');

// Public read endpoints
router.get('/', incidentsController.getAll);
router.get('/:id', incidentsController.getOne);

// Protected write endpoints (JWT required)
router.post('/analyze', aiVerificationLimiter, jwtAuth, incidentsController.analyze);
router.post('/voice', aiVerificationLimiter, jwtAuth, incidentsController.createFromVoice);
router.post('/pulse', jwtAuth, incidentsController.updateSafetyStatus);
router.post('/', aiVerificationLimiter, jwtAuth, incidentsController.create);
router.patch('/:id/status', jwtAuth, incidentsController.updateStatus);

module.exports = router;
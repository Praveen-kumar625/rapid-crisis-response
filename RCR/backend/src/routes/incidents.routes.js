const express = require('express');
const router = express.Router();
const incidentsController = require('../controllers/incidents.controller');
const jwtAuth = require('../middleware/auth');

// Public read endpoints
router.get('/', incidentsController.getAll);
router.get('/:id', incidentsController.getOne);

// Protected write endpoints (JWT required)
router.post('/analyze', jwtAuth, incidentsController.analyze);
router.post('/voice', jwtAuth, incidentsController.createFromVoice);
router.post('/', jwtAuth, incidentsController.create);
router.patch('/:id/status', jwtAuth, incidentsController.updateStatus);

module.exports = router;
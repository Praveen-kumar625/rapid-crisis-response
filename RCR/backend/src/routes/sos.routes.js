const express = require('express');
const router = express.Router();
const sosController = require('../controllers/sos.controller');
const jwtAuth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { voiceSchema } = require('../api/validators/incident.validator');

/**
 * @route   POST /sos/voice
 * @desc    Submit a voice SOS for multilingual triage
 * @access  Private
 */
router.post('/voice', jwtAuth, validate(voiceSchema), sosController.handleVoiceSOS);

module.exports = router;

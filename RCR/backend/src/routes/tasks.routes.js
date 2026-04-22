// RCR/backend/src/routes/tasks.routes.js
const express = require('express');
const router = express.Router();
const tasksController = require('../controllers/tasks.controller');
const jwtAuth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { taskStatusSchema } = require('../api/validators/incident.validator');

router.get('/my-tasks', jwtAuth, tasksController.getMyTasks);
router.post('/presence', jwtAuth, tasksController.updatePresence);
router.get('/incident/:incidentId', jwtAuth, tasksController.getTasksByIncident);
router.patch('/:taskId/acknowledge', jwtAuth, tasksController.acknowledgeTask);
router.patch('/:taskId/status', jwtAuth, validate(taskStatusSchema), tasksController.updateTaskStatus);

module.exports = router;

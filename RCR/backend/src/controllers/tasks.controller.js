// RCR/backend/src/controllers/tasks.controller.js
const TaskService = require('../services/task.service');
const catchAsync = require('../utils/catchAsync');

exports.getTasksByIncident = catchAsync(async (req, res) => {
    const tasks = await TaskService.getByIncidentId(req.params.incidentId);
    res.json(tasks);
});

exports.getMyTasks = catchAsync(async (req, res) => {
    const hotelId = req.user.hotelId;
    const role = req.user.role;
    const tasks = await TaskService.getPendingByRole(hotelId, role);
    res.json(tasks);
});

exports.updateTaskStatus = catchAsync(async (req, res) => {
    const { status, evidenceUrl } = req.body;
    const task = await TaskService.updateTaskStatus(req.params.taskId, status, evidenceUrl, req.user.sub);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
});


exports.acknowledgeTask = catchAsync(async (req, res) => {
    const task = await TaskService.acknowledgeTask(req.params.taskId, req.user.sub);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
});

exports.updatePresence = catchAsync(async (req, res) => {
    const { status, floorLevel, wingId } = req.body;
    const user = await TaskService.updateResponderStatus(req.user.sub, status, floorLevel, wingId);
    res.json(user);
});

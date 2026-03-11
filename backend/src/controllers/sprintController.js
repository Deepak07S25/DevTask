const sprintService = require('../services/sprintService');

const createSprint = async (req, res) => {
    try {
        const { projectId, name, goal, startDate, endDate } = req.body;
        if (!projectId || !name) {
            return res.status(400).json({ message: 'projectId and name are required' });
        }
        const sprint = await sprintService.createSprint(projectId, name, goal, startDate, endDate);
        res.status(201).json(sprint);
    } catch (err) {
        res.status(500).json({ message: 'Failed to create sprint', error: err.message });
    }
};

const getProjectSprints = async (req, res) => {
    try {
        const { projectId } = req.query;
        if (!projectId) {
            return res.status(400).json({ message: 'projectId query param required' });
        }
        const sprints = await sprintService.getProjectSprints(projectId);
        res.json(sprints);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch sprints', error: err.message });
    }
};

const updateSprint = async (req, res) => {
    try {
        const { sprintId } = req.params;
        const sprint = await sprintService.updateSprint(sprintId, req.body);
        res.json(sprint);
    } catch (err) {
        res.status(500).json({ message: 'Failed to update sprint', error: err.message });
    }
};

const deleteSprint = async (req, res) => {
    try {
        const { sprintId } = req.params;
        await sprintService.deleteSprint(sprintId);
        res.json({ message: 'Sprint deleted. Tasks moved to backlog.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete sprint', error: err.message });
    }
};

const addTaskToSprint = async (req, res) => {
    try {
        const { sprintId, taskId } = req.params;
        const task = await sprintService.addTaskToSprint(taskId, sprintId);
        res.json(task);
    } catch (err) {
        res.status(500).json({ message: 'Failed to add task to sprint', error: err.message });
    }
};

const removeTaskFromSprint = async (req, res) => {
    try {
        const { taskId } = req.params;
        const task = await sprintService.removeTaskFromSprint(taskId);
        res.json(task);
    } catch (err) {
        res.status(500).json({ message: 'Failed to remove task from sprint', error: err.message });
    }
};

module.exports = {
    createSprint,
    getProjectSprints,
    updateSprint,
    deleteSprint,
    addTaskToSprint,
    removeTaskFromSprint
};

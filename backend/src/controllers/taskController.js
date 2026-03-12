const taskService = require("../services/taskService");

const getMyTasks = async (req, res) => {
    try {
        const userId = req.user;
        const tasks = await taskService.getMyTasks(userId);
        res.json(tasks);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const createTask = async (req, res) => {
  try {
    const { title, description, projectId, assigneeId, status, priority, dueDate, sprintId, type, epicId } = req.body;
    const userId = req.user;
    const task = await taskService.createTask(
      title,
      description,
      projectId,
      assigneeId,
      status,
      priority,
      dueDate,
      userId,
      sprintId,
      type,
      epicId
    );
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
const getTasks = async (req, res) => {
    try {
        const { projectId, sprintId, type, search, assigneeId, priority } = req.query;
        const tasks = await taskService.getProjectTasks(projectId, sprintId, type, search, assigneeId, priority);
        res.json(tasks);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const updateData = req.body;
        const userId = req.user; // authMiddleware sets req.user = decoded.userId (a string)
        
        const task = await taskService.updateTask(taskId, updateData, userId);
        res.status(200).json(task);
    } catch (error) {
        console.error('[updateTask ERROR]', error.message, error.code, JSON.stringify(error.meta));
        res.status(400).json({ error: error.message, code: error.code, meta: error.meta });
    }
};

const deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        await taskService.deleteTask(taskId);
        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update your exports
module.exports = { createTask, getTasks, getMyTasks, updateTask, deleteTask };

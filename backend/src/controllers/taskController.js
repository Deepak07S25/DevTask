const taskService = require("../services/taskService");

const createTask = async (req, res) => {
  try {
    const { title, description, projectId, assigneeId, status, priority, dueDate } = req.body;
    const userId = req.user; // authMiddleware sets req.user = decoded.userId (a string)
    const task = await taskService.createTask(
      title,
      description,
      projectId,
      assigneeId,
      status,
      priority,
      dueDate,
      userId
    );
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
const getTasks = async (req, res) => {
    try {
        const { projectId } = req.query; // Read from query string: ?projectId=...
        const tasks = await taskService.getProjectTasks(projectId);
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
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
module.exports = { createTask, getTasks, updateTask, deleteTask };

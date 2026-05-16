const aiService = require('../services/ai/aiService');

exports.getProjectHealth = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    const health = await aiService.getProjectHealth(projectId);
    res.json({ success: true, data: health });
  } catch (error) {
    next(error);
  }
};

exports.getTaskInsights = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const insights = await aiService.getTaskInsights(taskId);
    res.json({ success: true, data: insights });
  } catch (error) {
    next(error);
  }
};

exports.chat = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const reply = await aiService.chat(projectId, message);
    res.json({ success: true, data: reply });
  } catch (error) {
    next(error);
  }
};

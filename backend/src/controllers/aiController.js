const aiService = require('../services/ai/aiService');
const agentOrchestrator = require('../services/ai/orchestrator/agentOrchestrator');

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

exports.runAgent = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id || req.body.projectId;
    const { message } = req.body;

    const context = {
      userId: req.user,
      userRole: req.userRole,
      projectId,
    };

    const result = await agentOrchestrator.run({ message, context });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    const status = error.status || (error.statusCode ? error.statusCode : 500);
    res.status(status).json({
      error: error.message || 'Agent execution failed',
      code: error.code || 'AGENT_ERROR',
    });
  }
};

const prisma = require("../db/client");
const aiService = require("./ai/aiService");

class RiskService {
  async updateTaskRisk(taskId) {
    try {
      const insightsData = await aiService.getTaskInsights(taskId);
      
      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          riskScore: insightsData.riskScore,
          riskLevel: insightsData.riskLevel,
          riskReasons: insightsData.insights
        }
      });
      return updatedTask;
    } catch (error) {
      console.error(`Failed to update risk for task ${taskId}:`, error);
      throw error;
    }
  }
}

module.exports = new RiskService();

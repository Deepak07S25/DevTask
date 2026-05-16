const ruleBasedProvider = require('./ruleBasedProvider');
const externalProvider = require('./externalProvider');
const ContextBuilder = require('./contextBuilder');

class AIService {
  getProvider() {
    return process.env.AI_PROVIDER === 'external' ? externalProvider : ruleBasedProvider;
  }

  async getProjectHealth(projectId) {
    const context = await ContextBuilder.buildProjectContext(projectId);
    const provider = this.getProvider();
    
    try {
      return await provider.getProjectHealth(context);
    } catch (error) {
      console.warn("External provider failed, falling back to rule-based.");
      return await ruleBasedProvider.getProjectHealth(context);
    }
  }

  async getTaskInsights(taskId) {
    const context = await ContextBuilder.buildTaskContext(taskId);
    const provider = this.getProvider();
    
    try {
      return await provider.getTaskInsights(context);
    } catch (error) {
      console.warn("External provider failed, falling back to rule-based.");
      return await ruleBasedProvider.getTaskInsights(context);
    }
  }

  async chat(projectId, message) {
    const context = await ContextBuilder.buildProjectContext(projectId);
    const provider = this.getProvider();
    
    try {
      return await provider.chat(context, message);
    } catch (error) {
      console.warn("External provider failed, falling back to rule-based.");
      return await ruleBasedProvider.chat(context, message);
    }
  }
}

module.exports = new AIService();

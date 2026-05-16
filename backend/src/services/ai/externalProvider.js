class ExternalProvider {
  async getProjectHealth(context) {
    return {
      score: 85,
      status: "HEALTHY",
      reasons: ["External AI provider is currently just a stub."],
      summary: "This is a placeholder response from the External AI Provider."
    };
  }

  async getTaskInsights(context) {
    return {
      insights: ["Stub insight 1 from external AI", "Stub insight 2 from external AI"],
      riskLevel: "LOW",
      riskScore: 20
    };
  }

  async chat(context, message) {
    return {
      reply: `[External AI Stub] You asked: "${message}". I have received project context with ${context.totalTasks} tasks. This is a placeholder for an actual LLM integration.`,
      sources: []
    };
  }
}

module.exports = new ExternalProvider();

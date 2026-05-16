class RuleBasedProvider {
  async getProjectHealth(context) {
    let score = 100;
    const reasons = [];

    const now = new Date();
    
    let overdueCount = 0;
    let blockedCount = 0;
    let unassignedCount = 0;
    let missingDescCount = 0;
    
    context.tasks.forEach(task => {
      // Overdue tasks
      if (task.dueDate && new Date(task.dueDate) < now && task.status !== "Done") {
        overdueCount++;
        score -= 5;
      }
      // Blocked tasks
      if (task.blocked) {
        blockedCount++;
        score -= 10;
      }
      // Unassigned tasks
      if (task.assignee === "Unassigned") {
        unassignedCount++;
        score -= 2;
      }
      // Missing description
      if (!task.hasDescription) {
        missingDescCount++;
        score -= 1;
      }
    });

    if (overdueCount > 0) reasons.push(`You have ${overdueCount} overdue tasks.`);
    if (blockedCount > 0) reasons.push(`${blockedCount} tasks are currently blocked.`);
    if (unassignedCount > 0) reasons.push(`${unassignedCount} tasks remain unassigned.`);
    if (missingDescCount > 0) reasons.push(`${missingDescCount} tasks are missing descriptions.`);

    if (score < 0) score = 0;
    
    let status = "HEALTHY";
    if (score < 50) status = "CRITICAL";
    else if (score < 75) status = "AT_RISK";

    if (reasons.length === 0) {
      reasons.push("Project looks perfectly healthy!");
    }

    return {
      score,
      status,
      reasons,
      summary: `Project score is ${score}/100. ${status === 'HEALTHY' ? 'Keep up the good work.' : 'Immediate attention required.'}`
    };
  }

  async getTaskInsights(context) {
    const insights = [];
    let riskLevel = "NONE";
    let riskScore = 0;

    if (context.blocked) {
      insights.push("Task is currently blocked.");
      riskLevel = "CRITICAL";
      riskScore += 40;
    }

    if (context.priority === "HIGH") {
      insights.push("High priority task requires attention.");
      riskScore += 10;
      if (riskLevel === "NONE") riskLevel = "MEDIUM";
    }

    if (context.dueDate) {
      const now = new Date();
      const due = new Date(context.dueDate);
      if (due < now && context.status !== "Done") {
        insights.push("Task is overdue!");
        riskScore += 30;
        riskLevel = riskLevel === "CRITICAL" ? "CRITICAL" : "HIGH";
      } else if (due.getTime() - now.getTime() < 86400000 * 2) {
        // Due within 2 days
        insights.push("Task is due very soon.");
        riskScore += 15;
        if (riskLevel === "NONE") riskLevel = "LOW";
      }
    }

    if (!context.description) {
      insights.push("Consider adding a description for clarity.");
      riskScore += 5;
    }

    if (context.assignee === "Unassigned") {
      insights.push("Task is unassigned.");
      riskScore += 10;
    }

    if (insights.length === 0) {
      insights.push("Task is well-defined and on track.");
    }

    return {
      insights,
      riskLevel,
      riskScore: Math.min(riskScore, 100)
    };
  }

  async chat(context, message) {
    return {
      reply: `[Rule-Based AI] I see you asked: "${message}". I know about ${context.totalTasks} tasks in this project. As a rule-based AI, I have limited conversational capability. Please use the External AI provider for richer conversations.`,
      sources: []
    };
  }
}

module.exports = new RuleBasedProvider();

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
    const msg = message.toLowerCase();
    let reply = `[Rule-Based AI] I know about ${context.totalTasks} tasks in this project. I have limited conversational capability. Please use the External AI provider for richer conversations.`;
    
    if (msg.includes("at risk")) {
      const atRisk = context.tasks.filter(t => t.blocked || (t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "Done") || t.priority === "HIGH");
      reply = `[Rule-Based AI] There are ${atRisk.length} tasks at risk (blocked, overdue, or high priority).`;
      if (atRisk.length > 0) reply += ` Example: ${atRisk[0].title}.`;
    } else if (msg.includes("overdue")) {
      const overdue = context.tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "Done");
      reply = `[Rule-Based AI] There are ${overdue.length} overdue tasks.`;
    } else if (msg.includes("blocked")) {
      const blocked = context.tasks.filter(t => t.blocked);
      reply = `[Rule-Based AI] There are ${blocked.length} blocked tasks.`;
    } else if (msg.includes("overloaded")) {
      const assigneeCounts = {};
      context.tasks.forEach(t => {
        if (t.status !== "Done" && t.assignee && t.assignee !== "Unassigned") {
          assigneeCounts[t.assignee] = (assigneeCounts[t.assignee] || 0) + 1;
        }
      });
      const overloaded = Object.entries(assigneeCounts).filter(([_, count]) => count > 3).map(([name]) => name);
      if (overloaded.length > 0) {
        reply = `[Rule-Based AI] The following team members might be overloaded (>3 open tasks): ${overloaded.join(', ')}.`;
      } else {
        reply = `[Rule-Based AI] No team members appear to be overloaded currently.`;
      }
    }

    return {
      reply,
      sources: []
    };
  }
}

module.exports = new RuleBasedProvider();

import API from './axios';

/**
 * Builds the enriched backend prompt invisibly from context.
 * The backend agent accepts: { message: string }
 */
export function buildContextualPrompt(userMessage, context) {
  if (!context) return userMessage;

  if (context.type === 'task' && context.task) {
    const { task } = context;
    const taskParts = [
      `Task: "${task.title || 'Untitled'}"`,
      task.taskNumber ? `(#${task.taskNumber})` : null,
      task.status ? `Status: ${task.status}` : null,
      task.priority ? `Priority: ${task.priority}` : null,
      task.type ? `Type: ${task.type}` : null,
      task.blocked ? 'Blocked: Yes' : null,
      task.description ? `Description: "${task.description}"` : null,
      task.assignee?.name ? `Assignee: ${task.assignee.name}` : null,
      task.riskLevel ? `Risk Level: ${task.riskLevel}` : null,
    ].filter(Boolean).join(', ');

    return `[Active Task Context: ${taskParts}]\n\nUser Question: ${userMessage}`;
  }

  if (context.type === 'sprint' && context.sprint) {
    const { sprint } = context;
    const sprintParts = [
      `Sprint Name: "${sprint.name || 'Unnamed Sprint'}"`,
      sprint.id ? `ID: ${sprint.id}` : null,
      sprint.status ? `Status: ${sprint.status}` : null,
      sprint.goal ? `Goal: "${sprint.goal}"` : null,
      Array.isArray(sprint.tasks) ? `Task Count: ${sprint.tasks.length}` : null,
      sprint.startDate ? `Start Date: ${sprint.startDate}` : null,
      sprint.endDate ? `End Date: ${sprint.endDate}` : null,
    ].filter(Boolean).join(', ');

    return `[Active Sprint Context: ${sprintParts}]\n\nUser Question: ${userMessage}`;
  }

  return userMessage;
}

/**
 * agentApi — Project & Task Intelligence service
 *
 * POST /api/projects/:projectId/ai/agent
 * Body: { message: string }
 * Response: { success: true, data: { message: string, metadata: object } }
 */
export const agentApi = {
  runAgent: (projectId, userMessage, context = null) => {
    if (!projectId || projectId === 'undefined' || projectId === 'null') {
      return Promise.reject(new Error('Invalid project ID'));
    }
    const message = buildContextualPrompt(userMessage, context);
    return API.post(`/projects/${projectId}/ai/agent`, { message }).then(r => r.data);
  },
};


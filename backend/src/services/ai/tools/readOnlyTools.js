const { z } = require('zod');
const ToolDefinition = require('./toolDefinition');
const projectService = require('../../projectService');
const taskService = require('../../taskService');
const { AIAuthError, AIInvalidRequestError } = require('../errors/aiErrors');

/**
 * Asserts that the authenticated user has access to the target project.
 * Throws AIAuthError if user is not a member or project does not exist.
 */
async function assertProjectAccess(projectId, userId) {
  if (!projectId) {
    throw new AIInvalidRequestError('projectId is required');
  }
  if (!userId) {
    throw new AIAuthError('Authenticated userId is required in execution context');
  }

  const project = await projectService.getProjectById(projectId, userId);
  if (!project) {
    throw new AIAuthError(`Access denied: You do not have permission to access project "${projectId}"`);
  }
  return project;
}

/**
 * Tool 1: get_project
 * Retrieves sanitized project metadata for an authorized user.
 */
const getProjectTool = new ToolDefinition({
  name: 'get_project',
  description: 'Retrieves metadata (name, key, description, timestamps) for an authorized project.',
  access: 'read',
  inputSchema: z.object({
    projectId: z.string().uuid().optional(),
  }).strict(),
  execute: async (args, context) => {
    const targetProjectId = args.projectId || context.projectId;
    const project = await assertProjectAccess(targetProjectId, context.userId);

    return {
      id: project.id,
      key: project.key,
      name: project.name,
      description: project.description || null,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  },
});

/**
 * Tool 2: get_tasks
 * Retrieves tasks for an authorized project with optional filtering and bounded results.
 */
const getTasksTool = new ToolDefinition({
  name: 'get_tasks',
  description: 'Retrieves a bounded snapshot of tasks for an authorized project with optional filters (sprint, type, search, priority, assignee). Results may contain fewer tasks than totalCount (limit: 1-50, default: 25).',
  access: 'read',
  inputSchema: z.object({
    projectId: z.string().uuid().optional(),
    sprintId: z.string().optional(),
    type: z.enum(['EPIC', 'STORY', 'BUG', 'TASK']).optional(),
    search: z.string().optional(),
    assigneeId: z.string().uuid().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    limit: z.number().int().min(1).max(50).optional().describe('Maximum number of tasks to return (1-50, default 25). Do not request more than 50.'),
  }).strict(),
  execute: async (args, context) => {
    const targetProjectId = args.projectId || context.projectId;
    await assertProjectAccess(targetProjectId, context.userId);

    const limit = Math.max(1, Math.min(args.limit || 25, 50));
    const { data, meta } = await taskService.getProjectTasks(
      targetProjectId,
      args.sprintId,
      args.type,
      args.search,
      args.assigneeId,
      args.priority,
      1,
      limit
    );

    return {
      totalCount: meta.totalCount,
      returnedCount: data.length,
      tasks: data.map((t) => ({
        id: t.id,
        taskNumber: t.taskNumber,
        title: t.title,
        description: t.description || null,
        status: t.status,
        priority: t.priority,
        type: t.type,
        blocked: t.blocked,
        dueDate: t.dueDate,
        estimatePoints: t.estimatePoints,
        actualPoints: t.actualPoints,
        riskLevel: t.riskLevel,
        riskScore: t.riskScore,
        assignee: t.assignee ? { id: t.assignee.id, name: t.assignee.name } : null,
        sprint: t.sprint ? { id: t.sprint.id, name: t.sprint.name, status: t.sprint.status } : null,
        labels: Array.isArray(t.labels)
          ? t.labels.map((l) => l.label?.name || l.name).filter(Boolean)
          : [],
      })),
    };
  },
});

/**
 * Tool 3: get_members
 * Retrieves project members with roles. Excludes emails and password hashes for privacy.
 */
const getMembersTool = new ToolDefinition({
  name: 'get_members',
  description: 'Retrieves team members and their roles for an authorized project.',
  access: 'read',
  inputSchema: z.object({
    projectId: z.string().uuid().optional(),
    limit: z.number().int().min(1).max(50).optional(),
  }).strict(),
  execute: async (args, context) => {
    const targetProjectId = args.projectId || context.projectId;
    await assertProjectAccess(targetProjectId, context.userId);

    const limit = Math.max(1, Math.min(args.limit || 25, 50));
    const { data, meta } = await projectService.getMembers(targetProjectId, 1, limit);

    return {
      totalCount: meta.totalCount,
      returnedCount: data.length,
      members: data.map((m) => ({
        userId: m.user.id,
        name: m.user.name,
        role: m.role,
      })),
    };
  },
});

module.exports = {
  assertProjectAccess,
  getProjectTool,
  getTasksTool,
  getMembersTool,
};

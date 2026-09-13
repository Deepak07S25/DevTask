jest.mock('../../src/services/projectService');
jest.mock('../../src/services/taskService');

const projectService = require('../../src/services/projectService');
const taskService = require('../../src/services/taskService');
const {
  getProjectTool,
  getTasksTool,
  getMembersTool,
  assertProjectAccess,
} = require('../../src/services/ai/tools/readOnlyTools');
const { toGeminiFunctionDeclarations } = require('../../src/services/ai/tools/geminiToolAdapter');
const { AIAuthError, AIInvalidRequestError } = require('../../src/services/ai/errors/aiErrors');

describe('Read-Only Tools & Gemini Adapter Unit Tests', () => {
  const mockUserId = 'user-auth-uuid-1';
  const mockProjectId = 'project-uuid-100';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('assertProjectAccess Helper', () => {
    it('should return project when user has access', async () => {
      projectService.getProjectById.mockResolvedValue({ id: mockProjectId, name: 'Project Alpha' });

      const project = await assertProjectAccess(mockProjectId, mockUserId);
      expect(projectService.getProjectById).toHaveBeenCalledWith(mockProjectId, mockUserId);
      expect(project.id).toBe(mockProjectId);
    });

    it('should throw AIAuthError when user is not a project member', async () => {
      projectService.getProjectById.mockResolvedValue(null);

      await expect(assertProjectAccess(mockProjectId, mockUserId)).rejects.toThrow(AIAuthError);
    });

    it('should throw AIInvalidRequestError when projectId is missing', async () => {
      await expect(assertProjectAccess(null, mockUserId)).rejects.toThrow(AIInvalidRequestError);
    });

    it('should throw AIAuthError when userId is missing', async () => {
      await expect(assertProjectAccess(mockProjectId, null)).rejects.toThrow(AIAuthError);
    });
  });

  describe('Tool 1: get_project', () => {
    it('should return sanitized project metadata for authorized user', async () => {
      const date = new Date();
      projectService.getProjectById.mockResolvedValue({
        id: mockProjectId,
        key: 'ALPHA',
        name: 'Project Alpha',
        description: 'Testing Agent Tools',
        createdAt: date,
        updatedAt: date,
        internalSecret: 'DO_NOT_EXPOSE',
      });

      const res = await getProjectTool.execute(
        { projectId: mockProjectId },
        { userId: mockUserId, projectId: mockProjectId }
      );

      expect(res).toEqual({
        id: mockProjectId,
        key: 'ALPHA',
        name: 'Project Alpha',
        description: 'Testing Agent Tools',
        createdAt: date,
        updatedAt: date,
      });
      expect(res.internalSecret).toBeUndefined();
    });

    it('should reject unauthorized user querying get_project', async () => {
      projectService.getProjectById.mockResolvedValue(null);

      await expect(
        getProjectTool.execute({ projectId: mockProjectId }, { userId: 'unauthorized-user' })
      ).rejects.toThrow(AIAuthError);
    });
  });

  describe('Tool 2: get_tasks', () => {
    it('should return bounded and sanitized task list for authorized project', async () => {
      projectService.getProjectById.mockResolvedValue({ id: mockProjectId });
      taskService.getProjectTasks.mockResolvedValue({
        data: [
          {
            id: 'task-1',
            taskNumber: 101,
            title: 'Set up OAuth',
            description: 'Google SSO integration',
            status: 'Todo',
            priority: 'HIGH',
            type: 'TASK',
            blocked: false,
            dueDate: null,
            estimatePoints: 3,
            actualPoints: null,
            riskLevel: 'LOW',
            riskScore: 10,
            assignee: { id: 'user-1', name: 'Deepak' },
            sprint: { id: 'sprint-1', name: 'Sprint 1', status: 'ACTIVE' },
            labels: [{ label: { name: 'auth' } }],
          },
        ],
        meta: { totalCount: 1, totalPages: 1 },
      });

      const res = await getTasksTool.execute(
        { projectId: mockProjectId, limit: 10 },
        { userId: mockUserId }
      );

      expect(res.totalCount).toBe(1);
      expect(res.returnedCount).toBe(1);
      expect(res.tasks[0].title).toBe('Set up OAuth');
      expect(res.tasks[0].assignee).toEqual({ id: 'user-1', name: 'Deepak' });
      expect(res.tasks[0].sprint).toEqual({ id: 'sprint-1', name: 'Sprint 1', status: 'ACTIVE' });
      expect(res.tasks[0].labels).toEqual(['auth']);
    });

    it('should clamp limit to max 50 even if a higher number is requested', async () => {
      projectService.getProjectById.mockResolvedValue({ id: mockProjectId });
      taskService.getProjectTasks.mockResolvedValue({ data: [], meta: { totalCount: 0 } });

      await getTasksTool.execute(
        { projectId: mockProjectId, limit: 50 },
        { userId: mockUserId }
      );

      expect(taskService.getProjectTasks).toHaveBeenCalledWith(
        mockProjectId,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        1,
        50
      );
    });

    it('should reject unauthorized user querying get_tasks', async () => {
      projectService.getProjectById.mockResolvedValue(null);

      await expect(
        getTasksTool.execute({ projectId: mockProjectId }, { userId: 'intruder' })
      ).rejects.toThrow(AIAuthError);
    });
  });

  describe('Tool 3: get_members', () => {
    it('should return project members excluding emails and password hashes', async () => {
      projectService.getProjectById.mockResolvedValue({ id: mockProjectId });
      projectService.getMembers.mockResolvedValue({
        data: [
          {
            role: 'ADMIN',
            user: {
              id: 'user-1',
              name: 'Deepak Singh',
              email: 'deepak@example.com',
              password: '$2a$10$hashedpassword',
            },
          },
          {
            role: 'MEMBER',
            user: {
              id: 'user-2',
              name: 'Team Member',
              email: 'member@example.com',
              password: '$2a$10$hashedpassword2',
            },
          },
        ],
        meta: { totalCount: 2, totalPages: 1 },
      });

      const res = await getMembersTool.execute(
        { projectId: mockProjectId },
        { userId: mockUserId }
      );

      expect(res.totalCount).toBe(2);
      expect(res.returnedCount).toBe(2);
      expect(res.members).toEqual([
        { userId: 'user-1', name: 'Deepak Singh', role: 'ADMIN' },
        { userId: 'user-2', name: 'Team Member', role: 'MEMBER' },
      ]);
      // Verify NO email or password in output
      expect(res.members[0].email).toBeUndefined();
      expect(res.members[0].password).toBeUndefined();
    });

    it('should reject unauthorized user querying get_members', async () => {
      projectService.getProjectById.mockResolvedValue(null);

      await expect(
        getMembersTool.execute({ projectId: mockProjectId }, { userId: 'intruder' })
      ).rejects.toThrow(AIAuthError);
    });
  });

  describe('Gemini Tool Adapter', () => {
    it('should convert ToolDefinitions into valid Gemini functionDeclarations format', () => {
      const tools = [getProjectTool, getTasksTool, getMembersTool];
      const declarations = toGeminiFunctionDeclarations(tools);

      expect(declarations).toHaveProperty('functionDeclarations');
      expect(declarations.functionDeclarations.length).toBe(3);

      const [getProjectDecl, getTasksDecl, getMembersDecl] = declarations.functionDeclarations;

      expect(getProjectDecl.name).toBe('get_project');
      expect(getProjectDecl.parameters.type).toBe('OBJECT');
      expect(getProjectDecl.parameters.properties.projectId.type).toBe('STRING');

      expect(getTasksDecl.name).toBe('get_tasks');
      expect(getTasksDecl.description).toContain('bounded snapshot');
      expect(getTasksDecl.parameters.properties.type.enum).toEqual(['EPIC', 'STORY', 'BUG', 'TASK']);
      expect(getTasksDecl.parameters.properties.limit.type).toBe('NUMBER');
      expect(getTasksDecl.parameters.properties.limit.description).toBe(
        'Maximum number of tasks to return (1-50, default 25). Do not request more than 50.'
      );

      expect(getMembersDecl.name).toBe('get_members');
      expect(getMembersDecl.parameters.type).toBe('OBJECT');
    });

    it('should verify agent system prompt contains bounded snapshot guidance', () => {
      const { buildAgentSystemPrompt } = require('../../src/services/ai/prompts/agentSystemPrompt');
      const prompt = buildAgentSystemPrompt({ projectId: 'p-1', projectName: 'Alpha' });

      expect(prompt).toContain('BOUNDED DATA HANDLING');
      expect(prompt).toContain('bounded snapshots');
      expect(prompt).toContain('NEVER repeatedly call "get_tasks" just because "totalCount" is greater');
      expect(prompt).toContain('Do NOT try to fetch every task in the project automatically');
    });
  });
});

const toolRegistry = require('../../src/services/ai/tools/toolRegistry');
const ToolDefinition = require('../../src/services/ai/tools/toolDefinition');
const { z } = require('zod');
const { AIInvalidRequestError, AIAuthError } = require('../../src/services/ai/errors/aiErrors');

describe('ToolRegistry Unit Tests', () => {
  describe('Tool Registration & Lookup', () => {
    it('should have default read-only tools registered', () => {
      const tools = toolRegistry.getAll();
      const names = tools.map((t) => t.name);

      expect(names).toContain('get_project');
      expect(names).toContain('get_tasks');
      expect(names).toContain('get_members');
    });

    it('should retrieve a registered tool by name', () => {
      const tool = toolRegistry.get('get_project');
      expect(tool).toBeDefined();
      expect(tool.name).toBe('get_project');
      expect(tool.access).toBe('read');
    });

    it('should return undefined for unregistered tools', () => {
      expect(toolRegistry.get('non_existent_tool')).toBeUndefined();
    });

    it('should return all read-only tools', () => {
      const readOnlyTools = toolRegistry.getReadOnlyTools();
      expect(readOnlyTools.length).toBeGreaterThanOrEqual(3);
      readOnlyTools.forEach((tool) => {
        expect(tool.access).toBe('read');
      });
    });

    it('should reject registering non-ToolDefinition objects', () => {
      expect(() => {
        toolRegistry.register({ name: 'fake' });
      }).toThrow('Tool must be an instance of ToolDefinition');
    });
  });

  describe('Execution Boundary & Security', () => {
    it('should reject execution of unknown tool names', async () => {
      await expect(
        toolRegistry.execute('delete_everything', {}, { userId: 'user-123' })
      ).rejects.toThrow(AIInvalidRequestError);
    });

    it('should reject execution if execution context lacks authenticated userId', async () => {
      await expect(
        toolRegistry.execute('get_project', { projectId: '00000000-0000-0000-0000-000000000000' }, {})
      ).rejects.toThrow(AIAuthError);

      await expect(
        toolRegistry.execute('get_project', { projectId: '00000000-0000-0000-0000-000000000000' }, null)
      ).rejects.toThrow(AIAuthError);
    });

    it('should reject invalid arguments failing Zod schema validation', async () => {
      await expect(
        toolRegistry.execute('get_tasks', { limit: -5 }, { userId: 'user-123', projectId: 'p-1' })
      ).rejects.toThrow(AIInvalidRequestError);
    });

    it('should reject unexpected extra parameters if schema is strict', async () => {
      await expect(
        toolRegistry.execute('get_project', { maliciousField: 'DROP TABLE' }, { userId: 'user-123' })
      ).rejects.toThrow(AIInvalidRequestError);
    });

    it('should never allow LLM-supplied arguments to override context.userId', async () => {
      let executedContext = null;
      const customTool = new ToolDefinition({
        name: 'test_context_tool',
        description: 'Tests context immutability',
        access: 'read',
        inputSchema: z.object({
          userId: z.string().optional(),
        }),
        execute: async (args, context) => {
          executedContext = context;
          return { actingUserId: context.userId };
        },
      });

      toolRegistry.register(customTool);

      const res = await toolRegistry.execute(
        'test_context_tool',
        { userId: 'forged-attacker-user-id' },
        { userId: 'trusted-session-user-id', userRole: 'MEMBER' }
      );

      expect(res.success).toBe(true);
      expect(executedContext.userId).toBe('trusted-session-user-id');
      expect(res.data.actingUserId).toBe('trusted-session-user-id');
    });
  });
});

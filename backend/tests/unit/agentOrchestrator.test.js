const { AgentOrchestrator } = require('../../src/services/ai/orchestrator/agentOrchestrator');
const {
  AIInvalidRequestError,
  AIAuthError,
  AITimeoutError,
  AIRateLimitError,
  AIProviderError,
} = require('../../src/services/ai/errors/aiErrors');

describe('AgentOrchestrator Unit Tests', () => {
  let mockGeminiProvider;
  let mockToolRegistry;
  let orchestrator;

  const validContext = {
    userId: 'user-auth-123',
    userRole: 'MEMBER',
    projectId: 'project-uuid-999',
    projectName: 'Demo Project',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockGeminiProvider = {
      generateAgentTurn: jest.fn(),
    };

    mockToolRegistry = {
      getReadOnlyTools: jest.fn().mockReturnValue([
        { name: 'get_project', description: 'desc', inputSchema: {} },
        { name: 'get_tasks', description: 'desc', inputSchema: {} },
        { name: 'get_members', description: 'desc', inputSchema: {} },
      ]),
      execute: jest.fn(),
    };

    orchestrator = new AgentOrchestrator({
      geminiProvider: mockGeminiProvider,
      toolRegistry: mockToolRegistry,
    });
  });

  describe('Validation & Authorization', () => {
    it('should reject empty message', async () => {
      await expect(
        orchestrator.run({ message: '   ', context: validContext })
      ).rejects.toThrow(AIInvalidRequestError);
    });

    it('should reject message exceeding 2000 characters', async () => {
      const longMsg = 'a'.repeat(2001);
      await expect(
        orchestrator.run({ message: longMsg, context: validContext })
      ).rejects.toThrow(AIInvalidRequestError);
    });

    it('should reject execution when context is missing userId', async () => {
      await expect(
        orchestrator.run({ message: 'Plan my sprint', context: { projectId: 'p-1' } })
      ).rejects.toThrow(AIAuthError);
    });
  });

  describe('Tool Execution & Multi-Turn Reasoning', () => {
    it('should handle simple request directly without tools (1 turn)', async () => {
      mockGeminiProvider.generateAgentTurn.mockResolvedValue({
        text: 'Hello! How can I help you manage DEVtask?',
        functionCalls: null,
      });

      const res = await orchestrator.run({
        message: 'Hello',
        context: validContext,
      });

      expect(res.success).toBe(true);
      expect(res.message).toBe('Hello! How can I help you manage DEVtask?');
      expect(res.metadata.iterations).toBe(1);
      expect(res.metadata.llmCalls).toBe(1);
      expect(res.metadata.toolCalls).toBe(0);
      expect(res.metadata.toolsUsed).toEqual([]);
      expect(res.metadata.terminationReason).toBe('COMPLETED');
    });

    it('should preserve rawContent and thoughtSignature in conversation history across turns', async () => {
      const mockThoughtPart = { thought: true, text: 'Thinking about looking up project...' };
      const mockFunctionCallPart = {
        functionCall: { name: 'get_project', args: { projectId: 'project-uuid-999' } },
        thoughtSignature: 'encrypted-signature-xyz-789',
      };
      const mockRawModelContent = {
        role: 'model',
        parts: [mockThoughtPart, mockFunctionCallPart],
      };

      // Turn 1: Returns tool call with rawContent containing thoughtSignature
      mockGeminiProvider.generateAgentTurn.mockResolvedValueOnce({
        text: null,
        functionCalls: [{ name: 'get_project', args: { projectId: 'project-uuid-999' } }],
        rawContent: mockRawModelContent,
      });

      // Tool executes
      mockToolRegistry.execute.mockResolvedValueOnce({
        success: true,
        tool: 'get_project',
        data: { id: 'project-uuid-999', name: 'Demo Project', key: 'DEMO' },
      });

      // Turn 2: Returns final answer
      mockGeminiProvider.generateAgentTurn.mockResolvedValueOnce({
        text: 'Project DEMO is active with key DEMO.',
        functionCalls: null,
        rawContent: {
          role: 'model',
          parts: [{ text: 'Project DEMO is active with key DEMO.' }],
        },
      });

      const res = await orchestrator.run({
        message: 'What is the project key and name?',
        context: validContext,
      });

      expect(res.success).toBe(true);
      expect(res.message).toBe('Project DEMO is active with key DEMO.');
      expect(res.metadata.toolsUsed).toEqual(['get_project']);

      // Verify what was sent to Turn 2:
      // Turn 2 call to generateAgentTurn should have received contents containing the exact mockRawModelContent
      expect(mockGeminiProvider.generateAgentTurn).toHaveBeenCalledTimes(2);
      const turn2CallArgs = mockGeminiProvider.generateAgentTurn.mock.calls[1][0];
      expect(turn2CallArgs.contents).toHaveLength(3);
      // Position 0: user message
      expect(turn2CallArgs.contents[0]).toEqual({
        role: 'user',
        parts: [{ text: 'What is the project key and name?' }],
      });
      // Position 1: EXACT rawContent object with thoughtSignature intact
      expect(turn2CallArgs.contents[1]).toBe(mockRawModelContent);
      expect(turn2CallArgs.contents[1].parts[1].thoughtSignature).toBe('encrypted-signature-xyz-789');
      // Position 2: tool response
      expect(turn2CallArgs.contents[2]).toEqual({
        role: 'user',
        parts: [
          {
            functionResponse: {
              name: 'get_project',
              response: {
                result: { id: 'project-uuid-999', name: 'Demo Project', key: 'DEMO' },
              },
            },
          },
        ],
      });
    });

    it('should handle multi-turn reasoning with get_project', async () => {
      // Turn 1: Model requests get_project (without rawContent, testing fallback)
      mockGeminiProvider.generateAgentTurn.mockResolvedValueOnce({
        text: null,
        functionCalls: [{ name: 'get_project', args: { projectId: 'project-uuid-999' } }],
      });

      // Tool executes
      mockToolRegistry.execute.mockResolvedValueOnce({
        success: true,
        tool: 'get_project',
        data: { id: 'project-uuid-999', name: 'Demo Project', key: 'DEMO' },
      });

      // Turn 2: Model synthesizes final response
      mockGeminiProvider.generateAgentTurn.mockResolvedValueOnce({
        text: 'Project DEMO is active with key DEMO.',
        functionCalls: null,
      });

      const res = await orchestrator.run({
        message: 'What is the project key?',
        context: validContext,
      });

      expect(res.success).toBe(true);
      expect(res.message).toBe('Project DEMO is active with key DEMO.');
      expect(res.metadata.iterations).toBe(2);
      expect(res.metadata.llmCalls).toBe(2);
      expect(res.metadata.toolCalls).toBe(1);
      expect(res.metadata.toolsUsed).toEqual(['get_project']);
      expect(mockToolRegistry.execute).toHaveBeenCalledWith(
        'get_project',
        { projectId: 'project-uuid-999' },
        validContext
      );
    });

    it('should handle multi-turn reasoning with get_tasks', async () => {
      mockGeminiProvider.generateAgentTurn.mockResolvedValueOnce({
        text: null,
        functionCalls: [{ name: 'get_tasks', args: { limit: 10 } }],
      });

      mockToolRegistry.execute.mockResolvedValueOnce({
        success: true,
        tool: 'get_tasks',
        data: { totalCount: 2, tasks: [{ title: 'Task 1' }, { title: 'Task 2' }] },
      });

      mockGeminiProvider.generateAgentTurn.mockResolvedValueOnce({
        text: 'There are 2 tasks in this project: Task 1 and Task 2.',
        functionCalls: null,
      });

      const res = await orchestrator.run({
        message: 'List the tasks',
        context: validContext,
      });

      expect(res.success).toBe(true);
      expect(res.metadata.toolsUsed).toEqual(['get_tasks']);
      expect(res.message).toContain('There are 2 tasks');
    });

    it('should synthesize response when get_tasks returns bounded snapshot where totalCount > returnedCount', async () => {
      // Turn 1: Model requests tasks
      mockGeminiProvider.generateAgentTurn.mockResolvedValueOnce({
        text: null,
        functionCalls: [{ name: 'get_tasks', args: { limit: 25 } }],
        rawContent: {
          role: 'model',
          parts: [{ functionCall: { name: 'get_tasks', args: { limit: 25 } }, thoughtSignature: 'sig-1' }],
        },
      });

      // Tool returns bounded 25 tasks out of 136 total
      const mockTasks = Array.from({ length: 25 }, (_, i) => ({
        id: `t-${i + 1}`,
        taskNumber: i + 1,
        title: `Task ${i + 1}`,
        status: 'Todo',
      }));

      mockToolRegistry.execute.mockResolvedValueOnce({
        success: true,
        tool: 'get_tasks',
        data: { totalCount: 136, returnedCount: 25, tasks: mockTasks },
      });

      // Turn 2: Model synthesizes summary of the 25 tasks without issuing repeated get_tasks calls
      mockGeminiProvider.generateAgentTurn.mockResolvedValueOnce({
        text: 'Showing 25 of 136 tasks in this project. Most tasks are currently in Todo status.',
        functionCalls: null,
      });

      const res = await orchestrator.run({
        message: 'Show tasks in this project',
        context: validContext,
      });

      expect(res.success).toBe(true);
      expect(res.metadata.iterations).toBe(2);
      expect(res.metadata.llmCalls).toBe(2);
      expect(res.metadata.toolCalls).toBe(1);
      expect(res.metadata.toolsUsed).toEqual(['get_tasks']);
      expect(res.message).toContain('Showing 25 of 136 tasks');
    });

    it('should handle multi-turn reasoning with get_members', async () => {
      mockGeminiProvider.generateAgentTurn.mockResolvedValueOnce({
        text: null,
        functionCalls: [{ name: 'get_members', args: {} }],
      });

      mockToolRegistry.execute.mockResolvedValueOnce({
        success: true,
        tool: 'get_members',
        data: { totalCount: 1, members: [{ name: 'Deepak', role: 'ADMIN' }] },
      });

      mockGeminiProvider.generateAgentTurn.mockResolvedValueOnce({
        text: 'Team member Deepak is the project ADMIN.',
        functionCalls: null,
      });

      const res = await orchestrator.run({
        message: 'Who is in the team?',
        context: validContext,
      });

      expect(res.success).toBe(true);
      expect(res.metadata.toolsUsed).toEqual(['get_members']);
    });

    it('should handle multi-step reasoning with multiple sequential tools', async () => {
      // Step 1: get_project
      mockGeminiProvider.generateAgentTurn.mockResolvedValueOnce({
        text: null,
        functionCalls: [{ name: 'get_project', args: {} }],
      });
      mockToolRegistry.execute.mockResolvedValueOnce({
        success: true,
        tool: 'get_project',
        data: { id: 'p-1', name: 'Alpha' },
      });

      // Step 2: get_tasks
      mockGeminiProvider.generateAgentTurn.mockResolvedValueOnce({
        text: null,
        functionCalls: [{ name: 'get_tasks', args: { search: 'auth' } }],
      });
      mockToolRegistry.execute.mockResolvedValueOnce({
        success: true,
        tool: 'get_tasks',
        data: { totalCount: 1, tasks: [{ title: 'Auth Service' }] },
      });

      // Step 3: Final response
      mockGeminiProvider.generateAgentTurn.mockResolvedValueOnce({
        text: 'Project Alpha has 1 auth task: Auth Service.',
        functionCalls: null,
      });

      const res = await orchestrator.run({
        message: 'Inspect project and auth tasks',
        context: validContext,
      });

      expect(res.success).toBe(true);
      expect(res.metadata.iterations).toBe(3);
      expect(res.metadata.llmCalls).toBe(3);
      expect(res.metadata.toolCalls).toBe(2);
      expect(res.metadata.toolsUsed).toEqual(['get_project', 'get_tasks']);
    });

    it('should report tool execution error back to model when tool throws', async () => {
      mockGeminiProvider.generateAgentTurn.mockResolvedValueOnce({
        text: null,
        functionCalls: [{ name: 'get_project', args: { projectId: 'unauthorized-id' } }],
      });

      mockToolRegistry.execute.mockRejectedValueOnce(
        new AIAuthError('Access denied: You do not have permission')
      );

      mockGeminiProvider.generateAgentTurn.mockResolvedValueOnce({
        text: 'I could not access that project because you do not have permission.',
        functionCalls: null,
      });

      const res = await orchestrator.run({
        message: 'Show other project',
        context: validContext,
      });

      expect(res.success).toBe(true);
      expect(res.message).toContain('do not have permission');
    });
  });

  describe('Runtime Execution Budgets & Loop Detection', () => {
    it('should stop and return BUDGET_EXHAUSTED before exceeding maxLlmCalls', async () => {
      // Model keeps calling get_project indefinitely
      mockGeminiProvider.generateAgentTurn.mockResolvedValue({
        text: null,
        functionCalls: [{ name: 'get_project', args: {} }],
      });
      mockToolRegistry.execute.mockResolvedValue({
        success: true,
        data: { name: 'Demo' },
      });

      const res = await orchestrator.run({
        message: 'Keep going',
        context: validContext,
        options: { maxLlmCalls: 2, maxIterations: 10, maxToolCalls: 10 },
      });

      expect(res.success).toBe(false);
      expect(res.metadata.llmCalls).toBe(2);
      expect(res.metadata.terminationReason).toBe('BUDGET_EXHAUSTED');
      expect(res.message).toContain('budget reached');
    });

    it('should stop and return BUDGET_EXHAUSTED before exceeding maxIterations', async () => {
      mockGeminiProvider.generateAgentTurn.mockResolvedValue({
        text: null,
        functionCalls: [{ name: 'get_tasks', args: {} }],
      });
      mockToolRegistry.execute.mockResolvedValue({
        success: true,
        data: { tasks: [] },
      });

      const res = await orchestrator.run({
        message: 'Looping',
        context: validContext,
        options: { maxIterations: 1, maxLlmCalls: 10, maxToolCalls: 10 },
      });

      expect(res.success).toBe(false);
      expect(res.metadata.iterations).toBe(1);
      expect(res.metadata.terminationReason).toBe('BUDGET_EXHAUSTED');
    });

    it('should stop and return LOOP_DETECTED on repeated identical tool calls', async () => {
      mockGeminiProvider.generateAgentTurn.mockResolvedValue({
        text: null,
        functionCalls: [{ name: 'get_tasks', args: { search: 'same' } }],
      });
      mockToolRegistry.execute.mockResolvedValue({
        success: true,
        data: { tasks: [] },
      });

      const res = await orchestrator.run({
        message: 'Repeat identical',
        context: validContext,
        options: { maxIterations: 10, maxLlmCalls: 10, maxToolCalls: 10 },
      });

      expect(res.success).toBe(false);
      expect(res.metadata.terminationReason).toBe('LOOP_DETECTED');
      expect(res.message).toContain('loop detected');
    });

    it('should throw AITimeoutError when execution exceeds timeoutMs', async () => {
      mockGeminiProvider.generateAgentTurn.mockImplementation(async () => {
        // Simulate delay
        await new Promise((resolve) => setTimeout(resolve, 50));
        return { text: 'Done', functionCalls: null };
      });

      await expect(
        orchestrator.run({
          message: 'Fast timeout',
          context: validContext,
          options: { timeoutMs: 20 },
        })
      ).rejects.toThrow(AITimeoutError);
    });
  });

  describe('Error Propagation & No RuleBased Fallback', () => {
    it('should propagate AIRateLimitError directly without falling back to RuleBasedProvider', async () => {
      mockGeminiProvider.generateAgentTurn.mockRejectedValue(
        new AIRateLimitError('Quota exceeded 429')
      );

      await expect(
        orchestrator.run({ message: 'Plan', context: validContext })
      ).rejects.toThrow(AIRateLimitError);
    });

    it('should propagate AIProviderError on upstream 503 error', async () => {
      mockGeminiProvider.generateAgentTurn.mockRejectedValue(
        new AIProviderError('Upstream server overloaded 503')
      );

      await expect(
        orchestrator.run({ message: 'Plan', context: validContext })
      ).rejects.toThrow(AIProviderError);
    });
  });
});

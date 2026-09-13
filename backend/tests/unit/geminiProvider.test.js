jest.mock('@google/genai');
const { GoogleGenAI } = require('@google/genai');
const geminiProvider = require('../../src/services/ai/providers/geminiProvider');
const {
  AIConfigError,
  AIAuthError,
  AIRateLimitError,
  AIMalformedResponseError,
  AIProviderError,
} = require('../../src/services/ai/errors/aiErrors');

describe('GeminiProvider Unit Tests', () => {
  const mockGenerateContent = jest.fn();
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.GEMINI_API_KEY = 'test-gemini-key-123';
    process.env.GEMINI_MODEL = 'gemini-3.6-flash';

    geminiProvider.client = null;
    geminiProvider.apiKey = null;

    GoogleGenAI.mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent,
      },
    }));
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('generateText', () => {
    it('should throw AIConfigError when GEMINI_API_KEY is not set', async () => {
      delete process.env.GEMINI_API_KEY;
      geminiProvider.apiKey = null;
      geminiProvider.client = null;

      await expect(
        geminiProvider.generateText({ prompt: 'Hello' })
      ).rejects.toThrow(AIConfigError);
    });

    it('should throw AIMalformedResponseError when prompt is empty', async () => {
      await expect(
        geminiProvider.generateText({ prompt: '   ' })
      ).rejects.toThrow(AIMalformedResponseError);
    });

    it('should generate and normalize text on valid response', async () => {
      mockGenerateContent.mockResolvedValue({
        text: '  Task successfully planned.  ',
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 },
        candidates: [{ finishReason: 'STOP' }],
      });

      const res = await geminiProvider.generateText({
        prompt: 'Plan task for auth',
        systemInstruction: 'You are an engineer.',
        temperature: 0.5,
        maxTokens: 500,
      });

      expect(res.text).toBe('Task successfully planned.');
      expect(res.usage).toEqual({ promptTokenCount: 10, candidatesTokenCount: 5 });
      expect(res.finishReason).toBe('STOP');

      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-3.6-flash',
        contents: 'Plan task for auth',
        config: {
          systemInstruction: 'You are an engineer.',
          temperature: 0.5,
          maxOutputTokens: 500,
        },
      });
    });

    it('should throw AIMalformedResponseError if text returned by SDK is empty', async () => {
      mockGenerateContent.mockResolvedValue({
        text: '',
        candidates: [],
      });

      await expect(
        geminiProvider.generateText({ prompt: 'Hello' })
      ).rejects.toThrow(AIMalformedResponseError);
    });

    it('should classify SDK 429 error as retryable AIRateLimitError', async () => {
      mockGenerateContent.mockRejectedValue({
        status: 429,
        message: 'Resource has been exhausted (e.g. check quota).',
      });

      await expect(
        geminiProvider.generateText({ prompt: 'Hello' })
      ).rejects.toThrow(AIRateLimitError);
    });

    it('should classify SDK 401 error as non-retryable AIAuthError', async () => {
      mockGenerateContent.mockRejectedValue({
        status: 401,
        message: 'API key not valid',
      });

      await expect(
        geminiProvider.generateText({ prompt: 'Hello' })
      ).rejects.toThrow(AIAuthError);
    });

    it('should classify SDK 503 error as retryable AIProviderError', async () => {
      mockGenerateContent.mockRejectedValue({
        status: 503,
        message: 'Service Unavailable',
      });

      await expect(
        geminiProvider.generateText({ prompt: 'Hello' })
      ).rejects.toThrow(AIProviderError);
    });
  });

  describe('chat', () => {
    it('should format project context and return chat reply', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'I can help organize your sprint.',
        candidates: [{ finishReason: 'STOP' }],
      });

      const context = {
        name: 'Alpha Project',
        description: 'Core web app',
        totalTasks: 2,
        members: [{ name: 'Deepak', role: 'ADMIN' }],
        tasks: [{ id: 't-1', title: 'Task 1' }],
      };

      const result = await geminiProvider.chat(context, 'What should we do?');
      expect(result.reply).toBe('I can help organize your sprint.');
      expect(result.sources).toEqual([]);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });
  });

  describe('getProjectHealth', () => {
    it('should parse JSON response and return structured health score', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          score: 92,
          status: 'HEALTHY',
          reasons: ['No overdue tasks'],
          summary: 'Project is on track.',
        }),
      });

      const context = {
        name: 'Project Alpha',
        totalTasks: 5,
        tasks: [],
      };

      const health = await geminiProvider.getProjectHealth(context);
      expect(health.score).toBe(92);
      expect(health.status).toBe('HEALTHY');
      expect(health.reasons).toEqual(['No overdue tasks']);
      expect(health.summary).toBe('Project is on track.');
    });

    it('should fallback gracefully if response is not valid JSON', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'The project appears mostly healthy with some risks.',
      });

      const context = { name: 'Project Alpha', totalTasks: 5, tasks: [] };
      const health = await geminiProvider.getProjectHealth(context);

      expect(health.score).toBe(80);
      expect(health.status).toBe('HEALTHY');
      expect(health.summary).toBe('The project appears mostly healthy with some risks.');
    });
  });

  describe('getTaskInsights', () => {
    it('should parse JSON response and return task insights', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          insights: ['Task lacks assignee'],
          riskLevel: 'MEDIUM',
          riskScore: 35,
        }),
      });

      const context = { id: 't-1', title: 'Auth setup', blocked: false };
      const insights = await geminiProvider.getTaskInsights(context);

      expect(insights.riskLevel).toBe('MEDIUM');
      expect(insights.riskScore).toBe(35);
      expect(insights.insights).toEqual(['Task lacks assignee']);
    });
  });

  describe('generateAgentTurn', () => {
    it('should return rawContent preserving candidates[0].content and thoughtSignature', async () => {
      const mockCandidateContent = {
        role: 'model',
        parts: [
          { thought: true, text: 'Thinking about project retrieval...' },
          {
            functionCall: {
              name: 'get_project',
              args: { projectId: 'p-123' },
            },
            thoughtSignature: 'cryptographic-signature-abc-123',
          },
        ],
      };

      mockGenerateContent.mockResolvedValue({
        text: null,
        functionCalls: [{ name: 'get_project', args: { projectId: 'p-123' } }],
        candidates: [
          {
            content: mockCandidateContent,
            finishReason: 'STOP',
          },
        ],
        usageMetadata: { promptTokenCount: 25, candidatesTokenCount: 15 },
      });

      const res = await geminiProvider.generateAgentTurn({
        contents: [{ role: 'user', parts: [{ text: 'What is the project key?' }] }],
        systemInstruction: 'Agent system prompt',
        tools: [{ functionDeclarations: [] }],
      });

      expect(res.functionCalls).toEqual([{ name: 'get_project', args: { projectId: 'p-123' } }]);
      expect(res.text).toBeNull();
      expect(res.rawContent).toEqual(mockCandidateContent);
      expect(res.rawContent.parts[1].thoughtSignature).toBe('cryptographic-signature-abc-123');
      expect(res.usage).toEqual({ promptTokenCount: 25, candidatesTokenCount: 15 });
    });

    it('should return text response and rawContent when no tool is called', async () => {
      const mockCandidateContent = {
        role: 'model',
        parts: [{ text: 'The project key is DEMO.' }],
      };

      mockGenerateContent.mockResolvedValue({
        text: 'The project key is DEMO.',
        candidates: [
          {
            content: mockCandidateContent,
            finishReason: 'STOP',
          },
        ],
      });

      const res = await geminiProvider.generateAgentTurn({
        contents: [{ role: 'user', parts: [{ text: 'Answer directly' }] }],
      });

      expect(res.text).toBe('The project key is DEMO.');
      expect(res.functionCalls).toBeNull();
      expect(res.rawContent).toEqual(mockCandidateContent);
    });

    it('should throw AIMalformedResponseError if neither text nor functionCalls exist', async () => {
      mockGenerateContent.mockResolvedValue({
        text: '',
        candidates: [{ content: { role: 'model', parts: [] } }],
      });

      await expect(
        geminiProvider.generateAgentTurn({
          contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
        })
      ).rejects.toThrow(AIMalformedResponseError);
    });
  });
});

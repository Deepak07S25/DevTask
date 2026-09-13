jest.mock('../../src/services/ai/contextBuilder');
const ContextBuilder = require('../../src/services/ai/contextBuilder');
const aiService = require('../../src/services/ai/aiService');
const ruleBasedProvider = require('../../src/services/ai/ruleBasedProvider');
const externalProvider = require('../../src/services/ai/externalProvider');
const geminiProvider = require('../../src/services/ai/providers/geminiProvider');

describe('AIService Unit Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Provider Resolution', () => {
    it('should default to ruleBasedProvider when AI_PROVIDER is unset or rule-based', () => {
      delete process.env.AI_PROVIDER;
      expect(aiService.getProvider()).toBe(ruleBasedProvider);

      process.env.AI_PROVIDER = 'rule-based';
      expect(aiService.getProvider()).toBe(ruleBasedProvider);
    });

    it('should return externalProvider when AI_PROVIDER is external', () => {
      process.env.AI_PROVIDER = 'external';
      expect(aiService.getProvider()).toBe(externalProvider);
    });

    it('should return geminiProvider when AI_PROVIDER is gemini', () => {
      process.env.AI_PROVIDER = 'gemini';
      expect(aiService.getProvider()).toBe(geminiProvider);
    });
  });

  describe('Fallback Behavior on Provider Error', () => {
    it('should fallback to ruleBasedProvider if geminiProvider throws during chat', async () => {
      process.env.AI_PROVIDER = 'gemini';

      const mockContext = {
        id: 'p-1',
        name: 'Test Project',
        description: 'Testing',
        totalTasks: 1,
        tasks: [{ id: 't-1', title: 'Task 1', blocked: true }],
        members: [{ name: 'Deepak', role: 'ADMIN' }],
      };

      ContextBuilder.buildProjectContext.mockResolvedValue(mockContext);
      jest.spyOn(geminiProvider, 'chat').mockRejectedValue(new Error('Gemini API unreachable'));
      const fallbackSpy = jest.spyOn(ruleBasedProvider, 'chat');

      const response = await aiService.chat('p-1', 'are any tasks blocked?');

      expect(geminiProvider.chat).toHaveBeenCalledTimes(1);
      expect(fallbackSpy).toHaveBeenCalledTimes(1);
      expect(response.reply).toContain('blocked');
    });

    it('should fallback to ruleBasedProvider if provider throws during getProjectHealth', async () => {
      process.env.AI_PROVIDER = 'gemini';

      const mockContext = {
        id: 'p-1',
        name: 'Test Project',
        totalTasks: 0,
        tasks: [],
        members: [],
      };

      ContextBuilder.buildProjectContext.mockResolvedValue(mockContext);
      jest.spyOn(geminiProvider, 'getProjectHealth').mockRejectedValue(new Error('Timeout'));
      const fallbackSpy = jest.spyOn(ruleBasedProvider, 'getProjectHealth');

      const health = await aiService.getProjectHealth('p-1');

      expect(fallbackSpy).toHaveBeenCalledTimes(1);
      expect(health.score).toBe(100);
      expect(health.status).toBe('HEALTHY');
    });
  });
});

const {
  AIError,
  AIConfigError,
  AIAuthError,
  AIInvalidRequestError,
  AIRateLimitError,
  AITimeoutError,
  AIProviderError,
  AIMalformedResponseError,
  classifyGeminiError,
} = require('../../src/services/ai/errors/aiErrors');

describe('AI Error Hierarchy & Classification', () => {
  describe('Error Classes', () => {
    it('AIError should have default properties', () => {
      const err = new AIError('General error');
      expect(err.message).toBe('General error');
      expect(err.code).toBe('AI_ERROR');
      expect(err.retryable).toBe(false);
      expect(err.status).toBe(500);
      expect(err.retryAfterMs).toBeNull();
    });

    it('AIConfigError should be non-retryable with CONFIG_ERROR code', () => {
      const err = new AIConfigError('Missing key');
      expect(err.code).toBe('CONFIG_ERROR');
      expect(err.retryable).toBe(false);
    });

    it('AIAuthError should be non-retryable with 401 status', () => {
      const err = new AIAuthError('Invalid key');
      expect(err.code).toBe('AUTH_ERROR');
      expect(err.retryable).toBe(false);
      expect(err.status).toBe(401);
    });

    it('AIInvalidRequestError should be non-retryable with 400 status', () => {
      const err = new AIInvalidRequestError('Bad model');
      expect(err.code).toBe('INVALID_REQUEST');
      expect(err.retryable).toBe(false);
      expect(err.status).toBe(400);
    });

    it('AIRateLimitError should be retryable with 429 status and retryAfterMs', () => {
      const err = new AIRateLimitError('Too many requests', { retryAfterMs: 5000 });
      expect(err.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(err.retryable).toBe(true);
      expect(err.status).toBe(429);
      expect(err.retryAfterMs).toBe(5000);
    });

    it('AITimeoutError should be retryable with 408 status', () => {
      const err = new AITimeoutError('Timeout');
      expect(err.code).toBe('TIMEOUT');
      expect(err.retryable).toBe(true);
      expect(err.status).toBe(408);
    });

    it('AIProviderError should be retryable with 502 status', () => {
      const err = new AIProviderError('Internal error');
      expect(err.code).toBe('PROVIDER_SERVER_ERROR');
      expect(err.retryable).toBe(true);
      expect(err.status).toBe(502);
    });

    it('AIMalformedResponseError should be non-retryable with 502 status', () => {
      const err = new AIMalformedResponseError('Empty response');
      expect(err.code).toBe('MALFORMED_RESPONSE');
      expect(err.retryable).toBe(false);
    });
  });

  describe('classifyGeminiError Helper', () => {
    it('should return existing AIError instances untouched', () => {
      const existing = new AIConfigError('test');
      expect(classifyGeminiError(existing)).toBe(existing);
    });

    it('should classify 429 / RESOURCE_EXHAUSTED as AIRateLimitError', () => {
      const rawError = {
        status: 429,
        message: 'Resource has been exhausted (e.g. check quota).',
        response: { headers: { 'retry-after': '3' } },
      };
      const classified = classifyGeminiError(rawError);
      expect(classified).toBeInstanceOf(AIRateLimitError);
      expect(classified.retryable).toBe(true);
      expect(classified.retryAfterMs).toBe(3000);
    });

    it('should classify quota message without status as AIRateLimitError', () => {
      const rawError = new Error('Quota exceeded for metric');
      const classified = classifyGeminiError(rawError);
      expect(classified).toBeInstanceOf(AIRateLimitError);
      expect(classified.retryable).toBe(true);
    });

    it('should classify 401 / 403 / API_KEY_INVALID as AIAuthError', () => {
      const rawError = {
        status: 403,
        message: 'API key not valid. Please pass a valid API key.',
      };
      const classified = classifyGeminiError(rawError);
      expect(classified).toBeInstanceOf(AIAuthError);
      expect(classified.retryable).toBe(false);
    });

    it('should classify 400 / INVALID_ARGUMENT as AIInvalidRequestError', () => {
      const rawError = {
        status: 400,
        message: 'INVALID_ARGUMENT: contents must not be empty',
      };
      const classified = classifyGeminiError(rawError);
      expect(classified).toBeInstanceOf(AIInvalidRequestError);
      expect(classified.retryable).toBe(false);
    });

    it('should classify timeout / ETIMEDOUT as AITimeoutError', () => {
      const rawError = {
        code: 'ETIMEDOUT',
        message: 'connect ETIMEDOUT',
      };
      const classified = classifyGeminiError(rawError);
      expect(classified).toBeInstanceOf(AITimeoutError);
      expect(classified.retryable).toBe(true);
    });

    it('should classify 500 / 503 as AIProviderError', () => {
      const rawError = {
        status: 503,
        message: 'The model is overloaded. Please try again later.',
      };
      const classified = classifyGeminiError(rawError);
      expect(classified).toBeInstanceOf(AIProviderError);
      expect(classified.retryable).toBe(true);
    });
  });
});

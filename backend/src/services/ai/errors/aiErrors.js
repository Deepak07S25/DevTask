class AIError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code || 'AI_ERROR';
    this.retryable = options.retryable !== undefined ? options.retryable : false;
    this.status = options.status || 500;
    this.retryAfterMs = options.retryAfterMs || null;
    this.originalError = options.originalError || null;
  }
}

class AIConfigError extends AIError {
  constructor(message, options = {}) {
    super(message, {
      code: 'CONFIG_ERROR',
      retryable: false,
      status: 500,
      ...options,
    });
  }
}

class AIAuthError extends AIError {
  constructor(message, options = {}) {
    super(message, {
      code: 'AUTH_ERROR',
      retryable: false,
      status: 401,
      ...options,
    });
  }
}

class AIInvalidRequestError extends AIError {
  constructor(message, options = {}) {
    super(message, {
      code: 'INVALID_REQUEST',
      retryable: false,
      status: 400,
      ...options,
    });
  }
}

class AIRateLimitError extends AIError {
  constructor(message, options = {}) {
    super(message, {
      code: 'RATE_LIMIT_EXCEEDED',
      retryable: true,
      status: 429,
      ...options,
    });
  }
}

class AITimeoutError extends AIError {
  constructor(message, options = {}) {
    super(message, {
      code: 'TIMEOUT',
      retryable: true,
      status: 408,
      ...options,
    });
  }
}

class AIProviderError extends AIError {
  constructor(message, options = {}) {
    super(message, {
      code: 'PROVIDER_SERVER_ERROR',
      retryable: true,
      status: 502,
      ...options,
    });
  }
}

class AIMalformedResponseError extends AIError {
  constructor(message, options = {}) {
    super(message, {
      code: 'MALFORMED_RESPONSE',
      retryable: false,
      status: 502,
      ...options,
    });
  }
}

/**
 * Classifies any thrown error from the Gemini SDK or network layer
 * into structured AIError subclasses.
 *
 * @param {Error|any} error - Raw error thrown by SDK or network
 * @returns {AIError} Structured AIError instance
 */
function classifyGeminiError(error) {
  if (error instanceof AIError) {
    return error;
  }

  const rawMessage = error?.message || String(error);
  const status = error?.status || error?.statusCode || error?.response?.status;
  const lowerMsg = rawMessage.toLowerCase();

  // 1. Rate Limit / Quota Exceeded (429 / RESOURCE_EXHAUSTED / quota)
  if (
    status === 429 ||
    lowerMsg.includes('resource_exhausted') ||
    lowerMsg.includes('quota exceeded') ||
    lowerMsg.includes('rate limit') ||
    lowerMsg.includes('too many requests')
  ) {
    // Attempt to extract Retry-After header or millisecond hints
    let retryAfterMs = null;
    const retryHeader = error?.response?.headers?.['retry-after'] || error?.headers?.get?.('retry-after');
    if (retryHeader) {
      const seconds = parseFloat(retryHeader);
      if (!isNaN(seconds)) retryAfterMs = Math.round(seconds * 1000);
    }
    return new AIRateLimitError(rawMessage || 'Gemini rate limit or quota exceeded.', {
      status: 429,
      retryAfterMs,
      originalError: error,
    });
  }

  // 2. Authentication / API Key Errors (401 / 403 / API_KEY_INVALID / permission denied)
  if (
    status === 401 ||
    status === 403 ||
    lowerMsg.includes('api key not valid') ||
    lowerMsg.includes('api_key_invalid') ||
    lowerMsg.includes('permission_denied') ||
    lowerMsg.includes('unauthenticated') ||
    lowerMsg.includes('forbidden')
  ) {
    return new AIAuthError(rawMessage || 'Gemini authentication failed. Verify GEMINI_API_KEY.', {
      status: status || 401,
      originalError: error,
    });
  }

  // 3. Invalid Request / Bad Arguments / Model Not Found (400 / 404 / INVALID_ARGUMENT)
  if (
    status === 400 ||
    status === 404 ||
    lowerMsg.includes('invalid_argument') ||
    lowerMsg.includes('bad request') ||
    lowerMsg.includes('not found') ||
    lowerMsg.includes('unsupported model')
  ) {
    return new AIInvalidRequestError(rawMessage || 'Invalid request payload or model.', {
      status: status || 400,
      originalError: error,
    });
  }

  // 4. Timeout / Socket Hang Up / Aborted
  if (
    status === 408 ||
    status === 504 ||
    lowerMsg.includes('timeout') ||
    lowerMsg.includes('timed out') ||
    lowerMsg.includes('socket hang up') ||
    lowerMsg.includes('econnreset') ||
    error?.code === 'ETIMEDOUT' ||
    error?.code === 'ECONNRESET'
  ) {
    return new AITimeoutError(rawMessage || 'Request to Gemini timed out.', {
      status: 408,
      originalError: error,
    });
  }

  // 5. Provider / Server Error (500 / 502 / 503 / UNAVAILABLE / INTERNAL)
  if (
    status >= 500 ||
    lowerMsg.includes('internal error') ||
    lowerMsg.includes('unavailable') ||
    lowerMsg.includes('service unavailable')
  ) {
    return new AIProviderError(rawMessage || 'Gemini server error.', {
      status: status || 502,
      originalError: error,
    });
  }

  // 6. Default Fallback Provider Error (treated as retryable if generic network failure)
  return new AIProviderError(rawMessage || 'An unexpected error occurred during Gemini request.', {
    status: status || 500,
    retryable: true,
    originalError: error,
  });
}

module.exports = {
  AIError,
  AIConfigError,
  AIAuthError,
  AIInvalidRequestError,
  AIRateLimitError,
  AITimeoutError,
  AIProviderError,
  AIMalformedResponseError,
  classifyGeminiError,
};

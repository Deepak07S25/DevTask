const env = require('../../../config/env');
const geminiProvider = require('../providers/geminiProvider');
const toolRegistry = require('../tools/toolRegistry');
const { toGeminiFunctionDeclarations } = require('../tools/geminiToolAdapter');
const { buildAgentSystemPrompt } = require('../prompts/agentSystemPrompt');
const {
  AIInvalidRequestError,
  AIAuthError,
  AITimeoutError,
  classifyGeminiError,
} = require('../errors/aiErrors');

class AgentOrchestrator {
  constructor(options = {}) {
    this.geminiProvider = options.geminiProvider || geminiProvider;
    this.toolRegistry = options.toolRegistry || toolRegistry;
  }

  /**
   * Runs the agent execution loop with strict runtime budget, timeout, and loop detection enforcement.
   *
   * @param {Object} params
   * @param {string} params.message - User prompt / request
   * @param {Object} params.context - Trusted execution context: { userId, userRole, projectId, projectName }
   * @param {Object} [params.options] - Budget / configuration overrides
   * @returns {Promise<{success: boolean, message: string, metadata: Object}>}
   */
  async run({ message, context, options = {} } = {}) {
    const startTime = Date.now();

    // 1. Input & Context Validations
    if (!message || typeof message !== 'string' || !message.trim()) {
      throw new AIInvalidRequestError('Message must be a non-empty string.', { code: 'INVALID_MESSAGE' });
    }
    if (message.length > 2000) {
      throw new AIInvalidRequestError('Message exceeds maximum limit of 2000 characters.', { code: 'MESSAGE_TOO_LONG' });
    }
    if (!context || !context.userId) {
      throw new AIAuthError('Agent execution rejected: Missing authenticated user in execution context.', {
        code: 'UNAUTHORIZED_AGENT_EXECUTION',
      });
    }

    // 2. Budget Limits
    const maxLlmCalls = options.maxLlmCalls !== undefined ? options.maxLlmCalls : env.aiMaxLlmCalls;
    const maxToolCalls = options.maxToolCalls !== undefined ? options.maxToolCalls : env.aiMaxToolCalls;
    const maxIterations = options.maxIterations !== undefined ? options.maxIterations : env.aiMaxIterations;
    const timeoutMs = options.timeoutMs !== undefined ? options.timeoutMs : env.aiTimeoutMs;

    // 3. Execution State Tracking
    let llmCalls = 0;
    let toolCalls = 0;
    let iterations = 0;
    const toolsUsed = [];
    const toolHistorySignatures = [];

    const systemInstruction = buildAgentSystemPrompt(context);
    const readOnlyTools = this.toolRegistry.getReadOnlyTools();
    const geminiTools = toGeminiFunctionDeclarations(readOnlyTools);

    // Initial conversation contents
    const contents = [
      {
        role: 'user',
        parts: [{ text: message.trim() }],
      },
    ];

    let finalAnswer = null;
    let terminationReason = 'COMPLETED';

    // 4. Main Reasoning & Execution Loop
    while (!finalAnswer) {
      // PRE-CHECK: Global Timeout
      const elapsedMs = Date.now() - startTime;
      const remainingMs = timeoutMs - elapsedMs;
      if (remainingMs <= 0) {
        terminationReason = 'TIMEOUT';
        throw new AITimeoutError(`Agent execution timed out after ${elapsedMs}ms (limit: ${timeoutMs}ms).`, {
          code: 'AGENT_TIMEOUT',
        });
      }

      // PRE-CHECK: Iteration Budget
      if (iterations >= maxIterations) {
        terminationReason = 'BUDGET_EXHAUSTED';
        finalAnswer = 'Execution budget reached: Maximum reasoning iterations completed. Partial analysis stopped.';
        break;
      }

      // PRE-CHECK: LLM Call Budget
      if (llmCalls >= maxLlmCalls) {
        terminationReason = 'BUDGET_EXHAUSTED';
        finalAnswer = 'Execution budget reached: Maximum LLM calls limit reached.';
        break;
      }

      // Execute next LLM step with remaining timeout
      iterations += 1;
      llmCalls += 1;

      let response;
      let timer;
      try {
        const timeoutPromise = new Promise((_, reject) => {
          timer = setTimeout(() => {
            reject(new AITimeoutError(`Agent execution timed out after ${Date.now() - startTime}ms.`, {
              code: 'AGENT_TIMEOUT',
            }));
          }, remainingMs);
        });

        const turnPromise = this.geminiProvider.generateAgentTurn({
          contents,
          systemInstruction,
          tools: geminiTools,
          temperature: 0.2,
        });

        response = await Promise.race([turnPromise, timeoutPromise]);
      } catch (error) {
        terminationReason = error instanceof AITimeoutError ? 'TIMEOUT' : 'ERROR';
        throw classifyGeminiError(error);
      } finally {
        if (timer) clearTimeout(timer);
      }

      // Check if Gemini requested tool calls
      if (response.functionCalls && response.functionCalls.length > 0) {
        // Append model response with function calls to conversation history
        // Preserving rawContent ensures thought_signature and thinking blocks are retained across turns
        if (response.rawContent) {
          contents.push(response.rawContent);
        } else {
          contents.push({
            role: 'model',
            parts: response.functionCalls.map((fc) => ({
              functionCall: { name: fc.name, args: fc.args },
            })),
          });
        }

        const toolResponseParts = [];

        for (const fc of response.functionCalls) {
          // PRE-CHECK: Tool Call Budget
          if (toolCalls >= maxToolCalls) {
            terminationReason = 'BUDGET_EXHAUSTED';
            finalAnswer = 'Execution budget reached: Maximum tool calls limit reached.';
            break;
          }

          // Loop & Cycle Detection: check if exact tool signature repeats > 2 times consecutively
          const signature = `${fc.name}:${JSON.stringify(fc.args || {})}`;
          const recentRepeats = toolHistorySignatures.slice(-2);
          if (recentRepeats.length === 2 && recentRepeats.every((s) => s === signature)) {
            terminationReason = 'LOOP_DETECTED';
            finalAnswer = 'Execution stopped: Repeated identical tool calling loop detected.';
            break;
          }
          toolHistorySignatures.push(signature);

          toolCalls += 1;
          toolsUsed.push(fc.name);

          let toolOutput;
          try {
            const execResult = await this.toolRegistry.execute(fc.name, fc.args, context);
            toolOutput = { result: execResult.data };
          } catch (err) {
            // Report structured error back to model so it understands tool failure
            toolOutput = {
              error: {
                code: err.code || 'TOOL_ERROR',
                message: err.message || 'Tool execution failed',
              },
            };
          }

          toolResponseParts.push({
            functionResponse: {
              name: fc.name,
              response: toolOutput,
            },
          });
        }

        if (terminationReason === 'BUDGET_EXHAUSTED' || terminationReason === 'LOOP_DETECTED') {
          break;
        }

        // Append tool responses to history for next Gemini turn
        contents.push({
          role: 'user',
          parts: toolResponseParts,
        });
      } else if (response.text) {
        // Agent provided final text response
        finalAnswer = response.text;
        terminationReason = 'COMPLETED';
      } else {
        terminationReason = 'ERROR';
        throw new AIInvalidRequestError('Gemini turn produced neither text nor tool calls.');
      }
    }

    const durationMs = Date.now() - startTime;

    // Structured observability log
    console.log('[AgentOrchestrator Run Complete]', {
      userId: context.userId,
      projectId: context.projectId,
      iterations,
      llmCalls,
      toolCalls,
      toolsUsed,
      durationMs,
      terminationReason,
    });

    return {
      success: terminationReason === 'COMPLETED',
      message: finalAnswer,
      metadata: {
        iterations,
        llmCalls,
        toolCalls,
        toolsUsed,
        durationMs,
        terminationReason,
      },
    };
  }
}

module.exports = new AgentOrchestrator();
module.exports.AgentOrchestrator = AgentOrchestrator;

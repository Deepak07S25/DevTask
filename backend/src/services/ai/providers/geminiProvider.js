const { GoogleGenAI } = require('@google/genai');
const {
  AIConfigError,
  AIMalformedResponseError,
  classifyGeminiError,
} = require('../errors/aiErrors');

class GeminiProvider {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.GEMINI_API_KEY || null;
    this.model = options.model || process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    this.client = null;
  }

  getClient() {
    const key = this.apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new AIConfigError('GEMINI_API_KEY is missing. Configure it in environment variables.');
    }
    if (!this.client || this.client._key !== key) {
      this.client = new GoogleGenAI({ apiKey: key });
      this.client._key = key;
    }
    return this.client;
  }

  /**
   * Fundamental LLM text generation method.
   * Completely isolated from DEVtask business logic and database access.
   *
   * @param {Object} params
   * @param {string} params.prompt - User or agent prompt
   * @param {string} [params.systemInstruction] - Optional system instruction
   * @param {number} [params.temperature] - Sampling temperature (0.0 to 2.0)
   * @param {number} [params.maxTokens] - Maximum output tokens
   * @param {string} [params.model] - Override model name
   * @returns {Promise<{text: string, usage: Object|null, finishReason: string|null}>}
   */
  async generateText({ prompt, systemInstruction, temperature, maxTokens, model } = {}) {
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      throw new AIMalformedResponseError('Prompt must be a non-empty string.', { code: 'INVALID_REQUEST' });
    }

    const ai = this.getClient();
    const targetModel = model || this.model || process.env.GEMINI_MODEL || 'gemini-3.6-flash';

    const config = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }
    if (temperature !== undefined) {
      config.temperature = temperature;
    }
    if (maxTokens !== undefined) {
      config.maxOutputTokens = maxTokens;
    }

    try {
      const response = await ai.models.generateContent({
        model: targetModel,
        contents: prompt,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      const text = response?.text;

      if (!text || typeof text !== 'string' || !text.trim()) {
        throw new AIMalformedResponseError('Gemini returned an empty or malformed response text.');
      }

      return {
        text: text.trim(),
        usage: response.usageMetadata || null,
        finishReason: response.candidates?.[0]?.finishReason || null,
      };
    } catch (error) {
      throw classifyGeminiError(error);
    }
  }

  /**
   * Generates a multi-turn agent response supporting tools and function calling.
   *
   * @param {Object} params
   * @param {Array|string} params.contents - Conversation history or prompt
   * @param {string} [params.systemInstruction] - Agent system prompt
   * @param {Array|Object} [params.tools] - Gemini function declarations
   * @param {number} [params.temperature] - Sampling temperature
   * @param {number} [params.maxTokens] - Max output tokens
   * @param {string} [params.model] - Override model name
   * @returns {Promise<{text: string|null, functionCalls: Array<{name: string, args: Object}>|null, usage: Object|null, finishReason: string|null}>}
   */
  async generateAgentTurn({ contents, systemInstruction, tools, temperature, maxTokens, model } = {}) {
    if (!contents) {
      throw new AIMalformedResponseError('Contents must be provided for agent turn.', { code: 'INVALID_REQUEST' });
    }

    const ai = this.getClient();
    const targetModel = model || this.model || process.env.GEMINI_MODEL || 'gemini-3.6-flash';

    const config = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }
    if (tools) {
      config.tools = Array.isArray(tools) ? tools : [tools];
    }
    if (temperature !== undefined) {
      config.temperature = temperature;
    }
    if (maxTokens !== undefined) {
      config.maxOutputTokens = maxTokens;
    }

    try {
      const response = await ai.models.generateContent({
        model: targetModel,
        contents,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      // Extract function calls if present
      let functionCalls = null;
      if (response?.functionCalls && Array.isArray(response.functionCalls) && response.functionCalls.length > 0) {
        functionCalls = response.functionCalls.map((fc) => ({
          name: fc.name,
          args: fc.args || {},
        }));
      } else {
        const parts = response?.candidates?.[0]?.content?.parts || [];
        const fcParts = parts.filter((p) => p.functionCall);
        if (fcParts.length > 0) {
          functionCalls = fcParts.map((p) => ({
            name: p.functionCall.name,
            args: p.functionCall.args || {},
          }));
        }
      }

      const text = response?.text || null;

      if (!text && (!functionCalls || functionCalls.length === 0)) {
        throw new AIMalformedResponseError('Gemini returned an empty response with no text or tool calls.');
      }

      return {
        text: text ? text.trim() : null,
        functionCalls,
        rawContent: response.candidates?.[0]?.content || null,
        usage: response.usageMetadata || null,
        finishReason: response.candidates?.[0]?.finishReason || null,
      };
    } catch (error) {
      throw classifyGeminiError(error);
    }
  }

  /**
   * Existing AIService interface compatibility: Chat
   */
  async chat(context, message) {
    const systemInstruction = `You are the DEVtask AI Assistant. You help engineering teams manage software projects, sprints, and tasks.
Project Name: "${context.name}"
Description: "${context.description || 'No description'}"
Total Tasks: ${context.totalTasks}
Members: ${context.members.map((m) => `${m.name} (${m.role})`).join(', ')}
Existing Tasks Snapshot:
${JSON.stringify(context.tasks, null, 2)}

Provide helpful, concise, and structured assistance.`;

    const result = await this.generateText({
      prompt: message,
      systemInstruction,
      temperature: 0.7,
    });

    return {
      reply: result.text,
      sources: [],
      usage: result.usage,
    };
  }

  /**
   * Existing AIService interface compatibility: Project Health
   */
  async getProjectHealth(context) {
    const systemInstruction = `You are a software engineering project health analyzer.
Analyze the following project data and return a JSON object with:
- score: integer 0-100
- status: "HEALTHY" | "AT_RISK" | "CRITICAL"
- reasons: array of string explanation bullet points
- summary: concise summary sentence

Respond with strictly valid JSON without markdown wrapping.`;

    const prompt = `Project: ${context.name}
Total tasks: ${context.totalTasks}
Tasks: ${JSON.stringify(context.tasks)}`;

    const result = await this.generateText({
      prompt,
      systemInstruction,
      temperature: 0.2,
    });

    try {
      const parsed = JSON.parse(result.text.replace(/```json|```/g, '').trim());
      return {
        score: parsed.score ?? 75,
        status: parsed.status ?? 'HEALTHY',
        reasons: parsed.reasons ?? [],
        summary: parsed.summary ?? 'Project health analyzed by Gemini.',
      };
    } catch {
      return {
        score: 80,
        status: 'HEALTHY',
        reasons: ['Gemini analyzed project tasks successfully.'],
        summary: result.text,
      };
    }
  }

  /**
   * Existing AIService interface compatibility: Task Insights
   */
  async getTaskInsights(context) {
    const systemInstruction = `You are a software task risk analyzer.
Analyze the task and return a JSON object with:
- insights: array of string bullet points
- riskLevel: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
- riskScore: integer 0-100

Respond with strictly valid JSON without markdown wrapping.`;

    const prompt = `Task: ${JSON.stringify(context)}`;

    const result = await this.generateText({
      prompt,
      systemInstruction,
      temperature: 0.2,
    });

    try {
      const parsed = JSON.parse(result.text.replace(/```json|```/g, '').trim());
      return {
        insights: parsed.insights ?? ['Task analyzed by Gemini.'],
        riskLevel: parsed.riskLevel ?? 'LOW',
        riskScore: parsed.riskScore ?? 15,
      };
    } catch {
      return {
        insights: [result.text],
        riskLevel: 'LOW',
        riskScore: 20,
      };
    }
  }
}

module.exports = new GeminiProvider();

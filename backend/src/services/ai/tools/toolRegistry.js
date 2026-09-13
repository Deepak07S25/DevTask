const ToolDefinition = require('./toolDefinition');
const { getProjectTool, getTasksTool, getMembersTool } = require('./readOnlyTools');
const { AIInvalidRequestError, AIAuthError } = require('../errors/aiErrors');

class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.registerDefaultTools();
  }

  registerDefaultTools() {
    this.register(getProjectTool);
    this.register(getTasksTool);
    this.register(getMembersTool);
  }

  /**
   * Register a new ToolDefinition instance.
   * @param {ToolDefinition} tool
   */
  register(tool) {
    if (!(tool instanceof ToolDefinition)) {
      throw new Error('Tool must be an instance of ToolDefinition');
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * Look up a tool by name.
   * @param {string} name
   * @returns {ToolDefinition|undefined}
   */
  get(name) {
    return this.tools.get(name);
  }

  /**
   * Returns all registered tools.
   * @returns {ToolDefinition[]}
   */
  getAll() {
    return Array.from(this.tools.values());
  }

  /**
   * Returns all read-only tools.
   * @returns {ToolDefinition[]}
   */
  getReadOnlyTools() {
    return this.getAll().filter((t) => t.access === 'read');
  }

  /**
   * Safely executes a registered tool with server-side context validation.
   *
   * @param {string} toolName - Name of tool to execute
   * @param {Object} rawArgs - Arguments passed by LLM or caller
   * @param {Object} context - Trusted server context: { userId, userRole, projectId }
   * @returns {Promise<{success: boolean, tool: string, data: any}>}
   */
  async execute(toolName, rawArgs = {}, context = {}) {
    const tool = this.get(toolName);
    if (!tool) {
      throw new AIInvalidRequestError(`Unknown tool: "${toolName}". Only registered tools may be executed.`, {
        code: 'TOOL_NOT_FOUND',
      });
    }

    // Security check: Must have trusted server-provided userId
    if (!context || !context.userId) {
      throw new AIAuthError('Tool execution rejected: Missing authenticated user in execution context.', {
        code: 'UNAUTHORIZED_TOOL_EXECUTION',
      });
    }

    // Parameter validation with Zod
    const parseResult = tool.inputSchema.safeParse(rawArgs || {});
    if (!parseResult.success) {
      const issueMessages = parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      throw new AIInvalidRequestError(`Invalid arguments for tool "${toolName}": ${issueMessages}`, {
        code: 'INVALID_TOOL_ARGUMENTS',
        issues: parseResult.error.issues,
      });
    }

    // Execute tool
    const result = await tool.execute(parseResult.data, context);

    return {
      success: true,
      tool: toolName,
      data: result,
    };
  }
}

module.exports = new ToolRegistry();
module.exports.ToolRegistry = ToolRegistry;

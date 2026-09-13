const { z } = require('zod');

class ToolDefinition {
  /**
   * @param {Object} options
   * @param {string} options.name - Unique name of the tool (e.g. 'get_project')
   * @param {string} options.description - Detailed description of what the tool does
   * @param {'read'|'write'} options.access - Access mode ('read' or 'write')
   * @param {z.ZodTypeAny} options.inputSchema - Zod schema for validating input arguments
   * @param {Function} options.execute - Async execution function: (params, context) => Promise<any>
   */
  constructor({ name, description, access = 'read', inputSchema, execute }) {
    if (!name || typeof name !== 'string') {
      throw new Error('Tool name must be a non-empty string');
    }
    if (!description || typeof description !== 'string') {
      throw new Error('Tool description must be a non-empty string');
    }
    if (!['read', 'write'].includes(access)) {
      throw new Error('Tool access must be either "read" or "write"');
    }
    if (!inputSchema || typeof inputSchema.safeParse !== 'function') {
      throw new Error('Tool inputSchema must be a valid Zod schema');
    }
    if (typeof execute !== 'function') {
      throw new Error('Tool execute must be a function');
    }

    this.name = name;
    this.description = description;
    this.access = access;
    this.inputSchema = inputSchema;
    this.execute = execute;
  }
}

module.exports = ToolDefinition;

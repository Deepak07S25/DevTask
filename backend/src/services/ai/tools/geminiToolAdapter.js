const { z } = require('zod');

/**
 * Maps Zod type definitions to OpenAPI / Gemini JSON Schema types.
 */
function zodToGeminiSchema(schema) {
  if (!schema) {
    return { type: 'OBJECT', properties: {} };
  }

  // If it's a ZodObject
  if (schema instanceof z.ZodObject || schema._def?.typeName === 'ZodObject') {
    const shape = schema.shape || schema._def?.shape();
    const properties = {};
    const required = [];

    for (const [key, propSchema] of Object.entries(shape)) {
      let current = propSchema;
      let isOptional = false;
      const inheritedDescription = propSchema.description || propSchema._def?.description;

      while (
        current instanceof z.ZodOptional ||
        current instanceof z.ZodNullable ||
        current._def?.typeName === 'ZodOptional' ||
        current._def?.typeName === 'ZodNullable'
      ) {
        if (current instanceof z.ZodOptional || current._def?.typeName === 'ZodOptional') {
          isOptional = true;
        }
        current = current._def.innerType;
      }

      if (!isOptional) {
        required.push(key);
      }

      const prop = zodTypeToGeminiProperty(current);
      if (inheritedDescription && !prop.description) {
        prop.description = inheritedDescription;
      }
      properties[key] = prop;
    }

    const result = {
      type: 'OBJECT',
      properties,
    };
    if (required.length > 0) {
      result.required = required;
    }
    return result;
  }

  return { type: 'OBJECT', properties: {} };
}

function zodTypeToGeminiProperty(zodType) {
  const typeName = zodType.constructor?.name || zodType._def?.typeName;

  if (typeName === 'ZodString' || zodType instanceof z.ZodString) {
    return { type: 'STRING', description: zodType.description || undefined };
  }
  if (typeName === 'ZodNumber' || zodType instanceof z.ZodNumber) {
    return { type: 'NUMBER', description: zodType.description || undefined };
  }
  if (typeName === 'ZodBoolean' || zodType instanceof z.ZodBoolean) {
    return { type: 'BOOLEAN', description: zodType.description || undefined };
  }
  if (typeName === 'ZodEnum' || zodType instanceof z.ZodEnum) {
    const values = zodType._def?.values || zodType.options || [];
    return {
      type: 'STRING',
      enum: values,
      description: zodType.description || `One of: ${values.join(', ')}`,
    };
  }
  if (typeName === 'ZodArray' || zodType instanceof z.ZodArray) {
    const itemType = zodType._def?.type || zodType.element;
    return {
      type: 'ARRAY',
      items: zodTypeToGeminiProperty(itemType),
    };
  }

  return { type: 'STRING' };
}

/**
 * Converts internal ToolDefinition objects into Gemini-compatible Function Declarations.
 *
 * @param {import('./toolDefinition')[]} tools - List of ToolDefinition instances
 * @returns {{ functionDeclarations: Object[] }} Formatted tools for @google/genai SDK
 */
function toGeminiFunctionDeclarations(tools) {
  if (!Array.isArray(tools)) {
    throw new Error('tools must be an array of ToolDefinition instances');
  }

  const functionDeclarations = tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: zodToGeminiSchema(tool.inputSchema),
  }));

  return { functionDeclarations };
}

module.exports = {
  zodToGeminiSchema,
  toGeminiFunctionDeclarations,
};

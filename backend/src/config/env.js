// src/config/env.js
/**
 * Centralized Environment Configuration
 * Safe migration path: Automatically falls back to local configs during development,
 * but STRICTLY requires them in production to prevent insecure deployments.
 */

require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';

const env = {
    isProduction: isProd,
    port: process.env.PORT || 5000,
    
    // Auth & Security
    jwtSecret: process.env.JWT_SECRET || 'fallback_dev_secret_key_change_me',
    
    // CORS configuration
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

    // AI Configuration
    aiProvider: process.env.AI_PROVIDER || 'rule-based',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-3.6-flash',

    // AI Execution Budgets
    aiMaxLlmCalls: parseInt(process.env.AI_MAX_LLM_CALLS_PER_REQUEST, 10) || 5,
    aiMaxToolCalls: parseInt(process.env.AI_MAX_TOOL_CALLS_PER_REQUEST, 10) || 10,
    aiMaxIterations: parseInt(process.env.AI_MAX_AGENT_ITERATIONS, 10) || 5,
    aiTimeoutMs: parseInt(process.env.AI_AGENT_TIMEOUT_MS, 10) || 30000,
};

// Strict Mode Enforcements
if (!process.env.DATABASE_URL) {
    console.error("❌ CRITICAL: DATABASE_URL is missing. Shutting down.");
    process.exit(1);
}

if (isProd) {
    if (!process.env.JWT_SECRET) {
        console.error("❌ CRITICAL: JWT_SECRET is missing in production. Shutting down.");
        process.exit(1);
    }
    if (!process.env.FRONTEND_URL) {
        console.warn("⚠️ WARNING: FRONTEND_URL is missing in production. Falling back to localhost.");
    }
    if (process.env.AI_PROVIDER === 'gemini' && !process.env.GEMINI_API_KEY) {
        console.warn("⚠️ WARNING: AI_PROVIDER is set to 'gemini' but GEMINI_API_KEY is not set.");
    }
}

module.exports = env;

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
};

// Strict Mode Enforcements for Production
if (isProd) {
    if (!process.env.JWT_SECRET) {
        console.error("❌ CRITICAL: JWT_SECRET is missing in production. Shutting down.");
        process.exit(1);
    }
    if (!process.env.FRONTEND_URL) {
        console.warn("⚠️ WARNING: FRONTEND_URL is missing in production. Falling back to localhost.");
    }
}

module.exports = env;

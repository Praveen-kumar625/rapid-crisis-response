// backend/src/config/env.js
require('dotenv').config();
const { z } = require('zod');

const envSchema = z.object({
    PORT: z.coerce.number().default(3001),
    DB_HOST: z.string().default('localhost'),
    DB_PORT: z.coerce.number().default(5432),
    DB_NAME: z.string().optional(),
    DB_USER: z.string().optional(),
    DB_PASS: z.string().optional(),
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().default(6379),
    GEMINI_API_KEY: z.string().optional(), 
    NODE_ENV: z.string().default('development'), // 🚨 FIXED: Allow any string to capture 'test' from Jest
    ALLOWED_ORIGINS: z.string().default(''),
});

const parsed = envSchema.safeParse(process.env);

// Only crash on invalid env in production
if (!parsed.success && process.env.NODE_ENV === 'production') {
    console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2));
    process.exit(1);
}

const env = parsed.data || process.env;

module.exports = {
    PORT: env.PORT,
    NODE_ENV: process.env.NODE_ENV || env.NODE_ENV || 'development', // 🚨 FIXED: Prioritize process.env
    DB: {
        host: env.DB_HOST || 'localhost',
        port: env.DB_PORT || 5432,
        name: env.DB_NAME,
        user: env.DB_USER,
        password: env.DB_PASS,
    },
    REDIS: {
        host: env.REDIS_HOST || 'localhost',
        port: env.REDIS_PORT || 6379,
    },
    GEMINI_API_KEY: env.GEMINI_API_KEY,
    ALLOWED_ORIGINS: (env.ALLOWED_ORIGINS || '').split(',').map(u => u.trim()).filter(Boolean),
    DEMO_MODE: process.env.DEMO_MODE === 'true',
};

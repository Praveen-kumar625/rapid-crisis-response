// backend/src/config/env.js
require('dotenv').config();
const { z } = require('zod');

// 🚨 VALIDATION: Ensure critical env vars are present at startup
const envSchema = z.object({
    PORT: z.coerce.number().default(3001),
    DB_HOST: z.string().default('localhost'),
    DB_PORT: z.coerce.number().default(5432),
    DB_NAME: z.string().optional(),
    DB_USER: z.string().optional(),
    DB_PASS: z.string().optional(),
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().default(6379),
    GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required for AI features"),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    ALLOWED_ORIGINS: z.string().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success && process.env.NODE_ENV === 'production') {
    console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2));
    process.exit(1);
}

const env = parsed.data || process.env;

module.exports = {
    PORT: env.PORT,
    NODE_ENV: env.NODE_ENV,
    DB: {
        host: env.DB_HOST || process.env.PGHOST || 'localhost',
        port: env.DB_PORT || 5432,
        name: env.DB_NAME || process.env.PGDATABASE,
        user: env.DB_USER || process.env.PGUSER,
        password: env.DB_PASS || process.env.PGPASSWORD,
    },
    REDIS: {
        host: env.REDIS_HOST || 'localhost',
        port: env.REDIS_PORT || 6379,
    },
    AUTH0: {
        domain: process.env.AUTH0_DOMAIN,
        audience: process.env.AUTH0_AUDIENCE,
    },
    // ------------------- Gemini AI -------------------
    GEMINI_API_KEY: env.GEMINI_API_KEY,

    // ------------------- CORS ------------------------
    ALLOWED_ORIGINS: (env.ALLOWED_ORIGINS || '')
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean),

    // ------------------- Twilio ----------------------
    TWILIO: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        fromNumber: process.env.TWILIO_FROM_NUMBER,
        toNumbers: process.env.TWILIO_TO_NUMBERS, // comma‑separated
    },

    // ------------------- Demo Mode -------------------
    DEMO_MODE: process.env.DEMO_MODE === 'true',

    // ------------------- AWS S3 Storage --------------
    S3: {
        bucketName: process.env.AWS_S3_BUCKET,
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        endpoint: process.env.AWS_S3_ENDPOINT, // Optional for S3-compatible like Minio/DigitalOcean
    },
};
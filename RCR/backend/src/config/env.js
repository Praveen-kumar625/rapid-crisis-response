// backend/src/config/env.js
require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || process.env.PORT_API || 3001,
    DB: {
        host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
        port: Number(process.env.DB_PORT || process.env.PGPORT || 5432),
        name: process.env.DB_NAME || process.env.PGDATABASE,
        user: process.env.DB_USER || process.env.PGUSER,
        password: process.env.DB_PASS || process.env.PGPASSWORD,
    },
    REDIS: {
        host: process.env.REDIS_HOST || process.env.REDISHOST || 'localhost',
        port: Number(process.env.REDIS_PORT || process.env.REDISPORT || 6379),
    },
    AUTH0: {
        domain: process.env.AUTH0_DOMAIN,
        audience: process.env.AUTH0_AUDIENCE,
    },
    // ------------------- Gemini AI -------------------
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,

    // ------------------- CORS ------------------------
    ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || '')
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

    // ------------------- Responder HQ (optional) -----
    // If you want to change the base location without rebuilding the UI,
    // you can also read it from environment variables in the frontend.
    // (Frontend uses its own vars – see .env.example below)
};
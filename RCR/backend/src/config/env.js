// backend/src/config/env.js
require('dotenv').config();

module.exports = {
    PORT: process.env.PORT_API || 3001,
    DB: {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        name: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
    },
    REDIS: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
    },
    AUTH0: {
        domain: process.env.AUTH0_DOMAIN,
        audience: process.env.AUTH0_AUDIENCE,
    },
    // ------------------- Gemini AI -------------------
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,

    // ------------------- Twilio ----------------------
    TWILIO: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        fromNumber: process.env.TWILIO_FROM_NUMBER,
        toNumbers: process.env.TWILIO_TO_NUMBERS, // comma‑separated
    },

    // ------------------- Demo Mode -------------------
    DEMO_MODE: process.env.DEMO_MODE === 'true',

    // ------------------- Responder HQ (optional) -----
    // If you want to change the base location without rebuilding the UI,
    // you can also read it from environment variables in the frontend.
    // (Frontend uses its own vars – see .env.example below)
};
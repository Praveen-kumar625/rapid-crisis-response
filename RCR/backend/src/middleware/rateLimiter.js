const rateLimit = require('express-rate-limit');

// Strictly limit AI verification routes to prevent Gemini quota exhaustion
const aiVerificationLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window
    max: 5, // Limit each IP to 5 requests per `window` (here, per minute)
    message: {
        error: 'Too many requests from this IP, please try again after a minute.',
        status: 429
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = {
    aiVerificationLimiter
};
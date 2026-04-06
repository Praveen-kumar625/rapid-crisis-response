const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('express-async-errors');
const healthRoutes = require('./routes/health.routes');
const incidentRoutes = require('./routes/incidents.routes');
const rateLimit = require('express-rate-limit');
const { ALLOWED_ORIGINS, NODE_ENV } = require('./config/env');

const app = express();

app.set('trust proxy', 1);

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => NODE_ENV === 'test' // 🚨 FIXED: Skip rate limit in tests
});
app.use(globalLimiter);

app.use(
    cors({
        origin: function(origin, callback) {
            // 🚨 FIXED: Broaden exception for non-production environments and Vercel MVP
            const allowed = ['https://rapid-crisis-response-f4yd.vercel.app', 'http://localhost:3000'];
            if (!origin || NODE_ENV !== 'production' || allowed.includes(origin)) {
                return callback(null, true);
            }

            if (ALLOWED_ORIGINS.includes(origin)) {
                return callback(null, true);
            }
            
            return callback(new Error('CORS policy: Origin not allowed.'), false);
        },
        credentials: true,
    })
);

app.use(helmet());
if (NODE_ENV !== 'test') app.use(morgan('combined'));
app.use(express.json());

app.use('/health', healthRoutes);
app.use('/incidents', incidentRoutes);

app.use((err, _req, res, _next) => {
    // Only log errors if not in test mode
    if (NODE_ENV !== 'test') console.error(err);
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('express-async-errors'); // auto‑forward async errors
const healthRoutes = require('./routes/health.routes');
const incidentRoutes = require('./routes/incidents.routes');

const app = express();

// Fix for reverse proxies so rate-limiter reads the real user IP
app.set('trust proxy', 1);

const { ALLOWED_ORIGINS } = require('./config/env');

app.use(
    cors({
        origin: function(origin, callback) {
            // Allow server-to-server or locally-hosted requests without origin
            if (!origin) return callback(null, true);
            
            if (ALLOWED_ORIGINS.includes(origin)) {
                return callback(null, true);
            }
            
            return callback(new Error('CORS policy: Origin not allowed.'), false);
        },
        credentials: true,
    })
);
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

// Public health check
app.use('/health', healthRoutes);

// Incident routes (protected by JWT – middleware inside controller)
app.use('/incidents', incidentRoutes);

// Global error handler
app.use((err, _req, res, _next) => {
    console.error(err);
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;
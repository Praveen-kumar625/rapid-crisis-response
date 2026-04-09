const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('express-async-errors'); // Note: This already does some lifting for async routes
const healthRoutes = require('./routes/health.routes');
const incidentRoutes = require('./routes/incidents.routes');
const sosRoutes = require('./routes/sos.routes');
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
    skip: () => NODE_ENV === 'test'
});
app.use(globalLimiter);

app.use(
    cors({
        origin: function(origin, callback) {
            const allowedPatterns = [
                /^https:\/\/rapid-crisis-response-.*\.vercel\.app$/,
                /^https:\/\/rapid-crisis-response-f4yd\.vercel\.app$/
            ];
            const allowedOrigins = ['http://localhost:3000', 'https://rapid-crisis-response-f4yd.vercel.app'];

            if (!origin || NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            const isVercelPreview = allowedPatterns.some(pattern => pattern.test(origin));
            if (isVercelPreview) {
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
app.use(express.json({ limit: '10mb' })); // Support larger base64 audio payloads

// Routes
app.use('/health', healthRoutes);
app.use('/incidents', incidentRoutes);
app.use('/sos', sosRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// PHASE 3: Global Async Error Handling Middleware
// This must be the last middleware in the stack
app.use((err, req, res, next) => {
    const isTest = NODE_ENV === 'test';
    
    // Log the error for debugging (excluding test environment noise)
    if (!isTest) {
        console.error('🚨 [Global Error Handler]:', {
            message: err.message,
            stack: err.stack,
            path: req.originalUrl,
            method: req.method
        });
    }

    // Standardized Error Response
    const statusCode = err.status || err.statusCode || 500;
    
    res.status(statusCode).json({
        success: false,
        error: {
            message: err.message || 'Internal Server Error',
            ...(NODE_ENV === 'development' && { stack: err.stack }) // Only show stack in dev
        }
    });
    
    // Crucial: We do NOT call next() here unless we want another error handler to pick it up.
    // By responding, we prevent the Node process from crashing/exiting due to unhandled errors in the request-response cycle.
});

module.exports = app;

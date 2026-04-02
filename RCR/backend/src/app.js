const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('express-async-errors'); // auto‑forward async errors
const healthRoutes = require('./routes/health.routes');
const incidentRoutes = require('./routes/incidents.routes');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(helmet());
app.use(morgan('dev'));
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
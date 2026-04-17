const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ 1. CORS FIX (works for both local + deployed frontend)
app.use(cors({
    origin: [
        'http://localhost:3000',          // local frontend
        'https://your-vercel-app.vercel.app' // 🔥 replace with your deployed frontend URL
    ],
    credentials: true,
}));

// ✅ 2. Middleware
app.use(express.json());

// ✅ 3. Health check route (IMPORTANT for deployment)
app.get('/', (req, res) => {
    res.send('🚀 Rapid Crisis Response Backend Running');
});

// ✅ 4. Incident Endpoint
app.post('/incidents', (req, res) => {
    try {
        console.log("📡 Transmission received:", req.body);

        // 👉 Later: add DB logic here (Knex / Mongo / etc.)

        res.status(201).json({
            status: 'success',
            message: 'Report processed successfully',
            data: req.body
        });

    } catch (error) {
        console.error("❌ Error processing incident:", error);

        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
});

// ✅ 5. 404 handler
app.use((req, res) => {
    res.status(404).json({
        status: 'fail',
        message: 'Route not found'
    });
});

// ✅ 6. Start server
app.listen(PORT, () => {
    console.log(`🔥 Server running on http://localhost:${PORT}`);
});
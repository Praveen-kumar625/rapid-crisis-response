const http = require('http');
const app = require('./app');
const { initSocket } = require('./sockets');
const { PORT } = require('./config/env');
const db = require('./db');
const { connection } = require('./infrastructure/queue');

const server = http.createServer(app);
initSocket(server); // attaches Socket.io & Redis bridge

server.listen(PORT, () => {
    console.log(`🚀 API listening on http://localhost:${PORT}`);
});

// 🚨 GRACEFUL SHUTDOWN: Close DB and Redis connections
const shutdown = async (signal) => {
    console.log(`\n[${signal}] Shutting down gracefully...`);
    
    server.close(() => {
        console.log('HTTP server closed.');
    });

    try {
        await db.destroy();
        console.log('Database connection closed.');
        
        if (connection) {
            await connection.quit();
            console.log('Redis connection closed.');
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
    }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

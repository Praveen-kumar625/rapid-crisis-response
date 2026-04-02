const http = require('http');
const app = require('./app');
const { initSocket } = require('./sockets');
const { PORT } = require('./config/env');

const server = http.createServer(app);
initSocket(server); // attaches Socket.io & Redis bridge

server.listen(PORT, () => {
    console.log(`🚀 API listening on http://localhost:${PORT}`);
});
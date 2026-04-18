import { io } from 'socket.io-client';
import { getPendingReports, markReportSynced } from './idb';
import toast from 'react-hot-toast';

let socket = null;
let isSyncing = false;

/**
 * Returns a singleton Socket.io client.
 */
export async function getSocket() {
    if (socket) return socket;

    const token = localStorage.getItem('google_token');
    // Bulletproof URL Resolution: Prioritize ENV, fallback to production API, then local
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 
                      (process.env.NODE_ENV === 'production' 
                        ? 'https://rapid-crisis-response-f4yd.vercel.app' 
                        : 'http://localhost:3001'); // Changed port to 3001 to match backend default in index.js

    socket = io(SOCKET_URL, {
        path: '/crisis',
        transports: ['websocket', 'polling'], // Critical: allow fallback to polling if WS upgrade is blocked
        auth: { token },
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        withCredentials: true
    });

    socket.on('connect', () => {
        console.log('[Socket] Uplink Established via:', socket.io.engine.transport.name);
        flushSyncQueue();
    });

    socket.on('connect_error', (err) => {
        console.error('Socket Connection Failed:', err.message);
        console.error('Transport state:', err.context?.readyState);
    });

    return socket;
}

/**
 * OBJECTIVE 2: fail-safe socket emitter with timeout
 */
export async function emitWithTimeout(event, payload, timeout = 5000) {
    const s = await getSocket();
    
    return new Promise((resolve, reject) => {
        let timer = setTimeout(() => {
            reject(new Error(`TIMEOUT:${event}`));
        }, timeout);

        try {
            s.emit(event, payload, (response) => {
                clearTimeout(timer);
                if (response && response.status === 'error') {
                    reject(new Error(response.message || 'SOCKET_ERROR'));
                } else {
                    resolve(response);
                }
            });
        } catch (err) {
            clearTimeout(timer);
            reject(err);
        }
    });
}

/**
 * OBJECTIVE 2: Automatic Queue Flusher
 * Deadlock technical diagnostic: The queue was previously passive; this flusher implements 
 * a proactive async loop triggered by 'connect' events and online status.
 */
export async function flushSyncQueue() {
    if (isSyncing || !navigator.onLine) return;
    
    try {
        const pending = await getPendingReports();
        if (pending.length === 0) return;

        isSyncing = true;
        const s = await getSocket();

        console.log(`[Sync] Proactive uplink: Processing ${pending.length} queued signals...`);

        for (const report of pending) {
            try {
                // Ensure report has required fields for backend
                const syncPayload = {
                    ...report,
                    status: 'OPEN',
                    createdAt: report.createdAt || new Date()
                };

                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => reject(new Error('SYNC_TIMEOUT')), 10000);
                    s.emit('incident.create', syncPayload, (ack) => {
                        clearTimeout(timeout);
                        if (ack && (ack.status === 'success' || ack.id)) resolve();
                        else reject(new Error('ACK_FAIL'));
                    });
                });
                await markReportSynced(report.localId);
                console.log(`[Sync] Node ${report.localId} synchronization confirmed.`);
            } catch (err) {
                console.error(`[Sync] Terminal failure for report ${report.localId}:`, err.message);
                // If it's a timeout, we stop and wait for better connectivity
                if (err.message === 'SYNC_TIMEOUT') break;
            }
        }
    } catch (err) {
        console.error('[Sync] Queue access error:', err);
    } finally {
        isSyncing = false;
        // Check if we still have pending reports
        const remaining = await getPendingReports();
        if (remaining.length === 0 && navigator.onLine) {
            // All good
        }
    }
}

// FIXED: Export function to update socket token on refresh
export const updateSocketToken = (newToken) => {
    if (socket) {
        socket.auth.token = newToken;
        socket.disconnect().connect();
    }
};

export const joinHotelRoom = async (hotelId) => {
    const s = await getSocket();
    if (hotelId) {
        s.emit('join-hotel', hotelId);
    }
};
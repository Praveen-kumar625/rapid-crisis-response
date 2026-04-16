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
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'https://rapid-crisis-response-f4yd.vercel.app' || 'http://localhost:5000';

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
 * OBJECTIVE 2: Fail-safe Socket Emitter with Timeout
 */
export async function emitWithTimeout(event, payload, timeout = 5000) {
    const s = await getSocket();
    
    return new Promise((resolve, reject) => {
        let timer = setTimeout(() => {
            reject(new Error(`TIMEOUT:${event}`));
        }, timeout);

        s.emit(event, payload, (response) => {
            clearTimeout(timer);
            if (response && response.status === 'error') {
                reject(new Error(response.message || 'SOCKET_ERROR'));
            } else {
                resolve(response);
            }
        });
    });
}

/**
 * OBJECTIVE 2: Automatic Queue Flusher
 * Deadlock technical diagnostic: The queue was previously passive; this flusher implements 
 * a proactive async loop triggered by 'connect' events and online status.
 */
export async function flushSyncQueue() {
    if (isSyncing || !navigator.onLine) return;
    
    const pending = await getPendingReports();
    if (pending.length === 0) return;

    isSyncing = true;
    const s = await getSocket();

    console.log(`[Sync] Processing ${pending.length} queued signals...`);

    for (const report of pending) {
        try {
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('SYNC_TIMEOUT')), 5000);
                s.emit('report.created', report, (ack) => {
                    clearTimeout(timeout);
                    if (ack && ack.status === 'success') resolve();
                    else reject(new Error('ACK_FAIL'));
                });
            });
            await markReportSynced(report.localId);
            console.log(`[Sync] Node ${report.localId} confirmed.`);
        } catch (err) {
            console.error(`[Sync] Failed to flush report ${report.localId}:`, err.message);
            break; // Stop flushing if we hit a serious error
        }
    }
    
    isSyncing = false;
    if (pending.length > 0) toast.success('Offline signals synchronized.');
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
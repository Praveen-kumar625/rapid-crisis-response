import { io } from 'socket.io-client';

let socket = null;

/**
 * Returns a singleton Socket.io client.
 * JWT (if any) is sent via the `auth` field.
 */
export async function getSocket() {
    if (socket) return socket;

    const token = localStorage.getItem('google_token');

    socket = io(process.env.REACT_APP_SOCKET_URL, {
        path: '/crisis',
        transports: ['websocket'],
        auth: { token },
    });

    socket.on('connect_error', (err) => console.error('WS error', err));

    return socket;
}

// FIXED: Export function to update socket token on refresh
export const updateSocketToken = (newToken) => {
    if (socket) {
        console.log('[Socket] Updating auth token and reconnecting...');
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
import { io } from 'socket.io-client';
import { auth } from './firebase';

let socket = null;

/**
 * Returns a singleton Socket.io client.
 * JWT (if any) is sent via the `auth` field.
 */
export async function getSocket() {
    if (socket) return socket;

    let token = null;
    if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
    }

    socket = io(process.env.REACT_APP_SOCKET_URL, {
        path: '/crisis',
        transports: ['websocket'],
        auth: { token },
    });

    socket.on('connect_error', (err) => console.error('WS error', err));

    return socket;
}

export const joinHotelRoom = async (hotelId) => {
    const s = await getSocket();
    if (hotelId) {
        s.emit('join-hotel', hotelId);
    }
};
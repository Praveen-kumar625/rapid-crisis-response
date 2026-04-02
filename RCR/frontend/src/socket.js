import { io } from 'socket.io-client';
import { getAccessTokenSilently } from '@auth0/auth0-react';

let socket = null;

/**
 * Returns a singleton Socket.io client.
 * JWT (if any) is sent via the `auth` field.
 */
export async function getSocket() {
    if (socket) return socket;

    const token = await getAccessTokenSilently().catch(() => null);

    socket = io(process.env.REACT_APP_SOCKET_URL, {
        path: '/crisis',
        transports: ['websocket'],
        auth: { token },
    });

    socket.on('connect_error', (err) => console.error('WS error', err));

    return socket;
}
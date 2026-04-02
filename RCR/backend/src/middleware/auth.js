// backend/src/middleware/auth.js
const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(), // Relies on GOOGLE_APPLICATION_CREDENTIALS env var
    });
}

async function jwtAuth(req, res, next) {
    if (process.env.DEMO_MODE === 'true') {
        req.user = { sub: 'demo-admin-1', email: 'demo@google.com' };
        return next();
    }

    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) return res.status(401).json({ message: 'Missing token' });

    const token = authHeader.split(' ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = { sub: decodedToken.uid, email: decodedToken.email };
        next();
    } catch (error) {
        console.error('[Auth] Firebase token verification failed:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
}

module.exports = jwtAuth;
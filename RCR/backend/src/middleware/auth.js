// backend/src/middleware/auth.js
const admin = require('firebase-admin');
const db = require('../db');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(), // Relies on GOOGLE_APPLICATION_CREDENTIALS env var
    });
}

async function jwtAuth(req, res, next) {
    // ------------------- Demo Mode -------------------
    if (process.env.DEMO_MODE === 'true') {
        const demoUser = await db('users').first();
        req.user = { 
            sub: demoUser?.id || 'demo-admin-1', 
            email: demoUser?.email || 'demo@google.com',
            role: demoUser?.role || 'ADMIN',
            hotelId: demoUser?.hotel_id || null
        };
        return next();
    }

    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) return res.status(401).json({ message: 'Missing token' });

    const token = authHeader.split(' ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // Fetch or Create user record to get hotel_id
        let userRecord = await db('users').where({ id: decodedToken.uid }).first();
        
        if (!userRecord) {
            // Auto-provision user and assign to default hotel for hackathon simplicity
            const defaultHotel = await db('hotels').first();
            const [newUser] = await db('users').insert({
                id: decodedToken.uid,
                email: decodedToken.email,
                name: decodedToken.name || decodedToken.email.split('@')[0],
                role: 'CITIZEN',
                hotel_id: defaultHotel?.id
            }).returning('*');
            userRecord = newUser;
        }

        req.user = { 
            sub: userRecord.id, 
            email: userRecord.email,
            role: userRecord.role,
            hotelId: userRecord.hotel_id
        };
        
        next();
    } catch (error) {
        console.error('[Auth] Firebase token verification failed:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
}

module.exports = jwtAuth;

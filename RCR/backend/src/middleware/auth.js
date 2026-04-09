const admin = require('firebase-admin');
const db = require('../db');
const { NODE_ENV, DEMO_MODE, FIREBASE_PROJECT_ID } = require('../config/env');

// Initialize Firebase Admin
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            projectId: FIREBASE_PROJECT_ID,
            // credential: admin.credential.applicationDefault() // Use this if service account is available
        });
        console.log(`✅ [Firebase] Admin initialized for project: ${FIREBASE_PROJECT_ID}`);
    } catch (error) {
        console.error('🚨 [Firebase] Initialization failed:', error.message);
    }
}


/**
 * Firebase ID Token Authentication Middleware
 */
async function jwtAuth(req, res, next) {
    // ------------------- Demo Mode (Guard Protected) -------------------
    if (DEMO_MODE && NODE_ENV !== 'production') {
        const demoUser = await db('users').first();
        req.user = { 
            sub: demoUser?.id || 'demo-admin-1', 
            email: demoUser?.email || 'demo@rcr.com',
            role: demoUser?.role || 'ADMIN',
            hotelId: demoUser?.hotel_id || null
        };
        return next();
    }

    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            success: false, 
            error: 'Unauthorized', 
            message: 'Missing or malformed token' 
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        // PHASE 3: Firebase token verification
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // Fetch or Create user record in our local Postgres DB
        let userRecord = await db('users').where({ id: decodedToken.uid }).first();
        
        if (!userRecord) {
            const defaultHotel = await db('hotels').first();
            const [newUser] = await db('users').insert({
                id: decodedToken.uid,
                email: decodedToken.email,
                name: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
                role: 'CITIZEN',
                hotel_id: defaultHotel?.id
            }).returning('*');
            userRecord = newUser;
        }

        // Attach user context to request
        req.user = { 
            sub: userRecord.id, 
            email: userRecord.email,
            role: userRecord.role,
            hotelId: userRecord.hotel_id
        };
        
        next();
    } catch (error) {
        console.error('[Auth] Firebase token verification failed:', error.message);
        return res.status(401).json({ 
            success: false, 
            error: 'Unauthorized', 
            message: 'Invalid or expired token' 
        });
    }
}

module.exports = jwtAuth;

const { OAuth2Client } = require('google-auth-library');
const db = require('../db');
const { NODE_ENV, DEMO_MODE, GOOGLE_CLIENT_ID } = require('../config/env');

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * Google OAuth 2.0 ID Token Authentication Middleware
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
        // Verify Google ID Token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        
        // Fetch or Create user record in our local Postgres DB
        let userRecord = await db('users').where({ id: payload.sub }).first();
        
        if (!userRecord) {
            const defaultHotel = await db('hotels').first();
            const [newUser] = await db('users').insert({
                id: payload.sub,
                email: payload.email,
                name: payload.name || payload.email?.split('@')[0] || 'User',
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
        console.error('[Auth] Google token verification failed:', error.message);
        return res.status(401).json({ 
            success: false, 
            error: 'Unauthorized', 
            message: 'Invalid or expired token' 
        });
    }
}

module.exports = jwtAuth;

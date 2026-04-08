const request = require('supertest');

// 🚨 ARCHITECTURAL FIX: Mock DB and Queue BEFORE requiring app
// This prevents the application from attempting real connections during tests
jest.mock('../db', () => {
    const mockKnex = () => ({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockReturnThis(),
        raw: jest.fn().mockResolvedValue({ rows: [{ 1: 1 }] }),
        destroy: jest.fn().mockResolvedValue(true),
    });
    mockKnex.raw = jest.fn().mockResolvedValue({ rows: [{ 1: 1 }] });
    mockKnex.destroy = jest.fn().mockResolvedValue(true);
    return mockKnex;
});

jest.mock('../infrastructure/queue', () => ({
    incidentQueue: {
        add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
        on: jest.fn()
    },
    connection: {}
}));

jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => ({
        ping: jest.fn().mockResolvedValue('PONG'),
        on: jest.fn(),
        quit: jest.fn().mockResolvedValue(true),
        disconnect: jest.fn().mockResolvedValue(true),
    }));
});

const app = require('../app');

describe('Health Check', () => {
    it('should return 200 OK and bypass real infrastructure', async () => {
        const res = await request(app).get('/health');
        
        // The health route now returns 200 even if degraded in test mode,
        // or 200 if the mock above satisfies the SELECT 1 query.
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('status');
    });
});

const { z } = require('zod');

const incidentSchema = z.object({
    title: z.string().min(5).max(100),
    description: z.string().max(1000).optional(),
    severity: z.number().int().min(1).max(5),
    category: z.enum(['MEDICAL', 'FIRE', 'SECURITY', 'INFRASTRUCTURE']),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    floorLevel: z.number().int().default(1),
    roomNumber: z.string().min(1),
    wingId: z.string().min(1),
    mediaType: z.string().optional().nullable(),
    mediaBase64: z.string().optional().nullable(),
    mediaUrl: z.string().url().optional().nullable(),
    triageMethod: z.string().optional(),
});

// 🚨 NEW: Validator for Voice Triage
const voiceSchema = z.object({
    audioBase64: z.string().min(1),
    audioMimeType: z.string().optional(),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    floorLevel: z.number().int().optional(),
    roomNumber: z.string().optional(),
    wingId: z.string().optional(),
    hotelId: z.string().uuid().optional(),
});

// 🚨 NEW: Validator for Safety Pulse
const pulseSchema = z.object({
    status: z.enum(['SAFE', 'IN_DANGER', 'NEED_HELP', 'EVACUATING']),
});

// 🚨 NEW: Validator for Status Update
const statusUpdateSchema = z.object({
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED']),
});

// 🚨 NEW: Validator for Task Status Update
const taskStatusSchema = z.object({
    status: z.enum(['PENDING', 'DISPATCHED', 'ACKNOWLEDGED', 'SECURED', 'COMPLETED']),
    evidenceUrl: z.string().url().optional(),
});

module.exports = { 
    incidentSchema, 
    voiceSchema, 
    pulseSchema, 
    statusUpdateSchema,
    taskStatusSchema
};

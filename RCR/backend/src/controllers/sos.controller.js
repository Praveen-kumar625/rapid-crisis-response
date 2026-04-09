const IncidentService = require('../services/incident.service');
const GoogleCloudAI = require('../infrastructure/ai/googleCloud');
const AIService = require('../services/ai.service');
const catchAsync = require('../utils/catchAsync');

/**
 * Handle SOS voice reports from the frontend.
 * Workflow:
 * 1. Receive audio blob + metadata (location, hotelId).
 * 2. Transcribe using Google Cloud Speech-to-Text.
 * 3. Translate to English using Google Cloud Translation API.
 * 4. Pass translated text to Gemini for triage.
 * 5. Create incident and return response.
 */
exports.handleVoiceSOS = catchAsync(async (req, res) => {
    // PHASE 1: Fix Controller Crashes (Strict Guard Clauses)
    
    // 1. User Context Guard
    if (!req.user || !req.user.sub) {
        return res.status(401).json({ 
            success: false, 
            message: 'Unauthorized: Missing user context' 
        });
    }

    const { 
        audioBase64, 
        audioMimeType, 
        floorLevel, 
        roomNumber, 
        wingId, 
        lat, 
        lng, 
        hotelId: bodyHotelId 
    } = req.body;

    // 2. Request Body Guard
    if (!audioBase64 || !audioMimeType) {
        return res.status(400).json({
            success: false,
            message: "Bad Request: Missing audio data or audioMimeType"
        });
    }

    const reportedBy = req.user.sub;
    const hotelId = bodyHotelId || req.user.hotelId;

    console.log('[SOS Controller] Processing voice SOS...');

    try {
        // 1. Transcribe
        const audioBuffer = Buffer.from(audioBase64, 'base64');
        const transcriptionResult = await GoogleCloudAI.transcribeAudio(audioBuffer, audioMimeType);
        const transcription = transcriptionResult?.transcription || '';
        const detectedLanguage = transcriptionResult?.detectedLanguage || 'en-US';
        
        console.log(`[SOS Controller] Transcribed (${detectedLanguage}): ${transcription.substring(0, 50)}...`);

        // 2. Translate
        const translatedText = await GoogleCloudAI.translateToEnglish(transcription, detectedLanguage);
        
        console.log(`[SOS Controller] Translated: ${translatedText.substring(0, 50)}...`);

        // 3. Triage with Gemini
        const triageResults = await AIService.analyzeReportText({
            title: 'Multilingual SOS Voice Report',
            description: translatedText || 'Voice report received',
            category: 'UNKNOWN',
            userSeverity: 4, // Assume high for SOS
            floorLevel,
            roomNumber,
            wingId
        });

        // 4. Create Incident
        const incident = await IncidentService.create({
            title: `SOS: ${triageResults?.hospitalityCategory || 'EMERGENCY'}`,
            description: translatedText || 'Emergency voice audio received.',
            severity: triageResults?.autoSeverity || 4,
            category: triageResults?.hospitalityCategory || 'FIRE',
            lat: lat || 0,
            lng: lng || 0,
            floorLevel: floorLevel || 1,
            roomNumber: roomNumber || 'unknown',
            wingId: wingId || 'unknown',
            reportedBy,
            hotelId,
            mediaType: audioMimeType,
            mediaBase64: audioBase64,
            triageMethod: `Google Cloud + Gemini (${detectedLanguage})`
        });

        res.status(201).json({
            success: true,
            incident,
            transcription,
            translatedText,
            detectedLanguage
        });

    } catch (err) {
        console.error('[SOS Controller] Processing Error, triggering fallback:', err);
        
        // Graceful Degradation: Attempt to create incident even if AI processing fails
        const fallbackIncident = await IncidentService.create({
            title: 'SOS: Voice Report (Processing Failure)',
            description: 'A voice SOS was received but AI processing failed. Manual review required.',
            severity: 5,
            category: 'EMERGENCY',
            lat: lat || 0,
            lng: lng || 0,
            floorLevel: floorLevel || 1,
            roomNumber: roomNumber || 'unknown',
            wingId: wingId || 'unknown',
            reportedBy,
            hotelId,
            mediaType: audioMimeType,
            mediaBase64: audioBase64,
            triageMethod: 'Manual (Critical Failure)'
        });

        return res.status(201).json({
            success: false,
            error: 'Internal processing failure, incident logged for manual review.',
            incident: fallbackIncident
        });
    }
});

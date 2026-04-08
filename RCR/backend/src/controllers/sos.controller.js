const IncidentService = require('../services/incident.service');
const GoogleCloudAI = require('../infrastructure/ai/googleCloud');
const AIService = require('../services/ai.service');

/**
 * Handle SOS voice reports from the frontend.
 * Workflow:
 * 1. Receive audio blob + metadata (location, hotelId).
 * 2. Transcribe using Google Cloud Speech-to-Text.
 * 3. Translate to English using Google Cloud Translation API.
 * 4. Pass translated text to Gemini for triage.
 * 5. Create incident and return response.
 */
exports.handleVoiceSOS = async (req, res) => {
    const { 
        audioBase64, 
        mimeType, 
        floorLevel, 
        roomNumber, 
        wingId, 
        lat, 
        lng, 
        hotelId 
    } = req.body;

    const reportedBy = req.user.id;

    try {
        console.log('[SOS Controller] Processing voice SOS...');

        // 1. Transcribe
        const audioBuffer = Buffer.from(audioBase64, 'base64');
        const { transcription, detectedLanguage } = await GoogleCloudAI.transcribeAudio(audioBuffer, mimeType);
        
        console.log(`[SOS Controller] Transcribed (${detectedLanguage}): ${transcription.substring(0, 50)}...`);

        // 2. Translate
        const translatedText = await GoogleCloudAI.translateToEnglish(transcription, detectedLanguage);
        
        console.log(`[SOS Controller] Translated: ${translatedText.substring(0, 50)}...`);

        // 3. Triage with Gemini
        const triageResults = await AIService.analyzeReportText({
            title: 'Multilingual SOS Voice Report',
            description: translatedText,
            category: 'UNKNOWN',
            userSeverity: 4, // Assume high for SOS
            floorLevel,
            roomNumber,
            wingId
        });

        // 4. Create Incident
        const incident = await IncidentService.create({
            title: `SOS: ${triageResults.hospitalityCategory}`,
            description: translatedText,
            severity: triageResults.autoSeverity,
            category: triageResults.hospitalityCategory,
            lat,
            lng,
            floorLevel,
            roomNumber,
            wingId,
            reportedBy,
            hotelId,
            mediaType: mimeType,
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
        console.error('[SOS Controller] Error:', err);
        
        // Fallback: Create incident even if AI fails
        const fallbackIncident = await IncidentService.create({
            title: 'SOS: Voice Report (AI Failed)',
            description: 'A voice SOS was received but automated processing failed. Please listen to the recording immediately.',
            severity: 5,
            category: 'EMERGENCY',
            lat,
            lng,
            floorLevel,
            roomNumber,
            wingId,
            reportedBy,
            hotelId,
            mediaType: mimeType,
            mediaBase64: audioBase64,
            triageMethod: 'Manual (Processing Failure)'
        });

        res.status(201).json({
            success: false,
            error: 'AI processing failed, but incident was created for manual review.',
            incident: fallbackIncident
        });
    }
};

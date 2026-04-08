const speech = require('@google-cloud/speech');
const { TranslationServiceClient } = require('@google-cloud/translate');

// Google Cloud Speech-to-Text client
const speechClient = new speech.SpeechClient();

// Google Cloud Translation client
const translateClient = new TranslationServiceClient();

/**
 * Transcribe audio using Google Cloud Speech-to-Text.
 * Supports auto-detection of the spoken language.
 */
async function transcribeAudio(audioBuffer, mimeType) {
    const request = {
        audio: {
            content: audioBuffer.toString('base64'),
        },
        config: {
            encoding: 'WEBM_OPUS', // Default for many web-based recordings
            sampleRateHertz: 48000,
            languageCode: 'en-US',
            alternativeLanguageCodes: ['es-ES', 'fr-FR', 'de-DE', 'zh-CN', 'hi-IN'], // Multi-language support
            enableAutomaticPunctuation: true,
        },
    };

    // Note: In production, you might need to adjust encoding/sampleRate based on actual mimeType
    if (mimeType.includes('wav')) {
        request.config.encoding = 'LINEAR16';
        delete request.config.sampleRateHertz; // Let Google detect
    }

    try {
        const [response] = await speechClient.recognize(request);
        const transcription = response.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');
        
        const detectedLanguage = response.results[0]?.languageCode || 'unknown';
        
        return { transcription, detectedLanguage };
    } catch (err) {
        console.error('[Google STT] Transcription failed:', err.message);
        throw err;
    }
}

/**
 * Translate text to English using Google Cloud Translation API.
 */
async function translateToEnglish(text, sourceLanguageCode) {
    if (!text || sourceLanguageCode === 'en' || sourceLanguageCode?.startsWith('en-')) {
        return text;
    }

    const projectId = process.env.GOOGLE_PROJECT_ID || 'rapid-crisis-response';
    const location = 'global';

    const request = {
        parent: `projects/${projectId}/locations/${location}`,
        contents: [text],
        mimeType: 'text/plain',
        sourceLanguageCode: sourceLanguageCode,
        targetLanguageCode: 'en-US',
    };

    try {
        const [response] = await translateClient.translateText(request);
        return response.translations[0].translatedText;
    } catch (err) {
        console.error('[Google Translate] Translation failed:', err.message);
        return text; // Fallback to original text
    }
}

module.exports = {
    transcribeAudio,
    translateToEnglish,
};

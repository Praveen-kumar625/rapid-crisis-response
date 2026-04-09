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
    // Input validation
    if (!audioBuffer || audioBuffer.length === 0) {
        console.warn('[Google STT] Empty audio buffer received');
        return { transcription: 'Transcription unavailable: No audio data', detectedLanguage: 'unknown' };
    }

    const request = {
        audio: {
            content: audioBuffer.toString('base64'),
        },
        config: {
            encoding: 'WEBM_OPUS',
            sampleRateHertz: 48000,
            languageCode: 'en-US',
            alternativeLanguageCodes: ['es-ES', 'fr-FR', 'de-DE', 'zh-CN', 'hi-IN'],
            enableAutomaticPunctuation: true,
        },
    };

    if (mimeType && mimeType.includes('wav')) {
        request.config.encoding = 'LINEAR16';
        delete request.config.sampleRateHertz;
    }

    try {
        const [response] = await speechClient.recognize(request);
        
        // PHASE 1: External API Fallbacks (Strict Defensive Checks)
        if (!response?.results || !Array.isArray(response.results) || response.results.length === 0) {
            return { 
                transcription: "Transcription unavailable", 
                detectedLanguage: "unknown" 
            };
        }

        const transcription = response.results
            .map(result => result?.alternatives?.[0]?.transcript || '')
            .filter(text => text !== '')
            .join('\n');
        
        const detectedLanguage = response.results[0]?.languageCode || 'unknown';
        
        return { 
            transcription: transcription || 'Transcription unavailable: Speech not understood', 
            detectedLanguage 
        };
    } catch (err) {
        console.error('[Google STT] Critical Service Error:', err.message);
        return { 
            transcription: 'Transcription unavailable: Service error', 
            detectedLanguage: 'unknown'
        };
    }
}

/**
 * Translate text to English using Google Cloud Translation API.
 */
async function translateToEnglish(text, sourceLanguageCode) {
    if (!text || sourceLanguageCode === 'en' || sourceLanguageCode?.startsWith('en-')) {
        return text || '';
    }

    const projectId = process.env.GOOGLE_PROJECT_ID || 'rapid-crisis-response';
    const location = 'global';

    const request = {
        parent: `projects/${projectId}/locations/${location}`,
        contents: [text],
        mimeType: 'text/plain',
        sourceLanguageCode: sourceLanguageCode === 'unknown' ? undefined : sourceLanguageCode,
        targetLanguageCode: 'en-US',
    };

    try {
        const [response] = await translateClient.translateText(request);
        
        // Defensive Programming: Safely access translation results
        const translations = response?.translations || [];
        const translatedText = translations[0]?.translatedText;

        if (!translatedText) {
            console.warn('[Google Translate] No translation returned from API');
            return text;
        }

        return translatedText;
    } catch (err) {
        console.error('[Google Translate] Critical Service Error:', err.message);
        return text; // Fallback to original text
    }
}

module.exports = {
    transcribeAudio,
    translateToEnglish,
};

// backend/src/services/ai.service.js
/**
 * AI verification service – uses Google Gemini (gemini‑1.5‑flash).
 * Enhanced for production-grade reliability with retries, robust parsing, and consistent fallbacks.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GEMINI_API_KEY } = require('../config/env');

// -----------------------------------------------------------------
// 1️⃣  Initialise the Gemini client
// -----------------------------------------------------------------
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const MODEL_NAME = 'gemini-1.5-flash';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper to get the model with standard JSON configuration
 */
function getModel() {
    if (!genAI) return null;
    return genAI.getGenerativeModel({
        model: MODEL_NAME,
        generationConfig: { responseMimeType: 'application/json' }
    });
}

/**
 * Robust JSON parser that handles markdown blocks and unexpected text
 */
function parseJsonSafely(raw) {
    if (!raw || typeof raw !== 'string') return null;

    let text = raw.trim();
    // Remove markdown code block wrappers if present (```json ... ```)
    if (text.startsWith('```')) {
        text = text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    // Extract the first JSON object found in the text
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        return null;
    }

    const cleanJson = text.slice(firstBrace, lastBrace + 1);

    try {
        return JSON.parse(cleanJson);
    } catch (err) {
        console.error('[AI Service] JSON Parse Error:', err.message, '| Raw:', text.substring(0, 100));
        return null;
    }
}

/**
 * Calls Gemini with exponential backoff retry logic
 */
async function generateContentWithRetry(prompt, maxRetries = 3) {
    const model = getModel();
    if (!model) throw new Error('Gemini API client not initialized');

    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            const data = parseJsonSafely(text);
            if (data) return data;
            
            throw new Error('Invalid JSON response from AI');
        } catch (err) {
            lastError = err;
            const isTransient = err.message.includes('503') || err.message.includes('429') || err.message.includes('quota');
            
            if (isTransient && i < maxRetries - 1) {
                const delay = Math.pow(2, i) * 1000;
                console.warn(`[AI Service] Transient error (attempt ${i + 1}/${maxRetries}), retrying in ${delay}ms...`);
                await sleep(delay);
                continue;
            }
            break;
        }
    }
    throw lastError;
}

// -----------------------------------------------------------------
// 2️⃣  Core Service Functions
// -----------------------------------------------------------------

/**
 * Comprehensive triage for hospitality incidents
 */
async function analyzeReport({
    title,
    description,
    category,
    userSeverity,
    mediaType,
    mediaBase64,
    floorLevel,
    roomNumber,
    wingId,
}) {
    const normalizedCategory = (category || '').toUpperCase();
    
    // Default fallback object (🚨 STANDARDIZED FIELD NAMES)
    const fallback = {
        spam_score: 0.0,
        auto_severity: Math.max(userSeverity, 4),
        predictedCategory: 'UNVERIFIED',
        hospitality_category: 'INFRASTRUCTURE',
        translated_english_text: description || title || '',
        detected_language: 'en',
        panic_level: 'High',
        actionPlan: ['Manual emergency verification required immediately.'],
        requiredResources: ['Security Team', 'Management'],
    };

    if (!genAI) return fallback;

    const mediaContext = mediaType ? `A ${mediaType} file was attached.` : 'No media provided.';
    const textPrompt = `You are a hospitality crisis triage AI. Respond in strict JSON only.
Input: Title: "${title}", Desc: "${description}", Cat: "${normalizedCategory}", Floor: ${floorLevel}, Room: "${roomNumber}", Wing: "${wingId}", UserSev: ${userSeverity}. ${mediaContext}

Required Output Fields:
- translated_english_text: string
- detected_language: string
- panic_level: "High" | "Medium" | "Low"
- hospitality_category: "MEDICAL" | "FIRE" | "SECURITY" | "INFRASTRUCTURE"
- action_plan: string[]
- spam_score: number (0.0-1.0)
- auto_severity: number (1-5)
- predicted_category: string
- required_resources: string[]`;

    const prompt = (mediaType && mediaBase64) ? {
        contents: [{
            parts: [
                { text: textPrompt },
                { inlineData: { mimeType: mediaType, data: mediaBase64 } }
            ]
        }]
    } : textPrompt;

    try {
        const data = await generateContentWithRetry(prompt);
        
        // Sanitize and validate output
        return {
            spam_score: (typeof data.spam_score === 'number') ? data.spam_score : 0.0,
            auto_severity: (typeof data.auto_severity === 'number') ? Math.min(5, Math.max(1, Math.round(data.auto_severity))) : userSeverity,
            predictedCategory: String(data.predicted_category || data.hospitality_category || normalizedCategory).toUpperCase(),
            hospitality_category: ['MEDICAL', 'FIRE', 'SECURITY', 'INFRASTRUCTURE'].includes(String(data.hospitality_category).toUpperCase()) ? data.hospitality_category.toUpperCase() : fallback.hospitality_category,
            translated_english_text: String(data.translated_english_text || description || title || ''),
            detected_language: String(data.detected_language || 'en'),
            panic_level: ['High', 'Medium', 'Low'].includes(data.panic_level) ? data.panic_level : fallback.panic_level,
            actionPlan: Array.isArray(data.action_plan) ? data.action_plan : (Array.isArray(data.actionPlan) ? data.actionPlan : fallback.actionPlan),
            requiredResources: Array.isArray(data.required_resources) ? data.required_resources : (Array.isArray(data.requiredResources) ? data.requiredResources : fallback.requiredResources),
        };
    } catch (err) {
        console.error('[AI Service] analyzeReport failed:', err.message);
        return fallback;
    }
}

/**
 * Transcribe and triage voice reports
 */
async function analyzeVoice({ audioBase64, audioMimeType, floorLevel, roomNumber, wingId, lat, lng }) {
    const fallbackText = 'Voice report received but AI transcription failed.';
    const fallback = {
        translated_english_text: fallbackText,
        detected_language: 'en',
        panic_level: 'High',
        hospitality_category: 'INFRASTRUCTURE',
        actionPlan: ['Manual verification required'],
        spam_score: 0.0,
        auto_severity: 3,
        predictedCategory: 'INFRASTRUCTURE',
        requiredResources: ['Security Team'],
    };

    if (!genAI) return fallback;

    const actualMimeType = audioMimeType || 'audio/webm';

    const prompt = {
        contents: [{
            parts: [
                { text: `Transcribe this SOS emergency audio and provide triage in JSON. Location: Floor ${floorLevel}, Room ${roomNumber}, Wing ${wingId} (Lat/Lng: ${lat},${lng}). Output: translated_english_text, detected_language, panic_level, hospitality_category (MEDICAL/FIRE/SECURITY/INFRASTRUCTURE), actionPlan (string[]), spam_score, auto_severity, predicted_category, requiredResources.` },
                { inlineData: { mimeType: actualMimeType, data: audioBase64 } }
            ]
        }]
    };

    try {
        const data = await generateContentWithRetry(prompt);
        return {
            translated_english_text: data.translated_english_text || fallbackText,
            detected_language: data.detected_language || 'en',
            panic_level: data.panic_level || 'High',
            hospitality_category: data.hospitality_category || 'INFRASTRUCTURE',
            actionPlan: Array.isArray(data.actionPlan) ? data.actionPlan : (Array.isArray(data.action_plan) ? data.action_plan : fallback.actionPlan),
            spam_score: typeof data.spam_score === 'number' ? data.spam_score : 0.0,
            auto_severity: typeof data.auto_severity === 'number' ? Math.round(data.auto_severity) : 5,
            predictedCategory: String(data.predicted_category || data.hospitality_category || 'INFRASTRUCTURE').toUpperCase(),
            requiredResources: Array.isArray(data.requiredResources) ? data.requiredResources : (Array.isArray(data.required_resources) ? data.required_resources : fallback.requiredResources),
        };
    } catch (err) {
        console.error('[AI Service] analyzeVoice failed:', err.message);
        return fallback;
    }
}

module.exports = { analyzeReport, analyzeVoice };
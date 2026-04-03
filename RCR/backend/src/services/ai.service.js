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
 * Simple verification for spam and severity
 */
async function verify({ title, description, userSeverity }) {
    if (!genAI) return { spam_score: 0.0, auto_severity: userSeverity };

    const prompt = `You are an incident-verification assistant. Analyze the following and respond in JSON.
Title: "${title}"
Description: "${description}"
User Severity: ${userSeverity}

Output Format: { "spam_score": float(0-1), "auto_severity": int(1-5) }`;

    try {
        const data = await generateContentWithRetry(prompt);
        return {
            spam_score: typeof data.spam_score === 'number' ? data.spam_score : 0.0,
            auto_severity: typeof data.auto_severity === 'number' ? Math.round(data.auto_severity) : userSeverity
        };
    } catch (err) {
        console.error('[AI Service] verify failed:', err.message);
        return { spam_score: 0.0, auto_severity: userSeverity };
    }
}

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
    
    // Default fallback object
    const fallback = {
        spam_score: 0.0,
        auto_severity: userSeverity,
        predictedCategory: normalizedCategory || 'INFRASTRUCTURE',
        hospitality_category: ['MEDICAL', 'FIRE', 'SECURITY', 'INFRASTRUCTURE'].includes(normalizedCategory) ? normalizedCategory : 'INFRASTRUCTURE',
        translated_english_text: description || title || '',
        detected_language: 'en',
        panic_level: /panic|help|emergency|urgent/i.test(`${title} ${description}`) ? 'High' : 'Low',
        action_plan: [inferActionByCategory(normalizedCategory)],
        requiredResources: inferResourcesByCategory(normalizedCategory),
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
            actionPlan: Array.isArray(data.action_plan) && data.action_plan.length ? data.action_plan : fallback.action_plan,
            requiredResources: Array.isArray(data.required_resources) ? data.required_resources : fallback.requiredResources,
        };
    } catch (err) {
        console.error('[AI Service] analyzeReport failed:', err.message);
        return fallback;
    }
}

/**
 * Transcribe and triage voice reports
 */
async function analyzeVoice({ audioBase64, floorLevel, roomNumber, wingId, lat, lng }) {
    const fallbackText = 'Voice report received but AI transcription failed.';
    const fallback = {
        translated_english_text: fallbackText,
        detected_language: 'en',
        panic_level: 'High',
        hospitality_category: 'INFRASTRUCTURE',
        actionPlan: ['Manual verification required'],
        spam_score: 0.0,
        auto_severity: 3,
        predicted_category: 'INFRASTRUCTURE',
        requiredResources: ['Security Team'],
    };

    if (!genAI) return fallback;

    // Note: For actual audio processing, Gemini 1.5 requires specific data parts.
    // Assuming the user is passing base64 that we can send as an inlineData part.
    const prompt = {
        contents: [{
            parts: [
                { text: `Transcribe this SOS emergency audio and provide triage in JSON. Location: Floor ${floorLevel}, Room ${roomNumber}, Wing ${wingId} (Lat/Lng: ${lat},${lng}). Output: translated_english_text, detected_language, panic_level, hospitality_category (MEDICAL/FIRE/SECURITY/INFRASTRUCTURE), actionPlan (string[]), spam_score, auto_severity, predicted_category, requiredResources.` },
                { inlineData: { mimeType: "audio/webm", data: audioBase64 } }
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
            auto_severity: typeof data.auto_severity === 'number' ? data.auto_severity : 5,
            predicted_category: data.predicted_category || data.hospitality_category || 'INFRASTRUCTURE',
            requiredResources: Array.isArray(data.requiredResources) ? data.requiredResources : (Array.isArray(data.required_resources) ? data.required_resources : fallback.requiredResources),
        };
    } catch (err) {
        console.error('[AI Service] analyzeVoice failed:', err.message);
        return fallback;
    }
}

// -----------------------------------------------------------------
// 3️⃣  Heuristic Fallbacks
// -----------------------------------------------------------------

function inferActionByCategory(category) {
    const c = (category || '').toUpperCase();
    switch (c) {
        case 'FIRE': return 'Initiate immediate evacuation, activate fire suppression systems, and notify fire department.';
        case 'MEDICAL': return 'Dispatch medical response team with AED and first aid kit immediately.';
        case 'SECURITY': return 'Deploy security personnel to secure the area and investigate threat.';
        default: return 'Assess situation, notify relevant department, and maintain guest safety.';
    }
}

function inferResourcesByCategory(category) {
    const c = (category || '').toUpperCase();
    switch (c) {
        case 'FIRE': return ['Fire Response Team', 'Evacuation Marshals'];
        case 'MEDICAL': return ['Paramedics', 'First Aid Response'];
        case 'SECURITY': return ['Security Officers', 'Management'];
        default: return ['Maintenance Team', 'Guest Services'];
    }
}

module.exports = { verify, analyzeReport, analyzeVoice };
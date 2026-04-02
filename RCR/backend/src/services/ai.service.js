// backend/src/services/ai.service.js
/**
 * AI verification service – uses Google Gemini (gemini‑1.5‑flash).
 * Returns a strict JSON:
 *   {
 *     spam_score: number (0.0 – 1.0),
 *     auto_severity: number (1 – 5)
 *   }
 *
 * If the Gemini API call fails (network, quota, parsing, etc.) the function
 * falls back to safe defaults: spam_score = 0.0 and auto_severity = userSeverity.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GEMINI_API_KEY } = require('../config/env');

// -----------------------------------------------------------------
// 1️⃣  Initialise the Gemini client (once)
// -----------------------------------------------------------------
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const MODEL_NAME = 'gemini-1.5-flash';

// -----------------------------------------------------------------
// 2️⃣  Build a concise system prompt that forces Gemini to return ONLY JSON
// -----------------------------------------------------------------
function buildPrompt({ title, description, userSeverity }) {
    return `
You are an incident‑verification assistant.

Given an incident **title** and **description**, you must output a **single JSON object** (no extra text) with these fields:

{
  "spam_score": <float between 0.0 (not spam) and 1.0 (definitely spam)>,
  "auto_severity": <integer between 1 and 5>
}

- spam_score should be high if the content looks like spam, test data, advertisement, or nonsense.
- auto_severity should reflect how critical the incident sounds; if you are unsure, return the original userSeverity.

**Title:** """${title}"""
**Description:** """${description}"""
**User‑provided severity:** ${userSeverity}
`.trim();
}

function parseJsonSafely(raw) {
    if (!raw || typeof raw !== 'string') return {};

    // Remove markdown code block wrappers if present (```json ... ```)
    let text = raw.trim();
    if (text.startsWith('```json')) {
        text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (text.startsWith('```')) {
        text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Extract JSON object from text if needed
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    const toParse = first >= 0 && last > first ? text.slice(first, last + 1) : text;

    try {
        const parsed = JSON.parse(toParse);
        console.log('[AI Service] parseJsonSafely SUCCESS: parsed JSON object');
        return parsed;
    } catch (err) {
        console.error('[AI Service] parseJsonSafely FATAL:', err.message, 'Raw substring:', text.substring(0, 200));
        return {};
    }
}

// -----------------------------------------------------------------
// 3️⃣  Public verify() function
// -----------------------------------------------------------------
async function verify({ title, description, userSeverity }) {
    // -----------------------------------------------------------------
    //   Fast‑path – no API key → return defaults immediately
    // -----------------------------------------------------------------
    if (!genAI) {
        return {
            spam_score: 0.0,
            auto_severity: userSeverity,
        };
    }

    try {
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            // 🚨 BUG FIX 1.2: Enforce strict JSON mode to prevent markdown wrapping
            generationConfig: { responseMimeType: 'application/json' }
        });
        const prompt = buildPrompt({ title, description, userSeverity });
        const result = await model.generateContent({
            prompt,
            responseConfig: {
                responseMimeType: 'application/json',
                responseSchema: {
                    jsonSchema: {
                        type: 'object',
                        properties: {
                            spam_score: { type: 'number', minimum: 0, maximum: 1 },
                            auto_severity: { type: 'integer', minimum: 1, maximum: 5 },
                        },
                        required: ['spam_score', 'auto_severity'],
                    },
                },
            },
            temperature: 0.0,
            maxOutputTokens: 120,
        });

        const text = await result.response.text();
        const data = parseJsonSafely(text);

        // -----------------------------------------------------------------
        //   Validate / sanitize the returned values
        // -----------------------------------------------------------------
        const spam_score =
            typeof data.spam_score === 'number' && data.spam_score >= 0 && data.spam_score <= 1 ?
            data.spam_score :
            0.0;

        const auto_severity =
            typeof data.auto_severity === 'number' &&
            data.auto_severity >= 1 &&
            data.auto_severity <= 5 ?
            Math.round(data.auto_severity) :
            userSeverity;

        return { spam_score, auto_severity };
    } catch (err) {
        console.error('[AI Service] Verification failed – falling back to defaults:', err);
        // -----------------------------------------------------------------
        //   Fallback defaults
        // -----------------------------------------------------------------
        return {
            spam_score: 0.0,
            auto_severity: userSeverity,
        };
    }
}

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

    // Fast-path no key / dev mode
    if (!genAI) {
        const defaultResources = inferResourcesByCategory(normalizedCategory);
        const defaultAction = inferActionByCategory(normalizedCategory);
        const hospitalityCategory = ['MEDICAL', 'FIRE', 'SECURITY', 'INFRASTRUCTURE'].includes(normalizedCategory) ?
            normalizedCategory :
            'INFRASTRUCTURE';

        return {
            spam_score: 0.0,
            auto_severity: userSeverity,
            predictedCategory: normalizedCategory || 'INFRASTRUCTURE',
            hospitality_category: hospitalityCategory,
            translated_english_text: description || title || '',
            detected_language: 'en',
            panic_level: /panic|help|emergency|urgent/i.test(`${title} ${description}`) ? 'High' : 'Low',
            action_plan: [defaultAction],
            requiredResources: defaultResources,
        };
    }

    const details = mediaType ? `Media type: ${mediaType}. Media data: <base64 string>` : 'No media provided.';
    const prompt = `You are a hospitality crisis triage assistant for a high-end hotel. Respond in strict JSON only with no extra text.\n` +
        `Input fields: title, description, category, floorLevel, roomNumber, wingId, userSeverity, additionalContext.\n` +
        `Output fields must be exactly:\n` +
        `translated_english_text, detected_language, panic_level (High/Medium/Low), hospitality_category (MEDICAL|FIRE|SECURITY|INFRASTRUCTURE), action_plan (array of strings), spam_score (0.0-1.0), auto_severity (1-5), predicted_category, required_resources (array of strings).\n` +
        `Do not include any other keys.\n\n` +
        `title: "${title}"\n` +
        `description: "${description}"\n` +
        `category: "${normalizedCategory}"\n` +
        `floorLevel: ${floorLevel || 1}\n` +
        `roomNumber: "${roomNumber || ''}"\n` +
        `wingId: "${wingId || ''}"\n` +
        `userSeverity: ${userSeverity}\n` +
        `${details}`;

    try {
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            // 🚨 BUG FIX 1.2: Enforce strict JSON mode to prevent markdown wrapping
            generationConfig: { responseMimeType: 'application/json' }
        });
        const result = await model.generateContent({
            prompt,
            responseConfig: {
                responseMimeType: 'application/json',
                responseSchema: {
                    jsonSchema: {
                        type: 'object',
                        properties: {
                            translated_english_text: { type: 'string' },
                            detected_language: { type: 'string' },
                            panic_level: { type: 'string', enum: ['High', 'Medium', 'Low'] },
                            hospitality_category: { type: 'string', enum: ['MEDICAL', 'FIRE', 'SECURITY', 'INFRASTRUCTURE'] },
                            action_plan: { type: 'array', items: { type: 'string' } },
                            spam_score: { type: 'number', minimum: 0, maximum: 1 },
                            auto_severity: { type: 'integer', minimum: 1, maximum: 5 },
                            predicted_category: { type: 'string' },
                            required_resources: { type: 'array', items: { type: 'string' } },
                        },
                        required: ['translated_english_text', 'detected_language', 'panic_level', 'hospitality_category', 'action_plan', 'spam_score', 'auto_severity', 'predicted_category', 'required_resources'],
                    },
                },
            },
            temperature: 0.0,
            maxOutputTokens: 384,
        });

        const responseText = await result.response.text();
        const data = parseJsonSafely(responseText);

        const spam_score = (typeof data.spam_score === 'number' && data.spam_score >= 0 && data.spam_score <= 1) ? data.spam_score : 0.0;
        const auto_severity = (typeof data.auto_severity === 'number' && data.auto_severity >= 1 && data.auto_severity <= 5) ? Math.round(data.auto_severity) : userSeverity;
        const predictedCategory = typeof data.predicted_category === 'string' && data.predicted_category ? data.predicted_category.toUpperCase() : normalizedCategory || 'INFRASTRUCTURE';
        const hospitality_category = typeof data.hospitality_category === 'string' && data.hospitality_category ? data.hospitality_category.toUpperCase() : 'INFRASTRUCTURE';
        const actionPlan = Array.isArray(data.action_plan) && data.action_plan.length ? data.action_plan : [inferActionByCategory(normalizedCategory)];
        const requiredResources = Array.isArray(data.required_resources) ? data.required_resources : inferResourcesByCategory(normalizedCategory);

        return {
            spam_score,
            auto_severity,
            predictedCategory,
            hospitality_category,
            translated_english_text: String(data.translated_english_text || description || title || ''),
            detected_language: String(data.detected_language || 'unknown'),
            panic_level: String(data.panic_level || 'Low'),
            action_plan: actionPlan,
            requiredResources,
        };
    } catch (err) {
        console.error('[AI Service] analyzeReport failed; falling back:', err);

        const hospitalityCategory = ['MEDICAL', 'FIRE', 'SECURITY', 'INFRASTRUCTURE'].includes(normalizedCategory) ?
            normalizedCategory :
            'INFRASTRUCTURE';

        return {
            spam_score: 0.0,
            auto_severity: userSeverity,
            predictedCategory: normalizedCategory || 'INFRASTRUCTURE',
            hospitality_category: hospitalityCategory,
            translated_english_text: description || title || '',
            detected_language: 'en',
            panic_level: /panic|help|emergency|urgent/i.test(`${title} ${description}`) ? 'High' : 'Low',
            action_plan: [inferActionByCategory(normalizedCategory)],
            requiredResources: inferResourcesByCategory(normalizedCategory),
        };
    }
}

async function analyzeVoice({ audioBase64, floorLevel, roomNumber, wingId, lat, lng }) {
    const sampleText = 'Guest says: "There is a fire in room 304, please send help immediately."';

    if (!genAI) {
        return {
            translated_english_text: sampleText,
            detected_language: 'en',
            panic_level: 'High',
            hospitality_category: 'FIRE',
            action_plan: ['Dispatch AED', 'Lock down Wing B', 'Evacuate Floor'],
            spam_score: 0.0,
            auto_severity: 5,
            predicted_category: 'FIRE',
            required_resources: ['Firefighters', 'Medical Team', 'Security'],
        };
    }

    try {
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            // 🚨 BUG FIX 1.2: Enforce strict JSON mode to prevent markdown wrapping
            generationConfig: { responseMimeType: 'application/json' }
        });
        const prompt = `You are a hotel crisis AI that transcribes guest speech and outputs strict JSON.\n` +
            `Audio payload (base64) needs transcription plus triage. Output keys: translated_english_text, detected_language, panic_level, hospitality_category, action_plan, spam_score, auto_severity, predicted_category, required_resources. No extra.`;

        const result = await model.generateContent({
            prompt,
            responseConfig: {
                responseMimeType: 'application/json',
                responseSchema: {
                    jsonSchema: {
                        type: 'object',
                        properties: {
                            translated_english_text: { type: 'string' },
                            detected_language: { type: 'string' },
                            panic_level: { type: 'string', enum: ['High', 'Medium', 'Low'] },
                            hospitality_category: { type: 'string', enum: ['MEDICAL', 'FIRE', 'SECURITY', 'INFRASTRUCTURE'] },
                            action_plan: { type: 'array', items: { type: 'string' } },
                            spam_score: { type: 'number', minimum: 0, maximum: 1 },
                            auto_severity: { type: 'integer', minimum: 1, maximum: 5 },
                            predicted_category: { type: 'string' },
                            required_resources: { type: 'array', items: { type: 'string' } },
                        },
                        required: ['translated_english_text', 'detected_language', 'panic_level', 'hospitality_category', 'action_plan', 'spam_score', 'auto_severity', 'predicted_category', 'required_resources'],
                    },
                },
            },
            temperature: 0.0,
            maxOutputTokens: 384,
        });

        const responseText = await result.response.text();
        const data = parseJsonSafely(responseText);

        return {
            translated_english_text: data.translated_english_text || sampleText,
            detected_language: data.detected_language || 'en',
            panic_level: data.panic_level || 'High',
            hospitality_category: data.hospitality_category || 'FIRE',
            action_plan: Array.isArray(data.action_plan) ? data.action_plan : ['Dispatch AED', 'Lock down Wing B'],
            spam_score: typeof data.spam_score === 'number' ? data.spam_score : 0.0,
            auto_severity: typeof data.auto_severity === 'number' ? data.auto_severity : 5,
            predicted_category: data.predicted_category || 'FIRE',
            required_resources: Array.isArray(data.required_resources) ? data.required_resources : ['Firefighters', 'Medical Team', 'Security'],
        };
    } catch (err) {
        console.error('[AI Service] analyzeVoice failed; fallback', err);
        return {
            translated_english_text: sampleText,
            detected_language: 'en',
            panic_level: 'High',
            hospitality_category: 'FIRE',
            action_plan: ['Dispatch AED', 'Lock down Wing B', 'Evacuate Floor'],
            spam_score: 0.0,
            auto_severity: 5,
            predicted_category: 'FIRE',
            required_resources: ['Firefighters', 'Medical Team', 'Security'],
        };
    }
}

function inferActionByCategory(category) {
    const c = (category || '').toUpperCase();
    switch (c) {
        case 'FIRE':
            return 'Dispatch fire engine, establish perimeter, and evacuate nearby structures.';
        case 'FLOOD':
            return 'Deploy water rescue teams and protect critical infrastructure. Evacuate low-lying areas.';
        case 'EARTHQUAKE':
            return 'Check for structural damage, deploy search-and-rescue teams, and triage affected zones.';
        case 'PANDEMIC':
            return 'Isolate affected area, set up medical triage, and distribute PPE.';
        default:
            return 'Assess situation, notify nearest responder units, and secure perimeter.';
    }
}

function inferResourcesByCategory(category) {
    const c = (category || '').toUpperCase();
    switch (c) {
        case 'FIRE':
            return ['Firetruck', 'Firefighters', 'Paramedics'];
        case 'FLOOD':
            return ['Boat', 'Water Rescue Team', 'Paramedics'];
        case 'EARTHQUAKE':
            return ['Search-and-Rescue', 'Heavy Equipment', 'Medical Team'];
        case 'PANDEMIC':
            return ['Medical Staff', 'Quarantine Kits', 'Testing Team'];
        default:
            return ['First Aid Kit', 'Responder Team'];
    }
}

module.exports = { verify, analyzeReport, analyzeVoice };
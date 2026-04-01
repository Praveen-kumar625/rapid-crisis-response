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
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        const prompt = buildPrompt({ title, description, userSeverity });
        const result = await model.generateContent(prompt);
        const text = await result.response.text();

        // Gemini is instructed to emit only JSON, so we can safely parse.
        const data = JSON.parse(text);

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
}) {
    // Fast-path no key / dev mode
    if (!genAI) {
        const defaultResources = inferResourcesByCategory(category);
        const defaultAction = inferActionByCategory(category);

        return {
            spam_score: 0.0,
            auto_severity: userSeverity,
            predictedCategory: category,
            actionPlan: defaultAction,
            requiredResources: defaultResources,
        };
    }

    const details = mediaType ? `Media type: ${mediaType}. Media data: <base64 string>` : 'No media provided.';
    const prompt = `You are an incident assessment agent using unimodal and multimodal signals.\n\n` +
        `Given the input values, respond with a single JSON object only, no explanation.  ` +
        `Fields: spam_score (0.0-1.0), auto_severity (1-5), predicted_category, action_plan (short), recommended_resources (array of strings).\n\n` +
        `Title: "${title}"\n` +
        `Description: "${description}"\n` +
        `Category: "${category}"\n` +
        `UserSeverity: ${userSeverity}\n` +
        `${details}`;

    try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        const result = await model.generateContent(prompt);
        const text = await result.response.text();
        const data = JSON.parse(text);

        const spam_score = (typeof data.spam_score === 'number' && data.spam_score >= 0 && data.spam_score <= 1) ? data.spam_score : 0.0;
        const auto_severity = (typeof data.auto_severity === 'number' && data.auto_severity >= 1 && data.auto_severity <= 5) ? Math.round(data.auto_severity) : userSeverity;
        const predictedCategory = typeof data.predicted_category === 'string' && data.predicted_category ? data.predicted_category.toUpperCase() : category;
        const actionPlan = typeof data.action_plan === 'string' && data.action_plan ? data.action_plan : inferActionByCategory(category);
        const requiredResources = Array.isArray(data.recommended_resources) ? data.recommended_resources : inferResourcesByCategory(category);

        return { spam_score, auto_severity, predictedCategory, actionPlan, requiredResources };
    } catch (err) {
        console.error('[AI Service] analyzeReport failed; falling back:', err);
        return {
            spam_score: 0.0,
            auto_severity: userSeverity,
            predictedCategory: category,
            actionPlan: inferActionByCategory(category),
            requiredResources: inferResourcesByCategory(category),
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

module.exports = { verify, analyzeReport };
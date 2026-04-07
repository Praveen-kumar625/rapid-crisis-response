import { pipeline, env } from '@huggingface/transformers';

// Configure environment for browser
env.allowLocalModels = false;
env.useBrowserCache = true;
// 🚨 FIX: Suppress 'import.meta' warnings in Webpack 5 / react-scripts
if (typeof env.backends !== 'undefined' && env.backends.onnx) {
    env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers/dist/';
}

/**
 * Singleton pattern to load and cache the model in the browser.
 * This prevents re-downloading/re-initializing the model on every inference.
 */
class EdgeAIEngine {
    static instance = null;

    static async getInstance(progressCallback) {
        if (this.instance === null) {
            // Using a very small, fast distilled model for edge classification
            this.instance = pipeline('zero-shot-classification', 'Xenova/mobilebert-uncased-mnli', {
                dtype: 'q4', // 4-bit quantization for extremely fast loading & low memory footprint
                progress_callback: progressCallback
            });
        }
        return this.instance;
    }
}

const LABELS = {
    'Fire Incident': 'FIRE',
    'Medical Emergency': 'MEDICAL',
    'Security Threat': 'SECURITY',
    'Infrastructure Issue': 'INFRASTRUCTURE'
};

const SEVERITY_LABELS = {
    'Critical life-threatening danger': 5,
    'Major urgent problem': 4,
    'Moderate issue': 3,
    'Minor routine check': 2,
    'False alarm or test': 1
};

export async function localAnalyze(title, description, progressCallback) {
    const text = `${title}. ${description}`;
    let category = 'INFRASTRUCTURE';
    let severity = 3;

    try {
        const classifier = await EdgeAIEngine.getInstance(progressCallback);

        // 1. Classify Category
        const catResult = await classifier(text, Object.keys(LABELS));
        if (catResult && catResult.labels && catResult.labels.length > 0) {
            const topLabel = catResult.labels[0];
            // Only assign if confidence is reasonably high, else fallback to Infrastructure
            if (catResult.scores[0] > 0.3) {
                category = LABELS[topLabel];
            }
        }

        // 2. Classify Severity
        const sevResult = await classifier(text, Object.keys(SEVERITY_LABELS));
        if (sevResult && sevResult.labels && sevResult.labels.length > 0) {
            const topSevLabel = sevResult.labels[0];
            if (sevResult.scores[0] > 0.3) {
                severity = SEVERITY_LABELS[topSevLabel];
            }
        }

        // Emergency heuristic override (always enforce safe floors)
        const textLower = text.toLowerCase();
        const emergencyMarkers = ['help', 'sos', 'emergency', 'now', 'quick', 'fast', 'blood', 'gun', 'fire'];
        if (emergencyMarkers.some(m => textLower.includes(m))) {
            severity = Math.max(4, severity); // Push up to at least 4
        }
        if ((category === 'FIRE' || category === 'MEDICAL') && severity < 4) {
            severity = 4; // Floor for critical categories
        }

        return {
            category,
            severity,
            isLocal: true,
            triageMethod: 'Edge AI (WASM NLP)'
        };

    } catch (err) {
        console.error('[Edge AI] Inference failed. Falling back to Basic Heuristics.', err);
        // Extremely basic fallback if WebGL/WASM fails entirely
        return fallbackAnalyze(title, description);
    }
}

// Fallback just in case the browser blocks WASM or storage
function fallbackAnalyze(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    let autoSeverity = 3;
    let predictedCategory = 'INFRASTRUCTURE';
    
    if (text.includes('fire') || text.includes('smoke')) predictedCategory = 'FIRE';
    else if (text.includes('blood') || text.includes('hurt') || text.includes('pain')) predictedCategory = 'MEDICAL';
    else if (text.includes('gun') || text.includes('intruder') || text.includes('stolen')) predictedCategory = 'SECURITY';

    if (text.includes('help') || text.includes('emergency') || text.includes('sos')) autoSeverity = 5;

    return {
        category: predictedCategory,
        severity: autoSeverity,
        isLocal: true,
        triageMethod: 'Edge AI (Heuristic Fallback)'
    };
}

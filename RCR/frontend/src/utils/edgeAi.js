/**
 * Edge AI Engine - Offline Triage for RCR
 * Performs semantic analysis on device without network connectivity.
 */

const CATEGORY_KEYWORDS = {
    FIRE: ['fire', 'smoke', 'burning', 'explosion', 'flame', 'spark'],
    MEDICAL: ['hurt', 'blood', 'bleeding', 'unconscious', 'faint', 'pain', 'breathing', 'heart', 'injury'],
    SECURITY: ['intruder', 'gun', 'weapon', 'fight', 'theft', 'stolen', 'broken', 'suspicious'],
    INFRASTRUCTURE: ['leak', 'water', 'pipe', 'electric', 'power', 'elevator', 'lift', 'ac', 'hvac']
};

const SEVERITY_KEYWORDS = {
    5: ['trapped', 'explosion', 'unconscious', 'active', 'immediate', 'dying', 'cannot breathe'],
    4: ['bleeding', 'large', 'major', 'urgent', 'danger'],
    3: ['pain', 'stolen', 'broken', 'leak', 'issue'],
    2: ['slow', 'small', 'minor', 'checking'],
    1: ['test', 'check', 'normal']
};

export function localAnalyze(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    
    let predictedCategory = 'INFRASTRUCTURE';
    let maxCatMatches = 0;

    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        const matches = keywords.filter(kw => text.includes(kw)).length;
        if (matches > maxCatMatches) {
            maxCatMatches = matches;
            predictedCategory = cat;
        }
    }

    let autoSeverity = 3;
    let maxSevMatches = 0;

    for (const [sev, keywords] of Object.entries(SEVERITY_KEYWORDS)) {
        const matches = keywords.filter(kw => text.includes(kw)).length;
        if (matches > maxSevMatches) {
            maxSevMatches = matches;
            autoSeverity = parseInt(sev);
        }
    }

    // Heuristic boost: Fire/Security with major keywords gets a boost
    if ((predictedCategory === 'FIRE' || predictedCategory === 'SECURITY') && text.includes('help')) {
        autoSeverity = Math.min(5, autoSeverity + 1);
    }

    return {
        category: predictedCategory,
        severity: autoSeverity,
        isLocal: true,
        triageMethod: 'Edge AI (Offline)'
    };
}

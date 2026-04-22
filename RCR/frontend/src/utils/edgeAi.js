// Edge AI — lightweight heuristic fallback for offline triage
// Note: @huggingface/transformers removed (import.meta incompatible with react-scripts/webpack4)
// Cloud Gemini handles full AI triage when online

export async function localAnalyze(title, description) {
    return fallbackAnalyze(title, description);
}

function fallbackAnalyze(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    let autoSeverity = 3;
    let predictedCategory = 'INFRASTRUCTURE';

    if (text.includes('fire') || text.includes('smoke') || text.includes('flame') || text.includes('burn'))
        predictedCategory = 'FIRE';
    else if (text.includes('blood') || text.includes('hurt') || text.includes('pain') || text.includes('medical') || text.includes('cardiac') || text.includes('collapse'))
        predictedCategory = 'MEDICAL';
    else if (text.includes('gun') || text.includes('intruder') || text.includes('stolen') || text.includes('threat') || text.includes('weapon'))
        predictedCategory = 'SECURITY';

    if (text.includes('help') || text.includes('emergency') || text.includes('sos') || text.includes('critical'))
        autoSeverity = 5;
    else if (text.includes('urgent') || text.includes('immediate') || text.includes('now'))
        autoSeverity = 4;

    if ((predictedCategory === 'FIRE' || predictedCategory === 'MEDICAL') && autoSeverity < 4)
        autoSeverity = 4;

    return {
        category: predictedCategory,
        severity: autoSeverity,
        isLocal: true,
        triageMethod: 'Edge AI (Heuristic Fallback)'
    };
}

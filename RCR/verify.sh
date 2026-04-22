#!/bin/bash
# Rapid Crisis Response - Quick Verification Script
# Usage: bash verify.sh

echo "🚀 Rapid Crisis Response - Verification Script v0.2.0"
echo "=================================================="
echo ""


# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

check_file_exists() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $2 found at $1"
        ((PASSED++))
    else
        echo -e "${RED}❌${NC} $2 NOT found at $1"
        ((FAILED++))
    fi
}

check_code_contains() {
    if grep -q "$2" "$1"; then
        echo -e "${GREEN}✅${NC} $3 found in $1"
        ((PASSED++))
    else
        echo -e "${RED}❌${NC} $3 NOT found in $1"
        ((FAILED++))
    fi
}

echo "📁 File Structure Check"
echo "========================"
check_file_exists "backend/package.json" "Backend package.json"
check_file_exists "frontend/package.json" "Frontend package.json"
check_file_exists "backend/src/migrations/001_initial_schema.js" "Migration file"
check_file_exists "backend/src/services/ai.service.js" "AI Service"
check_file_exists "frontend/src/components/ReportForm.js" "Report Form"
check_file_exists "frontend/public/service-worker.js" "Service Worker"
echo ""

echo "🚨 Bug 1.1: Geolocation Fix Check"
echo "===================================="
check_code_contains "frontend/src/components/ReportForm.js" "navigator.geolocation.getCurrentPosition" "Geolocation API call"
check_code_contains "frontend/src/components/ReportForm.js" "enableHighAccuracy: true" "High accuracy geolocation"
check_code_contains "frontend/src/components/ReportForm.js" "toast.error.*Unable to get location" "Geolocation error toast"
echo ""

echo "🚨 Bug 1.2: AI JSON Parsing Fix Check"
echo "======================================="
check_code_contains "backend/src/services/ai.service.js" "startsWith(\`\`\`json\`)" "Markdown stripping"
check_code_contains "backend/src/services/ai.service.js" "generationConfig.*responseMimeType" "Strict JSON mode"
check_code_contains "backend/src/services/ai.service.js" "parseJsonSafely" "Robust JSON parser"
echo ""

echo "🚨 Bug 1.3: Error Handling Fix Check"
echo "====================================="
check_code_contains "backend/src/controllers/incidents.controller.js" "exports.getAll.*try {" "getAll try/catch"
check_code_contains "backend/src/controllers/incidents.controller.js" "exports.create.*try {" "create try/catch"
check_code_contains "backend/src/controllers/incidents.controller.js" "if.*!req.user.*!req.user.sub" "User validation"
check_code_contains "backend/src/controllers/incidents.controller.js" "res.status(401)" "401 Unauthorized response"
echo ""

echo "⚠️ Warning 2.1: Offline Sync Fix Check"
echo "========================================"
check_code_contains "frontend/public/service-worker.js" "floorLevel.*rpt.floorLevel" "Floor level in sync"
check_code_contains "frontend/public/service-worker.js" "roomNumber.*rpt.roomNumber" "Room number in sync"
check_code_contains "frontend/public/service-worker.js" "wingId.*rpt.wingId" "Wing ID in sync"
echo ""

echo "⚠️ Warning 2.2: Multimodal Input Check"
echo "========================================="
check_code_contains "frontend/src/components/ReportForm.js" "File too large.*5MB" "File size validation"
check_code_contains "frontend/src/components/ReportForm.js" "/incidents/analyze" "AI analyze endpoint"
check_code_contains "frontend/src/components/ReportForm.js" "detected_language" "Language detection"
check_code_contains "frontend/src/components/ReportForm.js" "MediaRecorder\|getUserMedia" "Audio SOS recording"
echo ""

echo "⚠️ Warning 2.3: Middleware Validation Check"
echo "============================================="
check_code_contains "backend/src/controllers/incidents.controller.js" "if.*!req.user.*req.user.sub" "JWT validation"
echo ""

echo ""
echo "📊 Summary"
echo "=========="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All checks passed! Ready for local verification.${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️ Some checks failed. Please review the fixes.${NC}"
    exit 1
fi

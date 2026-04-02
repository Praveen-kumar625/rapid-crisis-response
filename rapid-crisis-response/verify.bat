@echo off
REM Rapid Crisis Response - Quick Verification Script (Windows)
REM Usage: verify.bat

setlocal enabledelayedexpansion
chcp 65001 > nul

echo 🚀 Rapid Crisis Response - Verification Script v0.2.0
echo ==================================================
echo.

set PASSED=0
set FAILED=0

echo 📁 File Structure Check
echo ========================

if exist "backend\package.json" (
    echo ✅ Backend package.json found
    set /a PASSED+=1
) else (
    echo ❌ Backend package.json NOT found
    set /a FAILED+=1
)

if exist "frontend\package.json" (
    echo ✅ Frontend package.json found
    set /a PASSED+=1
) else (
    echo ❌ Frontend package.json NOT found
    set /a FAILED+=1
)

if exist "backend\src\migrations\001_initial_schema.js" (
    echo ✅ Migration file found
    set /a PASSED+=1
) else (
    echo ❌ Migration file NOT found
    set /a FAILED+=1
)

if exist "backend\src\services\ai.service.js" (
    echo ✅ AI Service found
    set /a PASSED+=1
) else (
    echo ❌ AI Service NOT found
    set /a FAILED+=1
)

if exist "frontend\src\components\ReportForm.js" (
    echo ✅ Report Form found
    set /a PASSED+=1
) else (
    echo ❌ Report Form NOT found
    set /a FAILED+=1
)

if exist "frontend\public\service-worker.js" (
    echo ✅ Service Worker found
    set /a PASSED+=1
) else (
    echo ❌ Service Worker NOT found
    set /a FAILED+=1
)

echo.
echo 🚨 Bug 1.1: Geolocation Fix Check
echo ====================================

findstr /R "navigator.geolocation.getCurrentPosition" "frontend\src\components\ReportForm.js" > nul
if %ERRORLEVEL% == 0 (
    echo ✅ Geolocation API call found
    set /a PASSED+=1
) else (
    echo ❌ Geolocation API call NOT found
    set /a FAILED+=1
)

findstr /R "enableHighAccuracy.*true" "frontend\src\components\ReportForm.js" > nul
if %ERRORLEVEL% == 0 (
    echo ✅ High accuracy geolocation enabled
    set /a PASSED+=1
) else (
    echo ❌ High accuracy geolocation NOT enabled
    set /a FAILED+=1
)

echo.
echo 🚨 Bug 1.2: AI JSON Parsing Fix Check
echo =======================================

findstr /R "startsWith.*json" "backend\src\services\ai.service.js" > nul
if %ERRORLEVEL% == 0 (
    echo ✅ Markdown stripping found
    set /a PASSED+=1
) else (
    echo ❌ Markdown stripping NOT found
    set /a FAILED+=1
)

findstr /R "generationConfig.*responseMimeType" "backend\src\services\ai.service.js" > nul
if %ERRORLEVEL% == 0 (
    echo ✅ Strict JSON mode found
    set /a PASSED+=1
) else (
    echo ❌ Strict JSON mode NOT found
    set /a FAILED+=1
)

echo.
echo 🚨 Bug 1.3: Error Handling Fix Check
echo =====================================

findstr /R "try {" "backend\src\controllers\incidents.controller.js" > nul
if %ERRORLEVEL% == 0 (
    echo ✅ Try/catch blocks found
    set /a PASSED+=1
) else (
    echo ❌ Try/catch blocks NOT found
    set /a FAILED+=1
)

findstr /R "res.status\(401\)" "backend\src\controllers\incidents.controller.js" > nul
if %ERRORLEVEL% == 0 (
    echo ✅ 401 Unauthorized response found
    set /a PASSED+=1
) else (
    echo ❌ 401 Unauthorized response NOT found
    set /a FAILED+=1
)

echo.
echo ⚠️  Warning 2.1: Offline Sync Fix Check
echo ========================================

findstr /R "floorLevel" "frontend\public\service-worker.js" > nul
if %ERRORLEVEL% == 0 (
    echo ✅ Floor level in sync found
    set /a PASSED+=1
) else (
    echo ❌ Floor level in sync NOT found
    set /a FAILED+=1
)

findstr /R "roomNumber" "frontend\public\service-worker.js" > nul
if %ERRORLEVEL% == 0 (
    echo ✅ Room number in sync found
    set /a PASSED+=1
) else (
    echo ❌ Room number in sync NOT found
    set /a FAILED+=1
)

echo.
echo ⚠️  Warning 2.2: Multimodal Input Check
echo ========================================

findstr /R "5MB" "frontend\src\components\ReportForm.js" > nul
if %ERRORLEVEL% == 0 (
    echo ✅ File size validation found
    set /a PASSED+=1
) else (
    echo ❌ File size validation NOT found
    set /a FAILED+=1
)

findstr /R "detected_language" "frontend\src\components\ReportForm.js" > nul
if %ERRORLEVEL% == 0 (
    echo ✅ Language detection found
    set /a PASSED+=1
) else (
    echo ❌ Language detection NOT found
    set /a FAILED+=1
)

echo.
echo 📊 Summary
echo ==========
echo Passed: %PASSED%
echo Failed: %FAILED%
echo.

if %FAILED% == 0 (
    echo 🎉 All checks passed! Ready for local verification.
    exit /b 0
) else (
    echo ⚠️  Some checks failed. Please review the fixes.
    exit /b 1
)

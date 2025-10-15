@echo off
echo.
echo ========================================
echo   Production Readiness Verification
echo ========================================
echo.

echo Checking integration...
node test-launcher-integration.js

echo.
echo ========================================
echo   Ready to Test!
echo ========================================
echo.
echo Run: npm start
echo.
echo You should see:
echo   - [Production] Initializing MessageBroker...
echo   - [Production] Initializing MessagePersistence...
echo   - Production services initialized
echo   - IAB Storage path
echo.
echo The .iab-storage folder will be created when
echo you broadcast your first FDC3 context.
echo.
pause

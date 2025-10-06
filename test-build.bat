@echo off
echo ========================================
echo Testing Web Platform Build
echo ========================================
echo.

echo [Step 1] Building fdc3-core...
cd packages\fdc3-core
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: fdc3-core build failed!
    cd ..\..
    pause
    exit /b 1
)

echo.
echo SUCCESS: fdc3-core built!
echo.

echo [Step 2] Starting web-platform dev server...
cd ..\web-platform
call npm run dev

pause

@echo off
echo ========================================
echo  Web Platform Setup
echo ========================================
echo.

echo [1/3] Installing dependencies...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: npm install failed!
    echo Make sure you're in the root directory.
    pause
    exit /b 1
)

echo.
echo [2/3] Building packages...
call npm run build --workspace=@desktop-interop/fdc3
call npm run build --workspace=@desktop-interop/fdc3-core

echo.
echo [3/3] Starting web platform...
cd packages\web-platform
call npm run dev

pause

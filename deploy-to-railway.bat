@echo off
echo ========================================
echo   Railway Deployment Script
echo   Web Interop Platform
echo ========================================
echo.

echo Step 1: Building web platform...
cd packages\web-platform
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
cd ..\..
echo ✓ Build complete
echo.

echo Step 2: Copying dist to deploy-package...
if exist deploy-package\dist rmdir /s /q deploy-package\dist
xcopy /E /I /Y packages\web-platform\dist deploy-package\dist
echo ✓ Files copied
echo.

echo Step 3: Staging changes...
git add -f deploy-package\dist
git add deploy-package\
echo ✓ Changes staged
echo.

echo Step 4: Committing...
git commit -m "Deploy: Modern header design + UI fixes"
if errorlevel 1 (
    echo No changes to commit or commit failed
)
echo.

echo Step 5: Pushing to Railway...
git push origin main
if errorlevel 1 (
    echo ERROR: Push failed!
    pause
    exit /b 1
)
echo.

echo ========================================
echo   ✓ Deployment Complete!
echo ========================================
echo.
echo Your site will be live at:
echo https://open-openfin-production.up.railway.app
echo.
echo Railway will automatically build and deploy.
echo Check status at: https://railway.app
echo.
pause

@echo off
echo ==========================================
echo EMERGENCY NGINX FIX FOR NEXT.JS ROUTING
echo ==========================================
echo.
echo This script will deploy the nginx fix to the production server
echo to resolve 404 errors on /staff and /admin routes
echo.

REM Check if we have the required files
if not exist "%~dp0..\docker\nginx\nginx-prod.conf" (
    echo ERROR: nginx-prod.conf not found!
    echo Please ensure you're running this from the correct directory
    pause
    exit /b 1
)

echo Deploying nginx fix to production server...
echo.

REM Upload the fixed nginx configuration to the server
scp "%~dp0..\docker\nginx\nginx-prod.conf" root@162.55.213.90:/tmp/nginx-prod.conf

REM Upload the deployment script
scp "%~dp0fix-nginx-nextjs-routing.sh" root@162.55.213.90:/tmp/fix-nginx-nextjs-routing.sh

REM Execute the fix on the server
ssh root@162.55.213.90 "chmod +x /tmp/fix-nginx-nextjs-routing.sh && /tmp/fix-nginx-nextjs-routing.sh"

echo.
echo ==========================================
echo DEPLOYMENT COMPLETE
echo ==========================================
echo.
echo Please test the following URLs in your browser:
echo • https://logen.locod-ai.com/
echo • https://logen.locod-ai.com/staff
echo • https://logen.locod-ai.com/admin
echo.
pause
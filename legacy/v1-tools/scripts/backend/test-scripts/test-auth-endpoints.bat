@echo off
setlocal enabledelayedexpansion

echo JWT Authentication Endpoint Testing
echo ====================================
echo.

REM Check if curl is available
curl --version >nul 2>&1
if errorlevel 1 (
    echo Error: curl is not available. Please install curl to run these tests.
    pause
    exit /b 1
)

set BASE_URL=http://localhost:7600

echo Testing health endpoint...
curl -s -X GET %BASE_URL%/api/health
echo.
echo.

echo Testing user registration...
curl -s -X POST %BASE_URL%/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"test@example.com\", \"password\": \"Test123!@#\", \"firstName\": \"Test\", \"lastName\": \"User\"}" > response.json

echo Response saved to response.json
type response.json
echo.
echo.

REM Extract access token from response (this is simplified - in practice you'd use jq or similar)
echo To continue testing, you need to:
echo 1. Copy the accessToken from the response above
echo 2. Replace YOUR_JWT_TOKEN in the commands below with the actual token
echo.

echo Example: Testing profile endpoint (protected)
echo curl -X GET %BASE_URL%/auth/profile -H "Authorization: Bearer YOUR_JWT_TOKEN"
echo.

echo Example: Testing login
echo curl -X POST %BASE_URL%/auth/login -H "Content-Type: application/json" -d "{\"email\": \"test@example.com\", \"password\": \"Test123!@#\"}"
echo.

echo Example: Testing admin endpoint with admin user
echo curl -X POST %BASE_URL%/auth/login -H "Content-Type: application/json" -d "{\"email\": \"admin@locod.ai\", \"password\": \"admin123\"}"
echo curl -X GET %BASE_URL%/auth/admin/users -H "Authorization: Bearer ADMIN_TOKEN"
echo.

REM Clean up
if exist response.json del response.json

echo.
echo Test completed. Make sure the backend server is running with: npm run start:dev
pause
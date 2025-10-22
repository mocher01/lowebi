@echo off
REM LOCOD-AI Staff Admin Dashboard Startup Script
REM This script starts the staff admin dashboard on port 7601

echo 🚀 Starting LOCOD-AI Staff Admin Dashboard...
echo 📊 Dashboard will be available at: http://localhost:7601/admin
echo 🔐 Admin login required
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Set environment variables for admin dashboard
set NEXT_PUBLIC_API_URL=http://162.55.213.90:3080
set NODE_ENV=development

REM Start the development server
echo 🌟 Starting development server on port 7601...
npm run admin

echo ✅ Admin dashboard started successfully!
echo 🌐 Access the dashboard at: http://localhost:7601/admin
pause
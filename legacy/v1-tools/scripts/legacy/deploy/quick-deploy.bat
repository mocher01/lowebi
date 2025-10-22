@echo off
REM 🚀 Quick Deploy Script for Windows
REM Automatically deploys changes to production server

echo 🚀 Quick Deploy Starting...
echo ==============================

REM Check if git status has changes
git status --porcelain > temp_status.txt
set /p HAS_CHANGES=<temp_status.txt
del temp_status.txt

if not "%HAS_CHANGES%"=="" (
    echo 📝 Committing local changes...
    git add .
    git commit -m "feat: Quick deploy - latest changes

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
    echo ✅ Changes committed
) else (
    echo ℹ️ No local changes to commit
)

echo.
echo 2️⃣ Pushing to GitHub...
git push origin main
if errorlevel 1 (
    echo ❌ Failed to push to GitHub
    pause
    exit /b 1
)
echo ✅ Pushed to GitHub

echo.
echo 3️⃣ Pulling on production server...
ssh root@162.55.213.90 "cd /var/apps/website-generator && git pull origin main"
if errorlevel 1 (
    echo ❌ Failed to pull on server
    pause
    exit /b 1
)
echo ✅ Pulled on production server

echo.
echo 4️⃣ Verifying deployment...
curl -s http://162.55.213.90:3080/api/health
echo.

echo.
echo 🎉 Quick Deploy Complete!
echo ==============================
echo 🌐 Wizard: http://162.55.213.90:3080/wizard
echo 🔧 API: http://162.55.213.90:3080/api/health
echo.
pause
@echo off
echo Starting PostgreSQL for Locod.AI v2.0...
echo.

REM Check if Docker is available
docker --version >nul 2>&1
if errorlevel 1 (
    echo Docker is not available. Please install Docker Desktop or use an existing PostgreSQL installation.
    echo.
    echo Alternative: Install PostgreSQL locally and create a database with these settings:
    echo   Host: localhost
    echo   Port: 5433
    echo   Database: locod_db
    echo   Username: locod_user
    echo   Password: locod_pass_2024
    echo.
    pause
    exit /b 1
)

echo Stopping any existing PostgreSQL container...
docker stop locod-postgres 2>nul
docker rm locod-postgres 2>nul

echo Starting PostgreSQL container...
docker run --name locod-postgres ^
  -e POSTGRES_USER=locod_user ^
  -e POSTGRES_PASSWORD=locod_pass_2024 ^
  -e POSTGRES_DB=locod_db ^
  -p 5433:5432 ^
  -d postgres:15

if errorlevel 1 (
    echo Failed to start PostgreSQL container.
    pause
    exit /b 1
)

echo Waiting for PostgreSQL to be ready...
timeout /t 5 /nobreak >nul

echo Initializing database schema...
docker exec -i locod-postgres psql -U locod_user -d locod_db < ..\docker\init.sql

if errorlevel 1 (
    echo Warning: Could not initialize database schema. You may need to run the init.sql file manually.
    echo File location: v2\docker\init.sql
    echo.
)

echo.
echo PostgreSQL is now running on localhost:5433
echo Database: locod_db
echo Username: locod_user
echo Password: locod_pass_2024
echo.
echo You can now start the NestJS backend with: npm run start:dev
echo.
pause
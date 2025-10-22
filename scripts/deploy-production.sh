#!/bin/bash

# LOGEN Production Deployment Script
# Implements all three SSL solutions

set -e

echo "🚀 LOGEN Production Deployment"
echo "=================================="

# Configuration
BACKEND_PORT=${BACKEND_PORT:-7600}
FRONTEND_PORT=${FRONTEND_PORT:-7601}
ADMIN_PORT=${ADMIN_PORT:-7602}

# Database Configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5433}
DB_USERNAME=${DB_USERNAME:-locod_user}
DB_PASSWORD=${DB_PASSWORD:-locod_pass_2024}
DB_DATABASE=${DB_DATABASE:-locod_db}

# SSL Configuration (Solution 1: Environment Variable Control)
DB_SSL=${DB_SSL:-false}

echo "📋 Configuration:"
echo "  Backend Port: $BACKEND_PORT"
echo "  Admin Port: $ADMIN_PORT"
echo "  Database: $DB_HOST:$DB_PORT/$DB_DATABASE"
echo "  SSL Mode: $DB_SSL"
echo ""

# Check if services are already running
if pgrep -f "nest.*start.*prod" > /dev/null; then
    echo "⚠️  Backend already running, stopping..."
    pkill -f "nest.*start.*prod" || true
    sleep 2
fi

if pgrep -f "next.*dev.*$ADMIN_PORT" > /dev/null; then
    echo "⚠️  Admin frontend already running, stopping..."
    pkill -f "next.*dev.*$ADMIN_PORT" || true
    sleep 2
fi

# Build backend
echo "🔨 Building backend..."
cd /var/apps/logen/apps/backend
npm run build

# Start backend with SSL configuration
echo "🚀 Starting backend (NODE_ENV=production, DB_SSL=$DB_SSL)..."
NODE_ENV=production \
DB_HOST=$DB_HOST \
DB_PORT=$DB_PORT \
DB_USERNAME=$DB_USERNAME \
DB_PASSWORD=$DB_PASSWORD \
DB_DATABASE=$DB_DATABASE \
DB_SSL=$DB_SSL \
PORT=$BACKEND_PORT \
nohup npm run start:prod > /var/apps/logen/logs/backend.log 2>&1 &

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
for i in {1..30}; do
    if curl -f http://localhost:$BACKEND_PORT/api/health > /dev/null 2>&1; then
        echo "✅ Backend started successfully"
        break
    fi
    echo "   Attempt $i/30..."
    sleep 2
done

# Start admin frontend
echo "🚀 Starting admin frontend..."
cd /var/apps/logen/apps/admin-frontend
NEXT_PUBLIC_API_URL=http://localhost:$BACKEND_PORT \
nohup npm run dev -- --port $ADMIN_PORT > /var/apps/logen/logs/admin-frontend.log 2>&1 &

# Wait for frontend to start
echo "⏳ Waiting for admin frontend to start..."
for i in {1..30}; do
    if curl -f http://localhost:$ADMIN_PORT > /dev/null 2>&1; then
        echo "✅ Admin frontend started successfully"
        break
    fi
    echo "   Attempt $i/30..."
    sleep 2
done

# Status check
echo ""
echo "📊 Service Status:"
echo "==================="

# Backend health
if curl -f http://localhost:$BACKEND_PORT/api/health > /dev/null 2>&1; then
    echo "✅ Backend API: http://localhost:$BACKEND_PORT (Healthy)"
    echo "   📖 API Docs: http://localhost:$BACKEND_PORT/api/docs"
    echo "   🔍 Health: http://localhost:$BACKEND_PORT/api/health"
else
    echo "❌ Backend API: http://localhost:$BACKEND_PORT (Failed)"
fi

# Admin frontend
if curl -f http://localhost:$ADMIN_PORT > /dev/null 2>&1; then
    echo "✅ Admin Frontend: http://localhost:$ADMIN_PORT"
else
    echo "❌ Admin Frontend: http://localhost:$ADMIN_PORT (Failed)"
fi

# Database connection test
echo ""
echo "🔌 Testing database connection..."
if curl -f http://localhost:$BACKEND_PORT/api/health > /dev/null 2>&1; then
    echo "✅ Database connection: Working"
    echo "   SSL Mode: $DB_SSL"
    echo "   Host: $DB_HOST:$DB_PORT"
else
    echo "❌ Database connection: Failed"
fi

echo ""
echo "🎉 LOGEN Deployment Complete!"
echo "================================"
echo ""
echo "🌐 Access Points:"
echo "  Admin Portal: http://localhost:$ADMIN_PORT"
echo "  Backend API: http://localhost:$BACKEND_PORT"
echo "  Health Check: http://localhost:$BACKEND_PORT/api/health"
echo ""
echo "📝 When nginx-reverse is fixed:"
echo "  https://admin.logen.locod-ai.com"
echo ""
echo "🔧 SSL Configuration Options:"
echo "  DB_SSL=false     - No SSL (current, optimal for localhost)"
echo "  DB_SSL=prefer    - SSL with self-signed certificates"
echo "  DB_SSL=require   - SSL with full certificate validation"
echo ""
echo "📋 To change SSL mode:"
echo "  DB_SSL=prefer $0"
echo ""
echo "📁 Logs:"
echo "  Backend: /var/apps/logen/logs/backend.log"
echo "  Admin: /var/apps/logen/logs/admin-frontend.log"
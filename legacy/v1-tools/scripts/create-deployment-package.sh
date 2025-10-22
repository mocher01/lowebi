#!/bin/bash

# Create Deployment Package for Website Generator v2 Backend
# This script creates a deployment-ready package for the production server

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_DIR/backend"
OUTPUT_DIR="$PROJECT_DIR/deployment-package"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
PACKAGE_NAME="website-generator-v2-backend-$TIMESTAMP"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Create deployment package
create_package() {
    log "Creating deployment package for Website Generator v2 Backend..."
    
    # Create output directory
    rm -rf "$OUTPUT_DIR"
    mkdir -p "$OUTPUT_DIR/$PACKAGE_NAME"
    
    cd "$BACKEND_DIR"
    
    # Verify build exists
    if [[ ! -d "dist" ]]; then
        error "Backend not built. Run 'npm run build' first."
    fi
    
    log "Copying backend files..."
    
    # Copy essential files
    cp -r dist "$OUTPUT_DIR/$PACKAGE_NAME/"
    cp package.json "$OUTPUT_DIR/$PACKAGE_NAME/"
    cp package-lock.json "$OUTPUT_DIR/$PACKAGE_NAME/"
    
    # Copy environment template
    cp .env.production "$OUTPUT_DIR/$PACKAGE_NAME/.env.example"
    
    # Copy database migrations if they exist
    if [[ -d "src/migrations" ]]; then
        cp -r src/migrations "$OUTPUT_DIR/$PACKAGE_NAME/"
    fi
    
    # Copy deployment scripts
    log "Copying deployment scripts..."
    cp -r "$PROJECT_DIR/scripts" "$OUTPUT_DIR/$PACKAGE_NAME/"
    cp -r "$PROJECT_DIR/docker" "$OUTPUT_DIR/$PACKAGE_NAME/"
    
    # Create production-specific files
    log "Creating production configuration files..."
    
    # Create production package.json with only production scripts
    cat > "$OUTPUT_DIR/$PACKAGE_NAME/package-prod.json" << 'EOF'
{
  "name": "website-generator-v2-backend",
  "version": "2.0.0",
  "description": "Website Generator v2 - Production Backend",
  "main": "dist/main.js",
  "scripts": {
    "start": "node dist/main.js",
    "start:prod": "NODE_ENV=production node dist/main.js"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.1",
    "@nestjs/config": "^4.0.0",
    "@nestjs/core": "^11.0.1",
    "@nestjs/jwt": "^11.0.0",
    "@nestjs/passport": "^11.0.0",
    "@nestjs/platform-express": "^11.0.1",
    "@nestjs/swagger": "^11.2.0",
    "@nestjs/throttler": "^6.4.0",
    "@nestjs/typeorm": "^11.0.0",
    "bcrypt": "^5.1.1",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "helmet": "^8.1.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "passport-local": "^1.0.0",
    "pg": "^8.11.3",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "swagger-ui-express": "^5.0.1",
    "typeorm": "^0.3.17"
  }
}
EOF
    
    # Create deployment README
    cat > "$OUTPUT_DIR/$PACKAGE_NAME/README-DEPLOYMENT.md" << 'EOF'
# Website Generator v2 Backend - Production Deployment

## Quick Deployment (Recommended)

1. Extract this package to `/var/apps/website-generator/v2/`
2. Run the quick deployment script:
   ```bash
   chmod +x scripts/quick-deploy-backend.sh
   sudo ./scripts/quick-deploy-backend.sh
   ```

## Manual Deployment

1. Install Node.js 18+ and npm
2. Extract files to production directory
3. Install dependencies:
   ```bash
   npm ci --only=production
   ```
4. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```
5. Start the application:
   ```bash
   npm run start:prod
   ```

## Configuration

- Backend runs on port 7600
- Environment variables in `.env` file
- Database: PostgreSQL (configured in docker-compose)
- Logs: PM2 or console output

## Health Check

- URL: http://localhost:7600/api/health
- API Docs: http://localhost:7600/api/docs

## Troubleshooting

1. Check logs: `pm2 logs website-generator-backend`
2. Check process: `pm2 status`
3. Check port: `lsof -i :7600`
4. Restart: `pm2 restart website-generator-backend`

## Security

- Update all passwords in .env
- Configure firewall for port 7600
- Enable HTTPS in production
- Regularly update dependencies
EOF
    
    # Create systemd service file
    cat > "$OUTPUT_DIR/$PACKAGE_NAME/website-generator-backend.service" << 'EOF'
[Unit]
Description=Website Generator v2 Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/apps/website-generator/v2/backend
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=7600

[Install]
WantedBy=multi-user.target
EOF
    
    # Create nginx configuration
    cat > "$OUTPUT_DIR/$PACKAGE_NAME/nginx-backend.conf" << 'EOF'
# Nginx configuration for Website Generator v2 Backend
server {
    listen 80;
    server_name 162.55.213.90;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name 162.55.213.90;
    
    # SSL Configuration (certificates should be in /etc/nginx/ssl/)
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Backend API proxy
    location /api {
        proxy_pass http://localhost:7600;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Frontend proxy (port 7601)
    location / {
        proxy_pass http://localhost:7601;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
    
    # Create installation script
    cat > "$OUTPUT_DIR/$PACKAGE_NAME/install.sh" << 'EOF'
#!/bin/bash

# Installation script for Website Generator v2 Backend
set -e

echo "Installing Website Generator v2 Backend..."

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root" 
   exit 1
fi

# Create application directory
mkdir -p /var/apps/website-generator/v2
cp -r * /var/apps/website-generator/v2/

# Set permissions
chown -R www-data:www-data /var/apps/website-generator/v2
chmod +x /var/apps/website-generator/v2/scripts/*.sh

# Install systemd service
cp website-generator-backend.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable website-generator-backend

echo "Installation complete!"
echo "Next steps:"
echo "1. Configure environment: /var/apps/website-generator/v2/.env"
echo "2. Start service: systemctl start website-generator-backend"
echo "3. Check status: systemctl status website-generator-backend"
EOF
    
    chmod +x "$OUTPUT_DIR/$PACKAGE_NAME/install.sh"
    chmod +x "$OUTPUT_DIR/$PACKAGE_NAME/scripts"/*.sh
    
    # Create deployment archive
    cd "$OUTPUT_DIR"
    tar -czf "$PACKAGE_NAME.tar.gz" "$PACKAGE_NAME"
    zip -r "$PACKAGE_NAME.zip" "$PACKAGE_NAME" > /dev/null
    
    success "Deployment package created successfully!"
    log "Package location: $OUTPUT_DIR"
    log "Archive files:"
    log "  - $PACKAGE_NAME.tar.gz"
    log "  - $PACKAGE_NAME.zip"
    log ""
    log "Deployment instructions:"
    log "1. Copy archive to production server"
    log "2. Extract: tar -xzf $PACKAGE_NAME.tar.gz"
    log "3. Run: sudo ./install.sh"
    log "4. Configure: edit .env file"
    log "5. Start: systemctl start website-generator-backend"
    log ""
    log "Quick deployment: ./scripts/quick-deploy-backend.sh"
}

# Calculate package size
calculate_size() {
    local dir="$OUTPUT_DIR/$PACKAGE_NAME"
    local size=$(du -sh "$dir" | cut -f1)
    local files=$(find "$dir" -type f | wc -l)
    
    log "Package statistics:"
    log "  - Size: $size"
    log "  - Files: $files"
    log "  - Components: backend dist, scripts, docker configs, documentation"
}

# Main execution
main() {
    log "=== Creating Website Generator v2 Deployment Package ==="
    
    create_package
    calculate_size
    
    success "=== Deployment Package Creation Complete ==="
    log "Ready for production deployment on 162.55.213.90:7600"
}

# Execute
main "$@"
#!/bin/bash

# Script to apply webhook IP whitelist to nginx configuration

CONFIG_FILE="/var/apps/nginx-reverse/nginx/conf.d/automation.locod-ai.com.conf"
BACKUP_FILE="$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"

echo "🔒 Applying webhook IP whitelist security..."

# Backup current config
cp "$CONFIG_FILE" "$BACKUP_FILE"
echo "✅ Backed up to: $BACKUP_FILE"

# Create new config with webhook security
cat > "$CONFIG_FILE" << 'EOF'
server {
    listen 80;
    server_name automation.locod-ai.com automation.locod-ai.fr;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name automation.locod-ai.com automation.locod-ai.fr;

    ssl_certificate /etc/letsencrypt/live/automation.locod-ai.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/automation.locod-ai.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Webhook IP Whitelist - Only server and Docker networks
    location /webhook/ {
        allow 162.55.213.90;     # Server public IP
        allow 127.0.0.1;         # Localhost
        allow 172.16.0.0/12;     # Docker networks
        deny all;
        
        proxy_pass http://n8n-prod:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 10;
        proxy_read_timeout 10;
        proxy_send_timeout 10;
        proxy_next_upstream error timeout http_502 http_503 http_504;

        proxy_intercept_errors on;
        error_page 502 503 504 = @fallback;
    }

    # General N8N access (dashboard, API, etc.)
    location / {
        proxy_pass http://n8n-prod:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 10;
        proxy_read_timeout 10;
        proxy_send_timeout 10;
        proxy_next_upstream error timeout http_502 http_503 http_504;

        proxy_intercept_errors on;
        error_page 502 503 504 = @fallback;
    }

    location @fallback {
        return 503 "n8n is starting up. Please wait...";
        add_header Content-Type text/plain;
    }
}
EOF

echo "✅ New configuration written"

# Test nginx config
cd /var/apps/nginx-reverse
docker-compose exec -T nginx-reverse nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    
    # Reload nginx
    docker-compose exec -T nginx-reverse nginx -s reload
    echo "✅ Nginx reloaded with new configuration"
    
    echo ""
    echo "🛡️ Webhook security applied:"
    echo "   - Allowed: 162.55.213.90 (server)"
    echo "   - Allowed: 127.0.0.1 (localhost)"
    echo "   - Allowed: 172.16.0.0/12 (Docker)"
    echo "   - Denied: All other IPs"
else
    echo "❌ Nginx configuration test failed!"
    echo "Restoring backup..."
    cp "$BACKUP_FILE" "$CONFIG_FILE"
    exit 1
fi
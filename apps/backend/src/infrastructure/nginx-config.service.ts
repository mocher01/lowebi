import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

@Injectable()
export class NginxConfigService {
  private readonly logger = new Logger(NginxConfigService.name);
  private readonly nginxConfigPath: string;
  private readonly nginxContainerName: string;
  private readonly sslWildcardCertPath: string;
  private readonly domainBase: string;

  constructor(private configService: ConfigService) {
    this.nginxConfigPath =
      this.configService.get<string>('NGINX_CONFIG_PATH') ||
      '/var/apps/nginx-reverse/nginx/conf.d';
    this.nginxContainerName =
      this.configService.get<string>('NGINX_CONTAINER_NAME') || 'nginx-reverse';
    this.sslWildcardCertPath =
      this.configService.get<string>('SSL_WILDCARD_CERT_PATH') ||
      '/etc/letsencrypt/live/dev.lowebi.com';
    this.domainBase =
      this.configService.get<string>('DOMAIN_BASE') || 'dev.lowebi.com';
  }

  /**
   * Generate Nginx config file for a subdomain using wildcard SSL
   */
  async generateSubdomainConfig(
    domain: string,
    containerName: string,
  ): Promise<string> {
    this.logger.log(
      `Generating Nginx config for subdomain: ${domain} → ${containerName}`,
    );

    const configContent = `# Auto-generated config for ${domain}
# Generated: ${new Date().toISOString()}
# Container: ${containerName}

server {
    listen 443 ssl http2;
    server_name ${domain};

    # Wildcard SSL certificate
    ssl_certificate ${this.sslWildcardCertPath}/fullchain.pem;
    ssl_certificate_key ${this.sslWildcardCertPath}/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy "frame-ancestors 'self' https://*.dev.lowebi.com" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy settings
    location / {
        proxy_pass http://${containerName}:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        # Hide X-Frame-Options from backend to allow CSP to take precedence
        proxy_hide_header X-Frame-Options;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }

    # Logging
    access_log /var/log/nginx/${domain}-access.log combined;
    error_log /var/log/nginx/${domain}-error.log warn;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name ${domain};
    return 301 https://$server_name$request_uri;
}
`;

    const configPath = path.join(this.nginxConfigPath, `${domain}.conf`);

    try {
      // Ensure directory exists
      if (!fs.existsSync(this.nginxConfigPath)) {
        fs.mkdirSync(this.nginxConfigPath, { recursive: true });
      }

      // Write config file
      fs.writeFileSync(configPath, configContent, 'utf8');
      this.logger.log(`✅ Nginx config written to: ${configPath}`);

      return configPath;
    } catch (error) {
      this.logger.error(`Failed to write Nginx config: ${error.message}`);
      throw new Error(`Failed to generate Nginx config: ${error.message}`);
    }
  }

  /**
   * Generate Nginx config file for a custom domain with individual SSL
   */
  async generateCustomDomainConfig(
    domain: string,
    containerName: string,
    sslCertPath: string,
  ): Promise<string> {
    this.logger.log(
      `Generating Nginx config for custom domain: ${domain} → ${containerName}`,
    );

    const configContent = `# Auto-generated config for ${domain}
# Generated: ${new Date().toISOString()}
# Container: ${containerName}
# Custom domain with individual SSL

server {
    listen 443 ssl http2;
    server_name ${domain} www.${domain};

    # Individual SSL certificate
    ssl_certificate ${sslCertPath}/fullchain.pem;
    ssl_certificate_key ${sslCertPath}/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy "frame-ancestors 'self' https://*.dev.lowebi.com" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy settings
    location / {
        proxy_pass http://${containerName}:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        # Hide X-Frame-Options from backend to allow CSP to take precedence
        proxy_hide_header X-Frame-Options;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }

    # Logging
    access_log /var/log/nginx/${domain}-access.log combined;
    error_log /var/log/nginx/${domain}-error.log warn;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name ${domain} www.${domain};
    return 301 https://$server_name$request_uri;
}
`;

    const configPath = path.join(this.nginxConfigPath, `${domain}.conf`);

    try {
      // Ensure directory exists
      if (!fs.existsSync(this.nginxConfigPath)) {
        fs.mkdirSync(this.nginxConfigPath, { recursive: true });
      }

      // Write config file
      fs.writeFileSync(configPath, configContent, 'utf8');
      this.logger.log(`✅ Nginx config written to: ${configPath}`);

      return configPath;
    } catch (error) {
      this.logger.error(`Failed to write Nginx config: ${error.message}`);
      throw new Error(`Failed to generate Nginx config: ${error.message}`);
    }
  }

  /**
   * Remove Nginx config file
   */
  async removeConfig(domain: string): Promise<void> {
    const configPath = path.join(this.nginxConfigPath, `${domain}.conf`);

    this.logger.log(`Removing Nginx config for: ${domain}`);

    try {
      if (fs.existsSync(configPath)) {
        fs.unlinkSync(configPath);
        this.logger.log(`✅ Nginx config removed: ${configPath}`);
      } else {
        this.logger.warn(`Nginx config not found: ${configPath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to remove Nginx config: ${error.message}`);
      throw new Error(`Failed to remove Nginx config: ${error.message}`);
    }
  }

  /**
   * Reload Nginx to apply configuration changes
   */
  async reloadNginx(): Promise<void> {
    this.logger.log('Reloading Nginx configuration...');

    try {
      // Test Nginx configuration first
      const testResult = execSync(
        `docker exec ${this.nginxContainerName} nginx -t`,
        { encoding: 'utf8', stdio: 'pipe' },
      );
      this.logger.log(`Nginx config test: ${testResult.trim()}`);

      // Reload Nginx
      const reloadResult = execSync(
        `docker exec ${this.nginxContainerName} nginx -s reload`,
        { encoding: 'utf8', stdio: 'pipe' },
      );
      this.logger.log(`✅ Nginx reloaded successfully`);
    } catch (error) {
      this.logger.error(`Failed to reload Nginx: ${error.message}`);
      if (error.stdout) {
        this.logger.error(`stdout: ${error.stdout}`);
      }
      if (error.stderr) {
        this.logger.error(`stderr: ${error.stderr}`);
      }
      throw new Error(`Failed to reload Nginx: ${error.message}`);
    }
  }

  /**
   * Check if Nginx config file exists
   */
  configExists(domain: string): boolean {
    const configPath = path.join(this.nginxConfigPath, `${domain}.conf`);
    return fs.existsSync(configPath);
  }

  /**
   * Get config file path for a domain
   */
  getConfigPath(domain: string): string {
    return path.join(this.nginxConfigPath, `${domain}.conf`);
  }
}

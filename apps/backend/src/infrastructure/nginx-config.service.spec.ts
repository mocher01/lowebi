import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NginxConfigService } from './nginx-config.service';
import * as fs from 'fs';
import { execSync } from 'child_process';

// Mock fs and execSync
jest.mock('fs');
jest.mock('child_process');

describe('NginxConfigService', () => {
  let service: NginxConfigService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        NGINX_CONFIG_PATH: '/test/nginx-configs',
        NGINX_CONTAINER_NAME: 'test-nginx',
        SSL_WILDCARD_CERT_PATH: '/test/ssl/wildcard',
        DOMAIN_BASE: 'test.example.com',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NginxConfigService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<NginxConfigService>(NginxConfigService);
    configService = module.get<ConfigService>(ConfigService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('generateSubdomainConfig', () => {
    it('should generate valid Nginx config for subdomain', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      const configPath = await service.generateSubdomainConfig(
        'mysite.test.example.com',
        'mysite-abc123',
      );

      expect(configPath).toBe(
        '/test/nginx-configs/mysite.test.example.com.conf',
      );
      expect(fs.writeFileSync).toHaveBeenCalled();

      const writeCall = (fs.writeFileSync as jest.Mock).mock.calls[0];
      const configContent = writeCall[1] as string;

      // Verify config content
      expect(configContent).toContain('server_name mysite.test.example.com');
      expect(configContent).toContain('proxy_pass http://mysite-abc123:80');
      expect(configContent).toContain(
        'ssl_certificate /test/ssl/wildcard/fullchain.pem',
      );
      expect(configContent).toContain(
        'ssl_certificate_key /test/ssl/wildcard/privkey.pem',
      );
      expect(configContent).toContain('listen 443 ssl http2');
      expect(configContent).toContain('Strict-Transport-Security');
    });

    it('should create directory if it does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {});
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      await service.generateSubdomainConfig(
        'test.example.com',
        'test-container',
      );

      expect(fs.mkdirSync).toHaveBeenCalledWith('/test/nginx-configs', {
        recursive: true,
      });
    });

    it('should include security headers in config', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      await service.generateSubdomainConfig(
        'test.example.com',
        'test-container',
      );

      const configContent = (fs.writeFileSync as jest.Mock).mock
        .calls[0][1] as string;

      expect(configContent).toContain('add_header Strict-Transport-Security');
      expect(configContent).toContain('add_header X-Frame-Options');
      expect(configContent).toContain('add_header X-Content-Type-Options');
      expect(configContent).toContain('add_header X-XSS-Protection');
    });

    it('should include WebSocket support', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      await service.generateSubdomainConfig(
        'test.example.com',
        'test-container',
      );

      const configContent = (fs.writeFileSync as jest.Mock).mock
        .calls[0][1] as string;

      expect(configContent).toContain('proxy_set_header Upgrade $http_upgrade');
      expect(configContent).toContain('proxy_set_header Connection "upgrade"');
      expect(configContent).toContain('proxy_http_version 1.1');
    });

    it('should include HTTP to HTTPS redirect', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      await service.generateSubdomainConfig(
        'test.example.com',
        'test-container',
      );

      const configContent = (fs.writeFileSync as jest.Mock).mock
        .calls[0][1] as string;

      expect(configContent).toContain('listen 80');
      expect(configContent).toContain('return 301 https://');
    });

    it('should throw error if write fails', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Write failed');
      });

      await expect(
        service.generateSubdomainConfig('test.example.com', 'test-container'),
      ).rejects.toThrow('Failed to generate Nginx config: Write failed');
    });
  });

  describe('generateCustomDomainConfig', () => {
    it('should generate valid Nginx config for custom domain', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      const configPath = await service.generateCustomDomainConfig(
        'mycustomdomain.com',
        'mysite-abc123',
        '/ssl/custom/mycustomdomain.com',
      );

      expect(configPath).toBe('/test/nginx-configs/mycustomdomain.com.conf');

      const configContent = (fs.writeFileSync as jest.Mock).mock
        .calls[0][1] as string;

      // Verify custom domain config
      expect(configContent).toContain(
        'server_name mycustomdomain.com www.mycustomdomain.com',
      );
      expect(configContent).toContain('proxy_pass http://mysite-abc123:80');
      expect(configContent).toContain(
        'ssl_certificate /ssl/custom/mycustomdomain.com/fullchain.pem',
      );
      expect(configContent).toContain(
        'ssl_certificate_key /ssl/custom/mycustomdomain.com/privkey.pem',
      );
    });

    it('should include www subdomain for custom domains', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      await service.generateCustomDomainConfig(
        'example.com',
        'test-container',
        '/ssl/example.com',
      );

      const configContent = (fs.writeFileSync as jest.Mock).mock
        .calls[0][1] as string;

      expect(configContent).toContain(
        'server_name example.com www.example.com',
      );
    });
  });

  describe('removeConfig', () => {
    it('should remove config file if it exists', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {});

      await service.removeConfig('test.example.com');

      expect(fs.unlinkSync).toHaveBeenCalledWith(
        '/test/nginx-configs/test.example.com.conf',
      );
    });

    it('should not throw if config file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(
        service.removeConfig('test.example.com'),
      ).resolves.not.toThrow();
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    it('should throw error if removal fails', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {
        throw new Error('Removal failed');
      });

      await expect(service.removeConfig('test.example.com')).rejects.toThrow(
        'Failed to remove Nginx config: Removal failed',
      );
    });
  });

  describe('reloadNginx', () => {
    it('should test and reload Nginx successfully', async () => {
      (execSync as jest.Mock)
        .mockReturnValueOnce('nginx: configuration file is valid')
        .mockReturnValueOnce('');

      await service.reloadNginx();

      expect(execSync).toHaveBeenCalledTimes(2);
      expect(execSync).toHaveBeenCalledWith(
        'docker exec test-nginx nginx -t',
        expect.any(Object),
      );
      expect(execSync).toHaveBeenCalledWith(
        'docker exec test-nginx nginx -s reload',
        expect.any(Object),
      );
    });

    it('should throw error if Nginx test fails', async () => {
      const error = new Error('Config test failed') as any;
      error.stdout = 'Test output';
      error.stderr = 'Test error';
      (execSync as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await expect(service.reloadNginx()).rejects.toThrow(
        'Failed to reload Nginx: Config test failed',
      );
    });

    it('should throw error if Nginx reload fails', async () => {
      (execSync as jest.Mock)
        .mockReturnValueOnce('nginx: configuration file is valid')
        .mockImplementationOnce(() => {
          throw new Error('Reload failed');
        });

      await expect(service.reloadNginx()).rejects.toThrow(
        'Failed to reload Nginx: Reload failed',
      );
    });
  });

  describe('configExists', () => {
    it('should return true if config exists', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = service.configExists('test.example.com');

      expect(result).toBe(true);
      expect(fs.existsSync).toHaveBeenCalledWith(
        '/test/nginx-configs/test.example.com.conf',
      );
    });

    it('should return false if config does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = service.configExists('test.example.com');

      expect(result).toBe(false);
    });
  });

  describe('getConfigPath', () => {
    it('should return correct config path', () => {
      const path = service.getConfigPath('test.example.com');

      expect(path).toBe('/test/nginx-configs/test.example.com.conf');
    });

    it('should handle domains with subdomains', () => {
      const path = service.getConfigPath('subdomain.test.example.com');

      expect(path).toBe('/test/nginx-configs/subdomain.test.example.com.conf');
    });
  });

  describe('Configuration defaults', () => {
    it('should use default values if environment variables not set', () => {
      const mockDefaultConfig = {
        get: jest.fn().mockReturnValue(undefined),
      };

      const testModule = Test.createTestingModule({
        providers: [
          NginxConfigService,
          {
            provide: ConfigService,
            useValue: mockDefaultConfig,
          },
        ],
      });

      expect(testModule).toBeDefined();
    });
  });

  describe('Nginx config content validation', () => {
    beforeEach(() => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    });

    it('should include proper proxy headers', async () => {
      await service.generateSubdomainConfig(
        'test.example.com',
        'test-container',
      );

      const configContent = (fs.writeFileSync as jest.Mock).mock
        .calls[0][1] as string;

      expect(configContent).toContain('proxy_set_header Host $host');
      expect(configContent).toContain(
        'proxy_set_header X-Real-IP $remote_addr',
      );
      expect(configContent).toContain(
        'proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for',
      );
      expect(configContent).toContain(
        'proxy_set_header X-Forwarded-Proto $scheme',
      );
      expect(configContent).toContain(
        'proxy_set_header X-Forwarded-Host $host',
      );
      expect(configContent).toContain(
        'proxy_set_header X-Forwarded-Port $server_port',
      );
    });

    it('should include proper timeout settings', async () => {
      await service.generateSubdomainConfig(
        'test.example.com',
        'test-container',
      );

      const configContent = (fs.writeFileSync as jest.Mock).mock
        .calls[0][1] as string;

      expect(configContent).toContain('proxy_connect_timeout 60s');
      expect(configContent).toContain('proxy_send_timeout 60s');
      expect(configContent).toContain('proxy_read_timeout 60s');
    });

    it('should include health check endpoint', async () => {
      await service.generateSubdomainConfig(
        'test.example.com',
        'test-container',
      );

      const configContent = (fs.writeFileSync as jest.Mock).mock
        .calls[0][1] as string;

      expect(configContent).toContain('location /health');
      expect(configContent).toContain('return 200 "healthy\\n"');
    });

    it('should include logging configuration', async () => {
      await service.generateSubdomainConfig(
        'test.example.com',
        'test-container',
      );

      const configContent = (fs.writeFileSync as jest.Mock).mock
        .calls[0][1] as string;

      expect(configContent).toContain(
        'access_log /var/log/nginx/test.example.com-access.log',
      );
      expect(configContent).toContain(
        'error_log /var/log/nginx/test.example.com-error.log',
      );
    });

    it('should include SSL protocols and ciphers', async () => {
      await service.generateSubdomainConfig(
        'test.example.com',
        'test-container',
      );

      const configContent = (fs.writeFileSync as jest.Mock).mock
        .calls[0][1] as string;

      expect(configContent).toContain('ssl_protocols TLSv1.2 TLSv1.3');
      expect(configContent).toContain('ssl_ciphers HIGH:!aNULL:!MD5');
      expect(configContent).toContain('ssl_prefer_server_ciphers on');
      expect(configContent).toContain('ssl_session_cache shared:SSL:10m');
      expect(configContent).toContain('ssl_session_timeout 10m');
    });

    it('should include generation metadata in comments', async () => {
      await service.generateSubdomainConfig(
        'test.example.com',
        'test-container',
      );

      const configContent = (fs.writeFileSync as jest.Mock).mock
        .calls[0][1] as string;

      expect(configContent).toContain(
        '# Auto-generated config for test.example.com',
      );
      expect(configContent).toContain('# Container: test-container');
      expect(configContent).toMatch(/# Generated: \d{4}-\d{2}-\d{2}T/);
    });
  });
});

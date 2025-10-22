import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import { join } from 'path';
import { CustomerSite } from '../entities/customer-site.entity';

const execAsync = promisify(exec);

/**
 * DeploymentService
 *
 * Handles Docker deployment and Nginx configuration:
 * 1. Find available port
 * 2. Build Docker image
 * 3. Run Docker container
 * 4. Configure Nginx reverse proxy
 * 5. Reload Nginx
 *
 * Related: Issue #137 - Step 7: Review & Site Generation
 */
@Injectable()
export class DeploymentService {
  private readonly logger = new Logger(DeploymentService.name);
  private readonly nginxConfigPath = '/var/apps/nginx-reverse/nginx/conf.d';
  private readonly basePort = 3000; // Start from port 3000

  constructor(
    @InjectRepository(CustomerSite)
    private customerSiteRepo: Repository<CustomerSite>,
  ) {}

  /**
   * Deploy site to Docker + Nginx
   */
  async deploySite(siteId: string, sitePath: string): Promise<number> {
    try {
      // Step 1: Find available port
      const port = await this.findAvailablePort();
      this.logger.log(`Assigned port ${port} for ${siteId}`);

      // Step 2: Build Docker image
      await this.buildDockerImage(siteId, sitePath);

      // Step 3: Run Docker container
      await this.runDockerContainer(siteId, port);

      // Step 4: Configure Nginx
      await this.configureNginx(siteId, port);

      // Step 5: Reload Nginx
      await this.reloadNginx();

      this.logger.log(`Deployment completed for ${siteId} on port ${port}`);
      return port;
    } catch (error) {
      this.logger.error(`Deployment failed for ${siteId}:`, error);
      throw new Error(`Deployment failed: ${error.message}`);
    }
  }

  /**
   * Find next available port
   */
  private async findAvailablePort(): Promise<number> {
    // Get max port currently in use
    const sites = await this.customerSiteRepo.find({
      where: { deploymentPort: Not(null) as any },
      order: { deploymentPort: 'DESC' },
      take: 1,
    });

    if (sites.length === 0) {
      return this.basePort + 1; // Start at 3001
    }

    return (sites[0].deploymentPort || this.basePort) + 1;
  }

  /**
   * Build Docker image for site
   */
  private async buildDockerImage(
    siteId: string,
    sitePath: string,
  ): Promise<void> {
    const imageName = `${siteId}-site:latest`;

    this.logger.log(`Building Docker image: ${imageName}`);

    const { stdout, stderr } = await execAsync(
      `docker build -t ${imageName} -f Dockerfile .`,
      {
        cwd: sitePath,
        timeout: 600000, // 10 minutes
        maxBuffer: 20 * 1024 * 1024,
      },
    );

    if (stderr && !stderr.includes('Successfully')) {
      this.logger.warn(`Docker build output: ${stderr}`);
    }

    this.logger.log(`Docker image built: ${imageName}`);
  }

  /**
   * Run Docker container
   */
  private async runDockerContainer(
    siteId: string,
    port: number,
  ): Promise<void> {
    const containerName = `${siteId}-container`;
    const imageName = `${siteId}-site:latest`;

    // Stop and remove existing container if exists
    try {
      await execAsync(`docker stop ${containerName}`);
      await execAsync(`docker rm ${containerName}`);
      this.logger.debug(`Removed existing container: ${containerName}`);
    } catch {
      // Container doesn't exist, continue
    }

    // Run new container
    const { stdout, stderr } = await execAsync(
      `docker run -d --name ${containerName} --network logen-network -p ${port}:80 ${imageName}`,
      {
        timeout: 60000, // 1 minute
      },
    );

    this.logger.log(
      `Docker container running: ${containerName} on port ${port}`,
    );
  }

  /**
   * Configure Nginx reverse proxy
   */
  private async configureNginx(siteId: string, port: number): Promise<void> {
    const domain = `${siteId}.locod-ai.com`;
    const configFile = join(this.nginxConfigPath, `${siteId}.conf`);

    const nginxConfig = `
server {
    listen 80;
    server_name ${domain};

    location / {
        proxy_pass http://${siteId}-container:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Cache static assets
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://${siteId}-container:80;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
`;

    await fs.writeFile(configFile, nginxConfig.trim(), 'utf-8');
    this.logger.log(`Nginx config created: ${configFile}`);
  }

  /**
   * Reload Nginx
   */
  private async reloadNginx(): Promise<void> {
    try {
      await execAsync('docker exec nginx-reverse nginx -t');
      await execAsync('docker exec nginx-reverse nginx -s reload');
      this.logger.log('Nginx reloaded successfully');
    } catch (error) {
      throw new Error(`Nginx reload failed: ${error.message}`);
    }
  }

  /**
   * Undeploy site (cleanup)
   */
  async undeploySite(siteId: string): Promise<void> {
    try {
      // Stop and remove container
      await execAsync(`docker stop ${siteId}-container`);
      await execAsync(`docker rm ${siteId}-container`);

      // Remove Docker image
      await execAsync(`docker rmi ${siteId}-site:latest`);

      // Remove Nginx config
      const configFile = join(this.nginxConfigPath, `${siteId}.conf`);
      await fs.rm(configFile, { force: true });

      // Reload Nginx
      await this.reloadNginx();

      this.logger.log(`Undeployed site: ${siteId}`);
    } catch (error) {
      this.logger.warn(`Failed to undeploy ${siteId}:`, error.message);
    }
  }
}

// Helper: Not operator for TypeORM (imported at top)
import { Not } from 'typeorm';

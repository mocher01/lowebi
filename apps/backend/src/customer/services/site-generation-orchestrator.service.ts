import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WizardSession } from '../entities/wizard-session.entity';
import {
  GenerationTask,
  GenerationTaskStatus,
} from '../entities/generation-task.entity';
import { CustomerSite, SiteStatus } from '../entities/customer-site.entity';
import { WizardDataMapperService } from './wizard-data-mapper.service';
import { DomainManagementService } from '../../infrastructure/domain-management.service';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

/**
 * SiteGenerationOrchestrator
 *
 * Orchestrates site generation by calling the migrated V1 script:
 * 1. Validate wizard data
 * 2. Generate site ID
 * 3. Transform wizardData → V1 site-config.json
 * 4. Save config to logen-site-configs/{siteId}/
 * 5. Call: bash apps/site-generator/bin/generate.sh {siteId} --build --docker --images ai
 * 6. Parse output for Docker port and deployment info
 * 7. Update generation task progress
 * 8. Update customer_site record
 *
 * Related: Issue #137 - Step 7: Review & Site Generation
 */
@Injectable()
export class SiteGenerationOrchestratorService {
  private readonly logger = new Logger(SiteGenerationOrchestratorService.name);

  constructor(
    @InjectRepository(WizardSession)
    private wizardSessionRepo: Repository<WizardSession>,
    @InjectRepository(GenerationTask)
    private generationTaskRepo: Repository<GenerationTask>,
    @InjectRepository(CustomerSite)
    private customerSiteRepo: Repository<CustomerSite>,
    private wizardDataMapper: WizardDataMapperService,
    private domainManagementService: DomainManagementService,
  ) {}

  /**
   * Start site generation process
   */
  async startGeneration(
    wizardSessionId: string,
    customerId: string,
  ): Promise<GenerationTask> {
    // Load wizard session - search by sessionId (not PK id)
    const session = await this.wizardSessionRepo.findOne({
      where: { sessionId: wizardSessionId, userId: customerId },
    });

    if (!session) {
      throw new NotFoundException(
        `Wizard session not found: ${wizardSessionId}`,
      );
    }

    // Create generation task - use session.id (PK) for foreign key
    const task = this.generationTaskRepo.create({
      wizardSessionId: session.id,
      customerId,
      status: GenerationTaskStatus.PENDING,
      progress: 0,
      currentStep: 'Initializing generation...',
    });

    await this.generationTaskRepo.save(task);

    // Start generation in background (don't await)
    this.generateSite(task.id, session).catch((error) => {
      this.logger.error(`Generation failed for task ${task.id}:`, error);
      this.updateTaskError(task.id, error.message);
    });

    return task;
  }

  /**
   * Main generation workflow - calls V1 migrated script
   */
  private async generateSite(
    taskId: string,
    session: WizardSession,
  ): Promise<void> {
    try {
      // Step 1: Validate wizard data (10%)
      await this.updateTaskProgress(taskId, 10, 'Validating wizard data...');
      this.validateWizardData(session.wizardData);

      // Step 2: Generate site ID (15%)
      await this.updateTaskProgress(
        taskId,
        15,
        'Generating site identifier...',
      );
      // Support both V2 (step0.businessName) and V1 (siteName entity field)
      const businessName =
        session.wizardData?.step0?.businessName ||
        session.siteName ||
        'website';
      const baseSiteId = this.wizardDataMapper.generateSiteId(businessName);

      // Ensure uniqueness - check database and filesystem (Issue #140-4)
      const siteId = await this.ensureUniqueSiteId(baseSiteId);

      if (siteId !== baseSiteId) {
        this.logger.log(
          `Site ID adjusted for uniqueness: ${baseSiteId} → ${siteId}`,
        );
      }

      await this.generationTaskRepo.update(taskId, { siteId });

      // Step 3: Transform wizardData to V1 site-config.json (25%)
      await this.updateTaskProgress(
        taskId,
        25,
        'Transforming configuration...',
      );
      const siteConfig =
        await this.wizardDataMapper.transformToSiteConfig(session);

      // Step 4: Save config to logen-site-configs/{siteId}/ (30%)
      await this.updateTaskProgress(taskId, 30, 'Saving site configuration...');
      const configDir = `/var/apps/logen/logen-site-configs/${siteId}`;
      await fs.mkdir(configDir, { recursive: true });
      await fs.writeFile(
        path.join(configDir, 'site-config.json'),
        JSON.stringify(siteConfig, null, 2),
        'utf-8',
      );

      // Step 4.5: Copy wizard session images to site-config assets (35%)
      await this.updateTaskProgress(
        taskId,
        35,
        'Copying images to site config...',
      );
      await this.copyWizardImagesToSiteConfig(
        session.id,
        configDir,
        session.wizardData,
      );

      // Step 5: Call generation script (40% - 90%)
      await this.updateTaskProgress(
        taskId,
        40,
        'Running site generation script...',
      );
      const scriptPath = '/var/apps/logen/apps/site-generator/bin/generate.sh';
      const command = `bash ${scriptPath} ${siteId} --build --docker`; // Use bash not sh for proper syntax support

      this.logger.log(`Executing: ${command}`);

      const { stdout, stderr } = await execAsync(command, {
        cwd: '/var/apps/logen', // Script needs access to full logen directory
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
        shell: '/bin/bash', // Alpine image only has bash, not sh
      });

      this.logger.log(`Generation script output:\n${stdout}`);
      if (stderr) {
        this.logger.warn(`Generation script warnings:\n${stderr}`);
      }

      // Step 6: Extract deployment port from config (92%)
      await this.updateTaskProgress(
        taskId,
        92,
        'Preparing container deployment...',
      );
      const deploymentPort = await this.getDeploymentPort(siteId);

      // Step 7: Deploy Docker container (90%)
      await this.updateTaskProgress(
        taskId,
        90,
        'Deploying Docker container...',
      );
      const containerName = this.domainManagementService.generateContainerName(
        session.siteName,
        session.sessionId,
      );
      await this.deployDockerContainer(siteId, deploymentPort, containerName);

      // Step 8: Create domain and Nginx config (94%)
      await this.updateTaskProgress(taskId, 94, 'Configuring domain...');
      const domain = await this.createDomainForSite(
        session,
        deploymentPort,
        session.userId,
      );

      const siteUrl = `https://${domain}`;

      // Update task with deployment info
      await this.generationTaskRepo.update(taskId, {
        port: deploymentPort,
        siteUrl: siteUrl,
      });

      // Step 9: Update customer_site (98%)
      await this.updateTaskProgress(taskId, 98, 'Finalizing deployment...');
      await this.updateCustomerSite(session, siteId, deploymentPort, siteUrl);

      // Step 9.5: Update wizard session deployment status (Issue #168 Phase 1)
      await this.wizardSessionRepo.update(
        { id: session.id },
        {
          deploymentStatus: 'deployed',
          lastDeployedAt: new Date(),
          siteUrl: siteUrl,
        },
      );
      this.logger.log(
        `✅ Updated wizard session deployment status: deployed (${siteUrl})`,
      );

      // Step 10: Complete (100%)
      await this.updateTaskProgress(
        taskId,
        100,
        'Site generation completed!',
        GenerationTaskStatus.COMPLETED,
      );

      this.logger.log(
        `Site generation completed successfully for ${siteId} on port ${deploymentPort}`,
      );
    } catch (error) {
      this.logger.error('Site generation failed:', error);
      await this.updateTaskError(taskId, error.message);
      throw error;
    }
  }

  /**
   * Create domain for the site
   * Extracts subdomain from wizard data and creates domain record + Nginx config
   */
  private async createDomainForSite(
    session: WizardSession,
    deploymentPort: number,
    userId: string,
  ): Promise<string> {
    try {
      // Extract subdomain from wizard data domain field
      const fullDomain = session.wizardData?.domain || session.domain;

      if (!fullDomain) {
        this.logger.warn(
          'No domain found in wizard data, skipping domain creation',
        );
        return `162.55.213.90:${deploymentPort}`; // Return fallback URL
      }

      // Extract subdomain prefix (remove .logen.locod-ai.com)
      const subdomain = fullDomain.replace('.logen.locod-ai.com', '');

      this.logger.log(`Creating domain: ${subdomain}.logen.locod-ai.com`);

      // Create domain using DomainManagementService
      const siteDomain = await this.domainManagementService.createSubdomain(
        session.sessionId,
        subdomain,
        userId,
      );

      this.logger.log(`✅ Domain created and activated: ${siteDomain.domain}`);
      return siteDomain.domain;
    } catch (error) {
      this.logger.error(`Failed to create domain: ${error.message}`);
      // Don't throw - allow site generation to complete even if domain creation fails
      // User can manually configure domain later
      return `162.55.213.90:${deploymentPort}`; // Return fallback URL
    }
  }

  /**
   * Get deployment port from site config
   */
  private async getDeploymentPort(siteId: string): Promise<number> {
    try {
      const configPath = `/var/apps/logen/logen-site-configs/${siteId}/site-config.json`;
      const configContent = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configContent);

      const port = config.deployment?.port || 3000;
      this.logger.log(`Extracted deployment port from config: ${port}`);
      return port;
    } catch (error) {
      this.logger.warn(
        `Could not read deployment port from config: ${error.message}. Using default 3000`,
      );
      return 3000;
    }
  }

  /**
   * Deploy Docker container for generated site
   * Similar to V1's quick-deploy.sh container deployment
   */
  private async deployDockerContainer(
    siteId: string,
    port: number,
    containerName: string,
  ): Promise<void> {
    const imageName = `${siteId}-website`;

    this.logger.log(
      `Deploying Docker container: ${containerName} on port ${port}`,
    );

    try {
      // Stop and remove existing container if any
      this.logger.log('Cleaning up existing container...');
      try {
        await execAsync(`docker stop ${containerName}`, { timeout: 10000 });
      } catch (e) {
        // Container may not exist, ignore
      }
      try {
        await execAsync(`docker rm ${containerName}`, { timeout: 10000 });
      } catch (e) {
        // Container may not exist, ignore
      }

      // Run new container on logen-network so nginx-reverse can proxy to it
      this.logger.log(`Starting container on logen-network...`);
      const dockerRunCmd = `docker run -d --name ${containerName} --network logen-network --restart unless-stopped ${imageName}`;

      const { stdout } = await execAsync(dockerRunCmd, {
        timeout: 30000,
      });

      this.logger.log(`Docker container started: ${stdout.trim()}`);

      // Wait 2 seconds and verify container is running
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const { stdout: psOutput } = await execAsync(
        `docker ps | grep ${containerName}`,
      );

      if (psOutput.includes(containerName)) {
        this.logger.log(
          `✅ Container ${containerName} deployed successfully on logen-network`,
        );
      } else {
        throw new Error(
          `Container ${containerName} not found in running containers`,
        );
      }
    } catch (error) {
      this.logger.error(`Docker deployment failed: ${error.message}`);

      // Try to get container logs for debugging
      try {
        const { stdout: logs } = await execAsync(
          `docker logs ${containerName}`,
          { timeout: 5000 },
        );
        this.logger.error(`Container logs:\n${logs}`);
      } catch (logError) {
        // Ignore log retrieval errors
      }

      throw new Error(`Failed to deploy Docker container: ${error.message}`);
    }
  }

  /**
   * Parse deployment port from generation script output (DEPRECATED - kept for reference)
   */
  private parsePortFromOutput(output: string): number {
    // Look for port in output (format: "Port: 3001" or similar)
    const portMatch =
      output.match(/Port:\s*(\d+)/i) ||
      output.match(/port\s*(\d+)/i) ||
      output.match(/:(\d{4})/);

    if (portMatch && portMatch[1]) {
      return parseInt(portMatch[1], 10);
    }

    // Default fallback - find next available port (3000-3100 range)
    this.logger.warn('Could not parse port from output, using default 3000');
    return 3000;
  }

  /**
   * Update generation task progress
   */
  private async updateTaskProgress(
    taskId: string,
    progress: number,
    currentStep: string,
    status: GenerationTaskStatus = GenerationTaskStatus.IN_PROGRESS,
  ): Promise<void> {
    const updateData: any = {
      progress,
      currentStep,
      status,
    };

    if (progress === 0 || !(await this.hasStarted(taskId))) {
      updateData.startedAt = new Date();
    }

    if (
      status === GenerationTaskStatus.COMPLETED ||
      status === GenerationTaskStatus.FAILED
    ) {
      updateData.completedAt = new Date();
    }

    await this.generationTaskRepo.update(taskId, updateData);
    this.logger.debug(`Task ${taskId}: ${progress}% - ${currentStep}`);
  }

  /**
   * Update task with error
   */
  private async updateTaskError(
    taskId: string,
    errorMessage: string,
  ): Promise<void> {
    await this.generationTaskRepo.update(taskId, {
      status: GenerationTaskStatus.FAILED,
      error: errorMessage,
      completedAt: new Date(),
    });
  }

  /**
   * Check if task has started
   */
  private async hasStarted(taskId: string): Promise<boolean> {
    const task = await this.generationTaskRepo.findOne({
      where: { id: taskId },
    });
    return !!task?.startedAt;
  }

  /**
   * Update customer_site with generation results
   */
  private async updateCustomerSite(
    session: WizardSession,
    siteId: string,
    deploymentPort: number,
    _webhookUrl: string | null, // Unused - script handles N8N
  ): Promise<void> {
    // Find or create customer_site
    let site = await this.customerSiteRepo.findOne({
      where: { currentWizardSessionId: session.id },
    });

    if (!site) {
      site = this.customerSiteRepo.create({
        customerId: session.userId,
        name: session.wizardData?.step0?.businessName || 'Website',
        domain: `${siteId}.locod-ai.com`,
        businessType: session.wizardData?.step0?.businessType,
        status: SiteStatus.COMPLETED,
      });
    }

    // Update with generation results
    site.siteId = siteId;
    site.status = SiteStatus.DEPLOYED;
    site.siteConfig = session.wizardData;
    site.deployedAt = new Date();
    site.deploymentPort = deploymentPort;
    site.deploymentUrl = `http://${siteId}.locod-ai.com`;

    await this.customerSiteRepo.save(site);
  }

  /**
   * Copy wizard session images from public/uploads/sessions to logen-site-configs assets
   * Images are stored at: /app/public/uploads/sessions/{sessionId}/{filename}
   * Need to copy to: /var/apps/logen/logen-site-configs/{siteId}/assets/{filename}
   */
  private async copyWizardImagesToSiteConfig(
    sessionId: string,
    configDir: string,
    wizardData: any,
  ): Promise<void> {
    try {
      // Create assets directory
      const assetsDir = path.join(configDir, 'assets');
      await fs.mkdir(assetsDir, { recursive: true });

      // Source directory for wizard images
      const sessionImagesDir = path.join(
        process.cwd(),
        'public',
        'uploads',
        'sessions',
        sessionId,
      );

      // Check if session images directory exists
      try {
        await fs.access(sessionImagesDir);
      } catch (error) {
        this.logger.warn(
          `Session images directory not found: ${sessionImagesDir}. Skipping image copy.`,
        );
        return;
      }

      // Get all image paths from wizardData
      const imagePaths = this.extractAllImagePaths(wizardData);
      this.logger.log(
        `Found ${imagePaths.length} images to copy from wizard session`,
      );

      let copiedCount = 0;
      let errorCount = 0;

      // Copy each image
      for (const imagePath of imagePaths) {
        try {
          // Extract filename from path (remove /uploads/sessions/{sessionId}/ and ?t= query)
          const filename = imagePath.split('/').pop()?.split('?')[0];
          if (!filename) continue;

          const sourcePath = path.join(sessionImagesDir, filename);
          const destPath = path.join(assetsDir, filename);

          // Check if source file exists
          try {
            await fs.access(sourcePath);
          } catch {
            this.logger.warn(`Source image not found: ${sourcePath}`);
            errorCount++;
            continue;
          }

          // Copy the file
          await fs.copyFile(sourcePath, destPath);
          copiedCount++;
          this.logger.debug(`Copied image: ${filename}`);
        } catch (error) {
          this.logger.warn(
            `Failed to copy image ${imagePath}: ${error.message}`,
          );
          errorCount++;
        }
      }

      this.logger.log(
        `Image copy completed: ${copiedCount} successful, ${errorCount} errors`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to copy wizard images: ${error.message}. Generation will continue with placeholders.`,
      );
      // Don't throw - allow generation to continue even if image copy fails
    }
  }

  /**
   * Extract all image paths from wizard data (both V1 and V2 formats)
   */
  private extractAllImagePaths(wizardData: any): string[] {
    const imagePaths: string[] = [];

    // V1 format: images object at root
    if (wizardData.images) {
      Object.values(wizardData.images).forEach((path: any) => {
        if (typeof path === 'string' && path.startsWith('/uploads/sessions/')) {
          imagePaths.push(path);
        }
      });
    }

    // V2 format: step-based images
    if (wizardData.step1?.logo) imagePaths.push(wizardData.step1.logo);
    if (wizardData.step1?.logoLight)
      imagePaths.push(wizardData.step1.logoLight);
    if (wizardData.step1?.logoDark) imagePaths.push(wizardData.step1.logoDark);
    if (wizardData.step3?.hero?.image)
      imagePaths.push(wizardData.step3.hero.image);
    if (wizardData.step3?.about?.image)
      imagePaths.push(wizardData.step3.about.image);
    if (wizardData.step5?.favicon) imagePaths.push(wizardData.step5.favicon);
    if (wizardData.step5?.images?.hero)
      imagePaths.push(wizardData.step5.images.hero);
    if (wizardData.step5?.images?.about)
      imagePaths.push(wizardData.step5.images.about);
    if (wizardData.step5?.images?.services) {
      wizardData.step5.images.services.forEach((img: string) => {
        if (img) imagePaths.push(img);
      });
    }

    // Filter to only include wizard session images
    return imagePaths.filter(
      (path) => path && path.startsWith('/uploads/sessions/'),
    );
  }

  /**
   * Validate wizard data completeness
   * Supports both V1 (flat) and V2 (step-based) formats
   */
  private validateWizardData(wizardData: any): void {
    // Check if we have V2 format (step-based) or V1 format (flat)
    const isV2Format = wizardData?.step0 !== undefined;

    if (isV2Format) {
      // V2 format validation
      if (!wizardData?.step0?.businessName) {
        throw new Error('Business name is required (step0.businessName)');
      }
      if (!wizardData?.step0?.businessType) {
        throw new Error('Business type is required (step0.businessType)');
      }
    } else {
      // V1 format validation - minimal check
      if (!wizardData?.hero?.title && !wizardData?.about?.title) {
        throw new Error('Hero or About title is required for V1 format');
      }
    }

    // Additional common validations
    this.logger.log(
      `Wizard data format detected: ${isV2Format ? 'V2 (step-based)' : 'V1 (flat)'}`,
    );
  }

  /**
   * Get generation task status
   */
  async getTaskStatus(taskId: string): Promise<GenerationTask> {
    const task = await this.generationTaskRepo.findOne({
      where: { id: taskId },
    });
    if (!task) {
      throw new NotFoundException('Generation task not found');
    }
    return task;
  }

  /**
   * Get active generation tasks for a customer
   */
  async getActiveTasksForCustomer(
    customerId: string,
  ): Promise<GenerationTask[]> {
    return this.generationTaskRepo.find({
      where: {
        customerId,
        status: GenerationTaskStatus.IN_PROGRESS,
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Ensure site ID is unique by checking both database and filesystem
   * If duplicate exists, append a number (-2, -3, etc.) until unique
   * Related: Issue #140-4 - Duplicate site name validation
   */
  private async ensureUniqueSiteId(baseSiteId: string): Promise<string> {
    let siteId = baseSiteId;
    let counter = 2;
    let isUnique = false;

    while (!isUnique) {
      // Check database for existing site with this siteId
      const existingInDb = await this.customerSiteRepo.findOne({
        where: { siteId },
      });

      // Check filesystem for existing site-config directory
      const configDir = `/var/apps/logen/logen-site-configs/${siteId}`;
      let existsInFilesystem = false;
      try {
        await fs.access(configDir);
        existsInFilesystem = true;
      } catch {
        existsInFilesystem = false;
      }

      // Check generated sites directory
      const generatedDir = `/var/apps/logen/logen-generated-sites/${siteId}`;
      let existsInGenerated = false;
      try {
        await fs.access(generatedDir);
        existsInGenerated = true;
      } catch {
        existsInGenerated = false;
      }

      if (!existingInDb && !existsInFilesystem && !existsInGenerated) {
        isUnique = true;
        this.logger.log(`Site ID '${siteId}' is unique`);
      } else {
        this.logger.warn(
          `Site ID '${siteId}' already exists (DB: ${!!existingInDb}, Config: ${existsInFilesystem}, Generated: ${existsInGenerated}). Trying with suffix...`,
        );
        siteId = `${baseSiteId}-${counter}`;
        counter++;

        // Safety limit to prevent infinite loop
        if (counter > 100) {
          throw new Error(
            `Could not generate unique site ID after 100 attempts for base: ${baseSiteId}`,
          );
        }
      }
    }

    return siteId;
  }
}

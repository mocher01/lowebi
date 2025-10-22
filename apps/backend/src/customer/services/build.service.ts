import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';

const execAsync = promisify(exec);

/**
 * BuildService
 *
 * Handles React application build process:
 * 1. Install dependencies (npm install)
 * 2. Build production bundle (npm run build)
 * 3. Verify build output
 *
 * Related: Issue #137 - Step 7: Review & Site Generation
 */
@Injectable()
export class BuildService {
  private readonly logger = new Logger(BuildService.name);

  /**
   * Build React application
   */
  async buildSite(sitePath: string, siteId: string): Promise<void> {
    try {
      // Step 1: Install dependencies
      this.logger.log(`Installing dependencies for ${siteId}...`);
      await this.installDependencies(sitePath);

      // Step 2: Build production bundle
      this.logger.log(`Building production bundle for ${siteId}...`);
      await this.buildProduction(sitePath);

      // Step 3: Verify build output
      this.logger.log(`Verifying build output for ${siteId}...`);
      await this.verifyBuild(sitePath);

      this.logger.log(`Build completed successfully for ${siteId}`);
    } catch (error) {
      this.logger.error(`Build failed for ${siteId}:`, error);
      throw new Error(`Build failed: ${error.message}`);
    }
  }

  /**
   * Install npm dependencies
   */
  private async installDependencies(sitePath: string): Promise<void> {
    const { stdout, stderr } = await execAsync(
      'npm install --legacy-peer-deps',
      {
        cwd: sitePath,
        timeout: 300000, // 5 minutes timeout
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      },
    );

    if (stderr && !stderr.includes('npm WARN')) {
      this.logger.warn(`npm install warnings: ${stderr}`);
    }

    this.logger.debug('Dependencies installed successfully');
  }

  /**
   * Build production bundle
   */
  private async buildProduction(sitePath: string): Promise<void> {
    const { stdout, stderr } = await execAsync('npm run build', {
      cwd: sitePath,
      timeout: 600000, // 10 minutes timeout
      maxBuffer: 20 * 1024 * 1024, // 20MB buffer
      env: {
        ...process.env,
        NODE_ENV: 'production',
        CI: 'false', // Disable CI mode to allow warnings
      },
    });

    if (stderr && !stderr.includes('warning')) {
      this.logger.warn(`Build warnings: ${stderr}`);
    }

    this.logger.debug('Production build completed');
  }

  /**
   * Verify build output exists
   */
  private async verifyBuild(sitePath: string): Promise<void> {
    const distPath = join(sitePath, 'dist');

    try {
      const { stdout } = await execAsync(`ls -la "${distPath}"`, {
        cwd: sitePath,
      });

      if (!stdout.includes('index.html')) {
        throw new Error('Build output missing index.html');
      }

      this.logger.debug('Build verification passed');
    } catch (error) {
      throw new Error(`Build verification failed: ${error.message}`);
    }
  }

  /**
   * Get build output path
   */
  getBuildPath(sitePath: string): string {
    return join(sitePath, 'dist');
  }
}

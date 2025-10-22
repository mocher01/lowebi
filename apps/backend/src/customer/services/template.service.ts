import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * TemplateService
 *
 * Handles template copying and configuration injection:
 * 1. Copy template-basic from logen-templates to logen-generated-sites/{siteId}
 * 2. Copy site-config.json and assets from logen-site-configs/{siteId}
 * 3. Inject config into template
 *
 * Related: Issue #137 - Step 7: Review & Site Generation
 */
@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);
  private readonly templatesPath = '/var/apps/logen/logen-templates'; // Needs full logen mount
  private readonly configsPath = '/var/apps/logen/logen-site-configs';
  private readonly generatedSitesPath = '/var/apps/logen/logen-generated-sites';

  /**
   * Copy template and inject configuration
   */
  async prepareTemplate(siteId: string): Promise<string> {
    const sitePath = join(this.generatedSitesPath, siteId);
    const templateSource = join(this.templatesPath, 'template-basic');
    const configSource = join(this.configsPath, siteId);

    try {
      // Step 1: Check if template exists
      await this.ensureTemplateExists();

      // Step 2: Copy template to generated-sites
      await this.copyTemplate(templateSource, sitePath);
      this.logger.log(`Template copied to ${sitePath}`);

      // Step 3: Copy config and assets
      await this.copyConfigAndAssets(configSource, sitePath);
      this.logger.log(`Config and assets copied to ${sitePath}`);

      return sitePath;
    } catch (error) {
      this.logger.error(`Failed to prepare template for ${siteId}:`, error);
      throw new Error(`Template preparation failed: ${error.message}`);
    }
  }

  /**
   * Ensure template-basic exists in logen-templates
   */
  private async ensureTemplateExists(): Promise<void> {
    const templatePath = join(this.templatesPath, 'template-basic');

    try {
      await fs.access(templatePath);
    } catch {
      // Template doesn't exist, copy from legacy V1
      const legacyTemplatePath =
        '/var/apps/logen/legacy/v1-data/templates/template-basic';

      try {
        await fs.access(legacyTemplatePath);
        await this.copyDirectory(legacyTemplatePath, templatePath);
        this.logger.log('Copied template-basic from legacy V1');
      } catch {
        throw new Error(
          'Template not found. Please ensure template-basic exists in logen-templates or legacy/v1-data/templates',
        );
      }
    }
  }

  /**
   * Copy template directory
   */
  private async copyTemplate(source: string, dest: string): Promise<void> {
    // Remove destination if it exists
    await fs.rm(dest, { recursive: true, force: true });

    // Copy template
    await this.copyDirectory(source, dest);
  }

  /**
   * Copy config and assets from site-configs to generated site
   */
  private async copyConfigAndAssets(
    configSource: string,
    siteDest: string,
  ): Promise<void> {
    // Copy site-config.json to public/
    const configFile = join(configSource, 'site-config.json');
    const configDest = join(siteDest, 'public', 'config.json');

    await fs.copyFile(configFile, configDest);

    // Copy assets to public/assets/
    const assetsSource = join(configSource, 'assets');
    const assetsDest = join(siteDest, 'public', 'assets');

    try {
      await fs.access(assetsSource);
      await this.copyDirectory(assetsSource, assetsDest);
      this.logger.debug(`Copied assets from ${assetsSource} to ${assetsDest}`);
    } catch {
      this.logger.warn(`No assets directory found at ${assetsSource}`);
    }
  }

  /**
   * Copy directory recursively using cp command (faster than Node.js)
   */
  private async copyDirectory(source: string, dest: string): Promise<void> {
    try {
      await execAsync(`cp -r "${source}" "${dest}"`);
    } catch (error) {
      throw new Error(`Failed to copy directory: ${error.message}`);
    }
  }

  /**
   * Get site path
   */
  getSitePath(siteId: string): string {
    return join(this.generatedSitesPath, siteId);
  }

  /**
   * Delete generated site (cleanup on failure)
   */
  async deleteSite(siteId: string): Promise<void> {
    const sitePath = join(this.generatedSitesPath, siteId);
    try {
      await fs.rm(sitePath, { recursive: true, force: true });
      this.logger.log(`Deleted generated site: ${sitePath}`);
    } catch (error) {
      this.logger.warn(`Failed to delete site ${siteId}:`, error.message);
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { copyFile, mkdir } from 'fs/promises';

/**
 * ConfigStorageService
 *
 * Handles storage of site configuration and assets in the V1 directory structure:
 * - /var/apps/logen/logen-site-configs/{siteId}/site-config.json
 * - /var/apps/logen/logen-site-configs/{siteId}/assets/*
 *
 * Related: Issue #137 - Step 7: Review & Site Generation
 */
@Injectable()
export class ConfigStorageService {
  private readonly logger = new Logger(ConfigStorageService.name);
  private readonly configsBasePath = '/var/apps/logen/logen-site-configs';
  private readonly publicAssetsPath = '/app/public';

  /**
   * Save site configuration to logen-site-configs/{siteId}/
   */
  async saveSiteConfig(siteId: string, config: any): Promise<string> {
    const configDir = join(this.configsBasePath, siteId);
    const configPath = join(configDir, 'site-config.json');

    try {
      // Create config directory if it doesn't exist
      await mkdir(configDir, { recursive: true });

      // Write config file
      await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');

      this.logger.log(`Site config saved: ${configPath}`);
      return configPath;
    } catch (error) {
      this.logger.error(`Failed to save site config for ${siteId}:`, error);
      throw new Error(`Failed to save site configuration: ${error.message}`);
    }
  }

  /**
   * Copy assets from public directory to site-configs/{siteId}/assets/
   */
  async copyAssets(siteId: string, imageUrls: string[]): Promise<string[]> {
    const assetsDir = join(this.configsBasePath, siteId, 'assets');
    const copiedAssets: string[] = [];

    try {
      // Create assets directory
      await mkdir(assetsDir, { recursive: true });

      // Copy each image
      for (const url of imageUrls) {
        if (!url || !url.startsWith('/')) {
          continue;
        }

        const filename = url.split('/').pop();
        if (!filename) continue;

        const sourcePath = join(this.publicAssetsPath, url);
        const destPath = join(assetsDir, filename);

        try {
          await copyFile(sourcePath, destPath);
          copiedAssets.push(filename);
          this.logger.debug(`Copied asset: ${filename}`);
        } catch (error) {
          this.logger.warn(`Failed to copy asset ${filename}:`, error.message);
          // Continue with other assets even if one fails
        }
      }

      this.logger.log(`Copied ${copiedAssets.length} assets for ${siteId}`);
      return copiedAssets;
    } catch (error) {
      this.logger.error(`Failed to copy assets for ${siteId}:`, error);
      throw new Error(`Failed to copy assets: ${error.message}`);
    }
  }

  /**
   * Check if site config directory exists
   */
  async configExists(siteId: string): Promise<boolean> {
    const configPath = join(this.configsBasePath, siteId, 'site-config.json');
    try {
      await fs.access(configPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get site config path
   */
  getConfigPath(siteId: string): string {
    return join(this.configsBasePath, siteId, 'site-config.json');
  }

  /**
   * Get assets directory path
   */
  getAssetsPath(siteId: string): string {
    return join(this.configsBasePath, siteId, 'assets');
  }

  /**
   * Delete site config and assets (cleanup on failure)
   */
  async deleteSiteConfig(siteId: string): Promise<void> {
    const configDir = join(this.configsBasePath, siteId);
    try {
      await fs.rm(configDir, { recursive: true, force: true });
      this.logger.log(`Deleted site config: ${configDir}`);
    } catch (error) {
      this.logger.warn(
        `Failed to delete site config ${siteId}:`,
        error.message,
      );
    }
  }
}

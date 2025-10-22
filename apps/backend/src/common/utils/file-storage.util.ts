import * as fs from 'fs';
import * as path from 'path';
import { BadRequestException } from '@nestjs/common';

export interface SavedImageResult {
  publicUrl: string;
  filePath: string;
  filename: string;
  mime: string;
}

export class FileStorageUtil {
  /**
   * Save a base64 data URL to disk and return public URL
   */
  static async saveDataUrl(
    dataUrl: string,
    requestId: number,
    filename: string,
  ): Promise<SavedImageResult> {
    // Validate data URL format
    const dataUrlMatch = /^data:(.+?);base64,(.+)$/.exec(dataUrl);
    if (!dataUrlMatch) {
      throw new BadRequestException('Invalid data URL format');
    }

    const [, mimeType, base64Data] = dataUrlMatch;

    // Validate image mime type
    if (!mimeType.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Validate file size (10MB max)
    if (buffer.length > 10 * 1024 * 1024) {
      throw new BadRequestException('File too large (max 10MB)');
    }

    // Create safe filename
    const safeFilename = this.sanitizeFilename(filename);

    // Create directory structure: public/uploads/requests/:requestId/
    const uploadDir = path.join(
      process.cwd(),
      'public',
      'uploads',
      'requests',
      String(requestId),
    );

    // Ensure directory exists
    await fs.promises.mkdir(uploadDir, { recursive: true });

    // Full file path
    const filePath = path.join(uploadDir, safeFilename);

    // Save file to disk
    await fs.promises.writeFile(filePath, buffer);

    // Generate public URL (accessible via nginx/static serving)
    const publicUrl = `/uploads/requests/${requestId}/${safeFilename}`;

    return {
      publicUrl,
      filePath,
      filename: safeFilename,
      mime: mimeType,
    };
  }

  /**
   * Delete an uploaded file
   */
  static async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      // File might not exist, ignore error
      console.warn(`Failed to delete file ${filePath}:`, error.message);
    }
  }

  /**
   * Clean up all draft images for a request
   */
  static async cleanupRequestImages(requestId: number): Promise<void> {
    const uploadDir = path.join(
      process.cwd(),
      'public',
      'uploads',
      'requests',
      String(requestId),
    );

    try {
      await fs.promises.rm(uploadDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(
        `Failed to cleanup images for request ${requestId}:`,
        error.message,
      );
    }
  }

  /**
   * Sanitize filename for safe storage
   */
  private static sanitizeFilename(filename: string): string {
    // Remove/replace dangerous characters
    const sanitized = filename
      .replace(/[^a-zA-Z0-9.\-_]/g, '_') // Replace special chars with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
      .toLowerCase();

    // Ensure it has an extension
    if (!sanitized.includes('.')) {
      return `${sanitized}.png`;
    }

    return sanitized;
  }

  /**
   * Get file extension from mime type
   */
  static getExtensionFromMime(mimeType: string): string {
    const mimeMap = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
    };

    return mimeMap[mimeType] || 'png';
  }

  /**
   * Save a base64 data URL to disk for a wizard session and return public URL
   */
  static async saveSessionDataUrl(
    dataUrl: string,
    sessionId: string,
    filename: string,
  ): Promise<SavedImageResult> {
    // Validate data URL format
    const dataUrlMatch = /^data:(.+?);base64,(.+)$/.exec(dataUrl);
    if (!dataUrlMatch) {
      throw new BadRequestException('Invalid data URL format');
    }

    const [, mimeType, base64Data] = dataUrlMatch;

    // Validate image mime type
    if (!mimeType.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Validate file size (10MB max)
    if (buffer.length > 10 * 1024 * 1024) {
      throw new BadRequestException('File too large (max 10MB)');
    }

    // Create safe filename
    const safeFilename = this.sanitizeFilename(filename);

    // Create directory structure: public/uploads/sessions/:sessionId/
    const uploadDir = path.join(
      process.cwd(),
      'public',
      'uploads',
      'sessions',
      sessionId,
    );

    // Ensure directory exists
    await fs.promises.mkdir(uploadDir, { recursive: true });

    // Full file path
    const filePath = path.join(uploadDir, safeFilename);

    // Save file to disk
    await fs.promises.writeFile(filePath, buffer);

    // Generate public URL (accessible via nginx/static serving)
    const publicUrl = `/uploads/sessions/${sessionId}/${safeFilename}`;

    return {
      publicUrl,
      filePath,
      filename: safeFilename,
      mime: mimeType,
    };
  }

  /**
   * Clean up all images for a wizard session
   */
  static async cleanupSessionImages(sessionId: string): Promise<void> {
    const uploadDir = path.join(
      process.cwd(),
      'public',
      'uploads',
      'sessions',
      sessionId,
    );

    try {
      await fs.promises.rm(uploadDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(
        `Failed to cleanup images for session ${sessionId}:`,
        error.message,
      );
    }
  }

  /**
   * Ensure uploads directory exists
   */
  static async ensureUploadsDirectory(): Promise<void> {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.promises.mkdir(uploadsDir, { recursive: true });

    const requestsDir = path.join(uploadsDir, 'requests');
    await fs.promises.mkdir(requestsDir, { recursive: true });

    const sessionsDir = path.join(uploadsDir, 'sessions');
    await fs.promises.mkdir(sessionsDir, { recursive: true });
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WizardSession,
  WizardSessionStatus,
} from '../entities/wizard-session.entity';
import { SiteDomain } from '../entities/site-domain.entity';
import { FileStorageUtil } from '../../common/utils/file-storage.util';

export interface CreateWizardSessionDto {
  siteName?: string;
  domain?: string;
  businessType?: string;
  businessDescription?: string;
  wizardData?: any;
  aiRequests?: any;
  currentStep?: number;
  data?: any; // Support frontend format with nested data
}

export interface UpdateWizardSessionDto {
  siteName?: string;
  domain?: string;
  currentStep?: number;
  businessType?: string;
  wizardData?: any;
  aiRequests?: any;
  status?: WizardSessionStatus;
}

@Injectable()
export class WizardSessionService {
  constructor(
    @InjectRepository(WizardSession)
    private wizardSessionRepository: Repository<WizardSession>,
    @InjectRepository(SiteDomain)
    private siteDomainRepository: Repository<SiteDomain>,
  ) {}

  /**
   * Get all wizard sessions for a user
   * TEMP FIX: Also include recent anonymous sessions for testing
   * NOTE: This method does NOT update lastAccessedAt - use getSession() for that
   */
  async getUserSessions(userId: string): Promise<WizardSession[]> {
    console.log(
      `📋 [getUserSessions] Getting sessions for user: ${userId} (no timestamp update)`,
    );

    // Get user's authenticated sessions - show ALL sessions regardless of status
    const userSessions = await this.wizardSessionRepository.find({
      where: {
        userId,
        // Removed status filter - show all sessions (active, in_progress, etc.)
      },
      order: { lastAccessedAt: 'DESC' },
    });

    // TEMP FIX: Also get recent anonymous sessions (created in last 24 hours)
    // This allows users to see wizard sessions they created before logging in
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const recentAnonymousSessions = await this.wizardSessionRepository
      .createQueryBuilder('session')
      .where("session.user_id::text LIKE 'temp_%'")
      // Removed status filter - show all anonymous sessions
      .andWhere('session.createdAt > :oneDayAgo', { oneDayAgo })
      .orderBy('session.lastAccessedAt', 'DESC')
      .getMany();

    // Combine and deduplicate sessions
    const allSessions = [...userSessions, ...recentAnonymousSessions];

    // Remove duplicates by sessionId and sort by last accessed
    const uniqueSessions = allSessions
      .filter(
        (session, index, arr) =>
          arr.findIndex((s) => s.sessionId === session.sessionId) === index,
      )
      .sort((a, b) => b.lastAccessedAt.getTime() - a.lastAccessedAt.getTime());

    console.log(
      `📋 [getUserSessions] Found ${uniqueSessions.length} sessions (timestamps NOT updated)`,
    );
    return uniqueSessions;
  }

  /**
   * Get a specific session by sessionId and userId
   * Supports both UUID (id field) and session_id string
   */
  async getSession(sessionId: string, userId: string): Promise<WizardSession> {
    console.log(`🔍 [getSession] ========================================`);
    console.log(
      `🔍 [getSession] CALLED: sessionId="${sessionId}", userId="${userId}"`,
    );
    console.log(
      `🔍 [getSession] Timestamp BEFORE update: ${new Date().toISOString()}`,
    );
    console.log(
      `🔍 [getSession] Call stack:`,
      new Error().stack?.split('\n').slice(1, 4).join('\n'),
    );

    // Check if sessionId is a UUID (contains dashes) - if so, search by id field
    const isUuid = sessionId.includes('-');
    const whereClause: any = isUuid
      ? { id: sessionId, userId }
      : { sessionId, userId };

    console.log(
      `🔍 [getSession] Searching by: ${isUuid ? 'id (UUID)' : 'sessionId (string)'}`,
    );

    const session = await this.wizardSessionRepository.findOne({
      where: whereClause,
    });

    if (!session) {
      throw new NotFoundException(`Wizard session not found: ${sessionId}`);
    }

    console.log(`🔍 [getSession] Found session:`, {
      sessionId: session.sessionId,
      siteName: session.siteName,
      id: session.id,
      currentStep: session.currentStep,
    });

    // Update last accessed time using direct SQL to avoid JSONB data loss
    const updateQuery = isUuid
      ? 'id = :sessionId AND userId = :userId'
      : 'sessionId = :sessionId AND userId = :userId';

    const updateResult = await this.wizardSessionRepository
      .createQueryBuilder()
      .update()
      .set({ lastAccessedAt: new Date() })
      .where(updateQuery, {
        sessionId,
        userId,
      })
      .execute();

    console.log(
      `🔍 [getSession] UPDATE RESULT: affected rows = ${updateResult.affected}`,
    );
    console.log(
      `🔍 [getSession] Timestamp AFTER update: ${new Date().toISOString()}`,
    );
    console.log(`🔍 [getSession] ========================================\n`);

    return session;
  }

  /**
   * Create a new wizard session
   */
  async createSession(
    userId: string,
    sessionId: string,
    createDto: CreateWizardSessionDto,
  ): Promise<WizardSession> {
    // Check if session already exists
    const existingSession = await this.wizardSessionRepository.findOne({
      where: { sessionId },
    });

    if (existingSession) {
      throw new BadRequestException(`Session already exists: ${sessionId}`);
    }

    // Check for duplicate site name if provided
    if (createDto.siteName) {
      const duplicate = await this.checkDuplicateSiteName(
        createDto.siteName,
        userId,
      );

      if (duplicate) {
        // Generate suggestion for alternative name
        const suggestion = await this.generateUniqueSiteId(
          createDto.siteName,
          userId,
        );
        throw new BadRequestException(
          `Un site avec le nom "${createDto.siteName}" existe déjà. Veuillez utiliser "${suggestion}" ou choisir un autre nom.`,
        );
      }
    }

    const currentStep = createDto.currentStep || 0;

    const session = this.wizardSessionRepository.create({
      userId,
      sessionId,
      siteName: createDto.siteName,
      domain:
        createDto.domain ||
        `${createDto.siteName?.toLowerCase().replace(/\s+/g, '') || 'untitled'}.logen.app`,
      businessType: createDto.businessType,
      wizardData: createDto.wizardData || {},
      currentStep,
      progressPercentage: Math.round(((currentStep + 1) / 7) * 100), // Dynamic progress based on step
      aiRequests: createDto.aiRequests || {},
      status: WizardSessionStatus.ACTIVE,
    });

    const savedSession = await this.wizardSessionRepository.save(session);

    console.log(`✅ Created wizard session: ${sessionId} for user: ${userId}`);
    return savedSession;
  }

  /**
   * Update an existing wizard session
   */
  async updateSession(
    sessionId: string,
    userId: string,
    updateDto: UpdateWizardSessionDto,
  ): Promise<WizardSession> {
    console.log(`📝 [updateSession] ========================================`);
    console.log(
      `📝 [updateSession] CALLED: sessionId="${sessionId}", userId="${userId}"`,
    );
    console.log(`📝 [updateSession] Update data:`, {
      hasSiteName: updateDto.siteName !== undefined,
      hasDomain: updateDto.domain !== undefined,
      hasCurrentStep: updateDto.currentStep !== undefined,
      hasWizardData: updateDto.wizardData !== undefined,
      hasStep6OAuth:
        updateDto.wizardData?.step6?.emailConfig?.oauth !== undefined,
    });
    if (updateDto.wizardData?.step6?.emailConfig?.oauth) {
      console.log(
        `📝 [updateSession] OAuth data being saved:`,
        updateDto.wizardData.step6.emailConfig.oauth,
      );
    }

    const session = await this.getSession(sessionId, userId);

    console.log(`📝 [updateSession] Current session before update:`, {
      sessionId: session.sessionId,
      siteName: session.siteName,
      id: session.id,
      hasOAuthInData:
        session.wizardData?.step6?.emailConfig?.oauth !== undefined,
    });

    // Check for duplicate site name if being changed
    if (
      updateDto.siteName !== undefined &&
      updateDto.siteName !== session.siteName
    ) {
      const duplicate = await this.checkDuplicateSiteName(
        updateDto.siteName,
        userId,
        sessionId, // Exclude current session
      );

      if (duplicate) {
        // Generate suggestion for alternative name
        const suggestion = await this.generateUniqueSiteId(
          updateDto.siteName,
          userId,
        );
        throw new BadRequestException(
          `Un site avec le nom "${updateDto.siteName}" existe déjà. Veuillez utiliser "${suggestion}" ou choisir un autre nom.`,
        );
      }
    }

    // Update fields
    if (updateDto.siteName !== undefined) session.siteName = updateDto.siteName;
    if (updateDto.domain !== undefined) session.domain = updateDto.domain;
    if (updateDto.currentStep !== undefined) {
      session.currentStep = updateDto.currentStep;
      session.updateProgress(); // Recalculate progress
    }
    if (updateDto.businessType !== undefined)
      session.businessType = updateDto.businessType;
    if (updateDto.wizardData !== undefined) {
      session.wizardData = { ...session.wizardData, ...updateDto.wizardData };
    }
    if (updateDto.aiRequests !== undefined) {
      session.aiRequests = { ...session.aiRequests, ...updateDto.aiRequests };
    }
    if (updateDto.status !== undefined) session.status = updateDto.status;

    session.lastAccessedAt = new Date();

    const updatedSession = await this.wizardSessionRepository.save(session);

    console.log(`📝 [updateSession] Session AFTER update:`, {
      sessionId: updatedSession.sessionId,
      siteName: updatedSession.siteName,
      id: updatedSession.id,
      step: updatedSession.currentStep,
      hasOAuthInData:
        updatedSession.wizardData?.step6?.emailConfig?.oauth !== undefined,
    });
    if (updatedSession.wizardData?.step6?.emailConfig?.oauth) {
      console.log(
        `📝 [updateSession] OAuth data AFTER save:`,
        updatedSession.wizardData.step6.emailConfig.oauth,
      );
    }
    console.log(
      `📝 [updateSession] ========================================\n`,
    );

    return updatedSession;
  }

  /**
   * Delete a wizard session with full cleanup
   * - Stops Docker container if running
   * - Removes generated site files
   * - Deletes session from database
   */
  async deleteSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.getSession(sessionId, userId);
    const siteName = session.siteName || 'unknown';

    console.log(`🗑️ Starting deletion of session: ${sessionId} (${siteName})`);

    try {
      // Step 1: Stop and remove Docker container if it exists
      const containerName = `${siteName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}-site`;
      console.log(`🐳 Attempting to stop Docker container: ${containerName}`);

      const { execSync } = require('child_process');

      try {
        // Check if container exists
        const containerExists = execSync(
          `docker ps -a --format '{{.Names}}' | grep -w ${containerName}`,
          { encoding: 'utf8' },
        ).trim();

        if (containerExists) {
          console.log(
            `🐳 Container found: ${containerName}, stopping and removing...`,
          );

          // Stop the container if running
          try {
            execSync(`docker stop ${containerName}`, {
              encoding: 'utf8',
              stdio: 'pipe',
            });
            console.log(`✅ Stopped container: ${containerName}`);
          } catch (stopError) {
            console.log(
              `⚠️ Container ${containerName} was not running or already stopped`,
            );
          }

          // Remove the container
          try {
            execSync(`docker rm ${containerName}`, {
              encoding: 'utf8',
              stdio: 'pipe',
            });
            console.log(`✅ Removed container: ${containerName}`);
          } catch (rmError) {
            console.log(
              `⚠️ Could not remove container ${containerName}:`,
              rmError.message,
            );
          }
        } else {
          console.log(`ℹ️ No Docker container found for: ${containerName}`);
        }
      } catch (dockerError) {
        // Container doesn't exist or docker command failed - not critical
        console.log(
          `ℹ️ Docker cleanup skipped for ${containerName}: ${dockerError.message}`,
        );
      }

      // Step 2: Remove generated site files
      const fs = require('fs');
      const path = require('path');

      // Try common paths for generated sites
      const possiblePaths = [
        `/var/apps/logen-generated-sites/${siteName}`,
        `/var/apps/logen/logen-generated-sites/${siteName}`,
        `/tmp/logen-generated-sites/${siteName}`,
      ];

      for (const sitePath of possiblePaths) {
        try {
          if (fs.existsSync(sitePath)) {
            console.log(`📁 Removing generated site files at: ${sitePath}`);
            fs.rmSync(sitePath, { recursive: true, force: true });
            console.log(`✅ Removed site files: ${sitePath}`);
          }
        } catch (fileError) {
          console.log(
            `⚠️ Could not remove files at ${sitePath}:`,
            fileError.message,
          );
        }
      }

      // Step 3: Delete from database
      await this.wizardSessionRepository.remove(session);
      console.log(`✅ Deleted session from database: ${sessionId}`);

      console.log(
        `🎉 Successfully deleted session: ${sessionId} (${siteName})`,
      );
    } catch (error) {
      console.error(`❌ Error during session deletion:`, error);
      throw error;
    }
  }

  /**
   * Mark session as completed
   */
  async completeSession(
    sessionId: string,
    userId: string,
  ): Promise<WizardSession> {
    return this.updateSession(sessionId, userId, {
      status: WizardSessionStatus.COMPLETED,
      currentStep: 6, // Final step
    });
  }

  /**
   * Apply AI-generated content to wizard session (V1-matching functionality)
   */
  async applyAiContent(
    wizardSessionId: string,
    requestType: string,
    generatedContent: any,
  ): Promise<WizardSession> {
    console.log(`🚨🚨🚨 APPLY AI CONTENT CALLED - NEW CODE RUNNING 🚨🚨🚨`);
    const callId = Date.now().toString().slice(-6);
    console.log(`🔍 [${callId}] === BLOG DEBUG START ===`);
    console.log(
      `🔍 [${callId}] STEP 1 - INPUT blog exists: ${!!generatedContent?.blog}`,
    );
    console.log(
      `🔍 [${callId}] STEP 1 - INPUT blog articles: ${generatedContent?.blog?.articles?.length || 0}`,
    );

    // Find session by UUID (not session_id string) - AI queue passes wizard_session_id (UUID)
    const session = await this.wizardSessionRepository.findOne({
      where: { id: wizardSessionId },
    });

    console.log(
      `🔍 [${callId}] STEP 2 - EXISTING blog articles: ${session?.wizardData?.blog?.articles?.length || 0}`,
    );

    if (!session) {
      throw new NotFoundException(
        `Wizard session not found: ${wizardSessionId}`,
      );
    }

    // V1-style content application - merge generated content into wizard data
    const updatedWizardData = { ...session.wizardData };

    console.log(
      `🔧 Applying AI content type '${requestType}' to session ${wizardSessionId}`,
    );
    console.log(
      '🔍 CALL STACK:',
      new Error().stack?.split('\n').slice(1, 5).join('\n'),
    );
    console.log(
      'Generated content:',
      JSON.stringify(generatedContent, null, 2),
    );

    // Apply content based on request type (V1 used single 'content' type)
    if (requestType === 'content' || requestType === 'services') {
      // V1 approach: directly apply all generated content fields
      if (generatedContent.services) {
        updatedWizardData.services = generatedContent.services;
        console.log(
          `✅ Applied ${generatedContent.services.length} services to wizard data`,
        );
      }

      // Apply other content types if present
      if (generatedContent.hero) updatedWizardData.hero = generatedContent.hero;
      if (generatedContent.about)
        updatedWizardData.about = generatedContent.about;
      if (generatedContent.testimonials)
        updatedWizardData.testimonials = generatedContent.testimonials;
      if (generatedContent.faq) updatedWizardData.faq = generatedContent.faq;
      // CRITICAL FIX: Only apply blog if new content has blog, otherwise preserve existing
      console.log(
        `🔍 [${callId}] BLOG LOGIC - generatedContent.blog exists: ${!!generatedContent.blog}`,
      );
      console.log(
        `🔍 [${callId}] BLOG LOGIC - generatedContent.blog.articles exists: ${!!generatedContent.blog?.articles}`,
      );
      console.log(
        `🔍 [${callId}] BLOG LOGIC - generatedContent.blog.articles.length: ${generatedContent.blog?.articles?.length || 0}`,
      );
      console.log(
        `🔍 [${callId}] BLOG LOGIC - updatedWizardData.blog exists: ${!!updatedWizardData.blog}`,
      );
      console.log(
        `🔍 [${callId}] BLOG LOGIC - updatedWizardData.blog.articles.length: ${updatedWizardData.blog?.articles?.length || 0}`,
      );

      if (
        generatedContent.blog &&
        generatedContent.blog.articles &&
        generatedContent.blog.articles.length > 0
      ) {
        console.log(
          `🔍 [${callId}] ✅ APPLYING blog with ${generatedContent.blog.articles.length} articles`,
        );
        updatedWizardData.blog = generatedContent.blog;
      } else if (!updatedWizardData.blog) {
        console.log(`🔍 [${callId}] ℹ️ INITIALIZING empty blog structure`);
        updatedWizardData.blog = { articles: [] };
      } else {
        console.log(
          `🔍 [${callId}] 🔒 PRESERVING existing blog with ${updatedWizardData.blog?.articles?.length || 0} articles`,
        );
      }
      if (generatedContent.seo) updatedWizardData.seo = generatedContent.seo;
    } else if (requestType === 'images') {
      console.log(
        `🖼️ [IMAGE DEBUG] Applying AI-generated images to wizard session`,
      );
      console.log(
        `🖼️ [IMAGE DEBUG] Raw generatedContent type: ${typeof generatedContent}`,
      );
      console.log(
        `🖼️ [IMAGE DEBUG] Raw generatedContent (first 200 chars): ${JSON.stringify(generatedContent).substring(0, 200)}...`,
      );

      // CRITICAL: Log blog.articles BEFORE processing images
      console.log(
        `🔍 [${callId}] 🚨 BEFORE IMAGE PROCESSING: blog.articles = ${updatedWizardData?.blog?.articles?.length || 0}`,
      );
      console.log(
        `🔍 [${callId}] 🚨 BEFORE IMAGE PROCESSING: blog exists = ${!!updatedWizardData?.blog}`,
      );
      console.log(
        `🔍 [${callId}] 🚨 BEFORE IMAGE PROCESSING: services = ${updatedWizardData?.services?.length || 0}`,
      );

      try {
        const imageData =
          typeof generatedContent === 'string'
            ? JSON.parse(generatedContent)
            : generatedContent;

        console.log(
          `🖼️ [IMAGE DEBUG] Parsed imageData keys: ${Object.keys(imageData)}`,
        );
        console.log(
          `🖼️ [IMAGE DEBUG] Parsed imageData structure:`,
          JSON.stringify(imageData, null, 2),
        );

        if (!updatedWizardData.images) {
          updatedWizardData.images = {};
          console.log(
            `🖼️ [IMAGE DEBUG] Created new images object in wizard data`,
          );
        } else {
          console.log(
            `🖼️ [IMAGE DEBUG] Existing images object found in wizard data`,
          );
        }

        let appliedCount = 0;
        Object.keys(imageData).forEach((imageType) => {
          const imageInfo = imageData[imageType];
          console.log(
            `🖼️ [IMAGE DEBUG] Processing imageType: ${imageType}, has data: ${!!imageInfo?.data}, filename: ${imageInfo?.filename}`,
          );

          if (imageInfo && imageInfo.data) {
            // V2.1: Support server-persisted images from imagesDraft
            let imageUrl;
            if (imageInfo.data.startsWith('/uploads/')) {
              // Server path from imagesDraft - keep as-is for frontend to fetch
              imageUrl = imageInfo.data;
              console.log(`🔄 [V2.1] Using persisted server path: ${imageUrl}`);
            } else if (imageInfo.data.startsWith('data:')) {
              // Already in data URL format
              imageUrl = imageInfo.data;
            } else {
              // Convert base64 to data URL
              imageUrl = `data:image/png;base64,${imageInfo.data}`;
            }

            // CRITICAL FIX: Store image in format expected by frontend
            // Frontend expects: wizardData.images.hero = "data:image/png;base64,..." OR "/uploads/requests/..."
            // Not: wizardData.images.hero = { data: "...", filename: "..." }
            updatedWizardData.images[imageType] = imageUrl;

            console.log(
              `✅ [IMAGE DEBUG] Applied image: ${imageType} -> ${imageInfo.filename} (format: ${imageUrl.startsWith('/uploads/') ? 'server-path' : imageUrl.startsWith('data:') ? 'data-url' : 'base64-converted'})`,
            );
            appliedCount++;
          } else {
            console.log(
              `⚠️ [IMAGE DEBUG] Skipped imageType: ${imageType} - missing data or invalid structure`,
            );
          }
        });

        console.log(
          `✅ [IMAGE DEBUG] Applied ${appliedCount}/${Object.keys(imageData).length} images to wizard data`,
        );
        console.log(
          `✅ [IMAGE DEBUG] Final updatedWizardData.images keys: ${Object.keys(updatedWizardData.images || {})}`,
        );

        // CRITICAL: Log blog.articles AFTER processing images
        console.log(
          `🔍 [${callId}] 🚨 AFTER IMAGE PROCESSING: blog.articles = ${updatedWizardData?.blog?.articles?.length || 0}`,
        );
        console.log(
          `🔍 [${callId}] 🚨 AFTER IMAGE PROCESSING: blog exists = ${!!updatedWizardData?.blog}`,
        );
        console.log(
          `🔍 [${callId}] 🚨 AFTER IMAGE PROCESSING: services = ${updatedWizardData?.services?.length || 0}`,
        );

        // SAFEGUARD: Ensure blog structure is preserved if it existed
        if (!updatedWizardData.blog && session.wizardData?.blog) {
          console.log(
            `🔧 [${callId}] 🚨 RESTORING blog from session.wizardData!`,
          );
          updatedWizardData.blog = session.wizardData.blog;
        }
      } catch (error) {
        console.error(`❌ [IMAGE DEBUG] Error applying images:`, error);
        console.error(`❌ [IMAGE DEBUG] Error stack:`, error.stack);
        throw error;
      }
    }

    // Force TypeORM to detect JSONB changes by using direct SQL update
    console.log(
      `🔍 [${callId}] STEP 6 - BEFORE DB SAVE: ${updatedWizardData?.blog?.articles?.length || 0} articles`,
    );

    const updateResult = await this.wizardSessionRepository
      .createQueryBuilder()
      .update()
      .set({
        wizardData: updatedWizardData,
        updatedAt: () => 'CURRENT_TIMESTAMP',
        lastAccessedAt: () => 'CURRENT_TIMESTAMP',
      })
      .where('id = :id', { id: wizardSessionId })
      .execute();

    console.log(
      `🔍 [${callId}] STEP 7 - DB SAVE affected rows: ${updateResult.affected}`,
    );

    console.log(
      `🔧 Database update result: affected rows = ${updateResult.affected}`,
    );

    // Verify the update worked by re-fetching the session
    const verifySession = await this.wizardSessionRepository.findOne({
      where: { id: wizardSessionId },
    });

    console.log(
      `🔍 [${callId}] STEP 8 - AFTER DB READ: ${verifySession?.wizardData?.blog?.articles?.length || 0} articles`,
    );

    if (verifySession?.wizardData?.services) {
      console.log(
        `✅ VERIFIED: ${verifySession.wizardData.services.length} services now in database`,
      );
    } else {
      console.error(
        '❌ VERIFICATION FAILED: Services not found in database after update',
      );
    }

    if (verifySession?.wizardData?.blog?.articles?.length) {
      console.log(
        `🔍 [${callId}] FINAL: ✅ SUCCESS - ${verifySession.wizardData.blog.articles.length} blog articles verified`,
      );
    } else {
      console.log(
        `🔍 [${callId}] FINAL: ❌ FAILED - Blog articles lost during save`,
      );
    }

    console.log(`🔍 [${callId}] === BLOG DEBUG END ===`);
    console.log(`✅ AI content applied to wizard session ${wizardSessionId}`);
    return verifySession || session;
  }

  /**
   * Clean up old abandoned sessions (can be called periodically)
   */
  async cleanupOldSessions(): Promise<number> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const result = await this.wizardSessionRepository.update(
      {
        lastAccessedAt: { $lt: oneWeekAgo } as any,
        status: WizardSessionStatus.ACTIVE,
      },
      {
        status: WizardSessionStatus.ABANDONED,
      },
    );

    console.log(`🧹 Marked ${result.affected} old sessions as abandoned`);
    return result.affected || 0;
  }

  /**
   * MAINTENANCE: Fix all sessions with incorrect progress values
   * This method recalculates progress for all sessions based on currentStep
   */
  async fixAllProgressValues(): Promise<number> {
    console.log('🔧 Starting progress value fix for all sessions...');

    const allSessions = await this.wizardSessionRepository.find({
      where: { status: WizardSessionStatus.ACTIVE },
    });

    let fixedCount = 0;

    for (const session of allSessions) {
      const expectedProgress = Math.round(
        ((session.currentStep + 1) / 7) * 100,
      );

      if (session.progressPercentage !== expectedProgress) {
        console.log(
          `🔧 Fixing session ${session.sessionId}: Step ${session.currentStep}, Progress ${session.progressPercentage}% → ${expectedProgress}%`,
        );

        session.progressPercentage = expectedProgress;
        session.lastAccessedAt = new Date();

        await this.wizardSessionRepository.save(session);
        fixedCount++;
      }
    }

    console.log(
      `✅ Fixed ${fixedCount} sessions with incorrect progress values`,
    );
    return fixedCount;
  }

  /**
   * Save an image for a wizard session
   */
  async saveSessionImage(
    sessionId: string,
    userId: string,
    imageRole: string,
    filename: string,
    dataUrl: string,
  ): Promise<{ ok: boolean; image: any; session: WizardSession }> {
    const session = await this.getSession(sessionId, userId);

    // Save file to disk and get public URL
    const savedImage = await FileStorageUtil.saveSessionDataUrl(
      dataUrl,
      sessionId,
      filename,
    );

    console.log(
      `💾 Saved session image: ${imageRole} -> ${savedImage.publicUrl}`,
    );

    // Update wizardData.images with the new image path
    const updatedWizardData = { ...session.wizardData };
    if (!updatedWizardData.images) {
      updatedWizardData.images = {};
    }

    // Store the public URL in the appropriate field
    updatedWizardData.images[imageRole] = savedImage.publicUrl;

    // Update session with new image data
    await this.wizardSessionRepository
      .createQueryBuilder()
      .update()
      .set({
        wizardData: updatedWizardData,
        updatedAt: new Date(),
      })
      .where('sessionId = :sessionId AND userId = :userId', {
        sessionId,
        userId,
      })
      .execute();

    // Fetch updated session
    const updatedSession = await this.getSession(sessionId, userId);

    return {
      ok: true,
      image: {
        role: imageRole,
        url: savedImage.publicUrl,
        filename: savedImage.filename,
      },
      session: updatedSession,
    };
  }

  /**
   * Get all images for a wizard session
   */
  async getSessionImages(
    sessionId: string,
    userId: string,
  ): Promise<Record<string, string>> {
    const session = await this.getSession(sessionId, userId);
    const images = session.wizardData?.images || {};
    console.log(
      `🖼️ [getSessionImages] Returning ${Object.keys(images).length} images:`,
      Object.keys(images),
    );
    return images;
  }

  /**
   * Generate a unique site identifier based on business name
   * If the name already exists for this user, adds a numeric suffix (nomsite-1, nomsite-2, etc.)
   */
  async generateUniqueSiteId(
    businessName: string,
    userId?: string,
  ): Promise<string> {
    if (!businessName) {
      businessName = 'site';
    }

    // Generate base site ID from business name
    const baseSiteId = businessName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .slice(0, 30); // Limit length

    // Check if base name is available for this user
    const whereClause: any = { siteName: baseSiteId };
    if (userId) {
      whereClause.userId = userId;
    }

    const existingSession = await this.wizardSessionRepository.findOne({
      where: whereClause,
    });

    if (!existingSession) {
      console.log(
        `✅ Generated unique site ID: ${baseSiteId}${userId ? ` for user ${userId}` : ''}`,
      );
      return baseSiteId;
    }

    // Base name exists, find the next available number
    let counter = 1;
    let uniqueSiteId = `${baseSiteId}-${counter}`;

    while (counter <= 999) {
      // Safety limit
      const whereClauseCounter: any = { siteName: uniqueSiteId };
      if (userId) {
        whereClauseCounter.userId = userId;
      }

      const exists = await this.wizardSessionRepository.findOne({
        where: whereClauseCounter,
      });

      if (!exists) {
        console.log(
          `✅ Generated unique site ID with suffix: ${uniqueSiteId}${userId ? ` for user ${userId}` : ''}`,
        );
        return uniqueSiteId;
      }

      counter++;
      uniqueSiteId = `${baseSiteId}-${counter}`;
    }

    // Fallback if we somehow exhaust the counter
    const fallbackId = `${baseSiteId}-${Date.now().toString().slice(-6)}`;
    console.log(`⚠️ Using fallback site ID: ${fallbackId}`);
    return fallbackId;
  }

  /**
   * Check if a site name already exists for a user
   * Returns existing session if found, null otherwise
   */
  async checkDuplicateSiteName(
    siteName: string,
    userId: string,
    excludeSessionId?: string,
  ): Promise<WizardSession | null> {
    const whereClause: any = {
      siteName,
      userId,
    };

    const existingSessions = await this.wizardSessionRepository.find({
      where: whereClause,
    });

    // Filter out the current session if we're updating
    const duplicates = existingSessions.filter(
      (session) => session.sessionId !== excludeSessionId,
    );

    if (duplicates.length > 0) {
      console.log(
        `⚠️ Duplicate site name detected: "${siteName}" for user ${userId}`,
      );
      return duplicates[0];
    }

    return null;
  }

  /**
   * Restart the Docker container for a deployed site
   * Phase 1: Site Admin Operations
   */
  async restartSiteContainer(
    sessionId: string,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    // Get session and validate ownership
    const session = await this.wizardSessionRepository.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Site not found');
    }

    // Check if site is deployed
    if (session.deploymentStatus !== 'deployed') {
      throw new BadRequestException(
        `Site is not deployed (status: ${session.deploymentStatus})`,
      );
    }

    // Get the actual container name from site_domains table
    const siteDomain = await this.siteDomainRepository.findOne({
      where: { wizardSessionId: session.id },
      order: { createdAt: 'DESC' },
    });

    if (!siteDomain || !siteDomain.containerName) {
      throw new NotFoundException(
        `No container found for site: ${session.siteName}`,
      );
    }

    const containerName = siteDomain.containerName;

    console.log(`🔄 Attempting to restart Docker container: ${containerName}`);

    try {
      const { execSync } = require('child_process');

      // Check if container exists
      try {
        const containerExists = execSync(
          `docker ps -a --format '{{.Names}}' | grep -w ${containerName}`,
          { encoding: 'utf8' },
        ).trim();

        if (!containerExists) {
          throw new NotFoundException(
            `Docker container not found: ${containerName}`,
          );
        }
      } catch (grepError) {
        throw new NotFoundException(
          `Docker container not found: ${containerName}`,
        );
      }

      // Restart the container
      execSync(`docker restart ${containerName}`, {
        encoding: 'utf8',
        stdio: 'pipe',
      });

      console.log(`✅ Successfully restarted container: ${containerName}`);

      return {
        success: true,
        message: `Container ${containerName} restarted successfully`,
      };
    } catch (error) {
      console.error(`❌ Error restarting container ${containerName}:`, error);

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new BadRequestException(
        `Failed to restart container: ${error.message}`,
      );
    }
  }

  /**
   * Retrieve Docker container logs for a deployed site
   * Phase 1: Site Admin Operations
   */
  async getSiteContainerLogs(
    sessionId: string,
    userId: string,
    lines: number = 100,
  ): Promise<{ logs: string[]; timestamp: Date }> {
    // Get session and validate ownership
    const session = await this.wizardSessionRepository.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Site not found');
    }

    // Check if site is deployed
    if (session.deploymentStatus !== 'deployed') {
      throw new BadRequestException(
        `Site is not deployed (status: ${session.deploymentStatus})`,
      );
    }

    // Get the actual container name from site_domains table
    const siteDomain = await this.siteDomainRepository.findOne({
      where: { wizardSessionId: session.id },
      order: { createdAt: 'DESC' },
    });

    if (!siteDomain || !siteDomain.containerName) {
      throw new NotFoundException(
        `No container found for site: ${session.siteName}`,
      );
    }

    const containerName = siteDomain.containerName;

    console.log(
      `📋 Retrieving ${lines} log lines from container: ${containerName}`,
    );

    try {
      const { execSync } = require('child_process');

      // Check if container exists
      try {
        const containerExists = execSync(
          `docker ps -a --format '{{.Names}}' | grep -w ${containerName}`,
          { encoding: 'utf8' },
        ).trim();

        if (!containerExists) {
          throw new NotFoundException(
            `Docker container not found: ${containerName}`,
          );
        }
      } catch (grepError) {
        throw new NotFoundException(
          `Docker container not found: ${containerName}`,
        );
      }

      // Get container logs
      const logOutput = execSync(
        `docker logs --tail ${lines} ${containerName}`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
        },
      );

      // Split logs into array of lines
      const logLines = logOutput
        .split('\n')
        .filter((line) => line.trim() !== '');

      console.log(
        `✅ Retrieved ${logLines.length} log lines from ${containerName}`,
      );

      return {
        logs: logLines,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error(`❌ Error retrieving logs from ${containerName}:`, error);

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new BadRequestException(
        `Failed to retrieve container logs: ${error.message}`,
      );
    }
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { Public } from '../../auth/decorators/public.decorator';
import { WizardSessionService } from '../services/wizard-session.service';
import type {
  CreateWizardSessionDto,
  UpdateWizardSessionDto,
} from '../services/wizard-session.service';

@Controller('customer/wizard-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
@Throttle({ default: { limit: 15, ttl: 10000 } }) // 15 requests per 10 seconds for wizard operations
export class WizardSessionController {
  constructor(private readonly wizardSessionService: WizardSessionService) {}

  /**
   * GET /customer/wizard-sessions
   * Get all wizard sessions for the authenticated user
   */
  @Get()
  async getUserSessions(@Request() req) {
    const sessions = await this.wizardSessionService.getUserSessions(
      req.user.id,
    );
    return {
      success: true,
      sessions: sessions.map((session) => session.toDto()),
    };
  }

  /**
   * GET /customer/wizard-sessions/:sessionId
   * Get a specific wizard session
   */
  @Get(':sessionId')
  async getSession(@Param('sessionId') sessionId: string, @Request() req) {
    const session = await this.wizardSessionService.getSession(
      sessionId,
      req.user.id,
    );
    return {
      success: true,
      session: session,
    };
  }

  /**
   * POST /customer/wizard-sessions/check-duplicate
   * Check if a site name already exists for the authenticated user
   * IMPORTANT: Must come BEFORE :sessionId route to avoid route conflicts
   */
  @Post('check-duplicate')
  async checkDuplicateSiteName(
    @Body() body: { siteName: string; excludeSessionId?: string },
    @Request() req,
  ) {
    const { siteName, excludeSessionId } = body;

    if (!siteName || siteName.trim().length < 2) {
      return {
        success: false,
        error: 'Site name must be at least 2 characters long',
      };
    }

    const duplicate = await this.wizardSessionService.checkDuplicateSiteName(
      siteName.trim(),
      req.user.id,
      excludeSessionId,
    );

    if (duplicate) {
      // Generate suggestion
      const suggestion = await this.wizardSessionService.generateUniqueSiteId(
        siteName.trim(),
        req.user.id,
      );

      return {
        success: false,
        isDuplicate: true,
        message: `A site with the name "${siteName}" already exists.`,
        suggestion,
      };
    }

    return {
      success: true,
      isDuplicate: false,
      message: 'Site name is available',
    };
  }

  /**
   * POST /customer/wizard-sessions/:sessionId
   * Create a new wizard session
   */
  @Post(':sessionId')
  @HttpCode(HttpStatus.CREATED)
  async createSession(
    @Param('sessionId') sessionId: string,
    @Body() createDto: CreateWizardSessionDto,
    @Request() req,
  ) {
    const session = await this.wizardSessionService.createSession(
      req.user.id,
      sessionId,
      createDto,
    );

    return {
      success: true,
      session: session.toDto(),
      message: 'Wizard session created successfully',
    };
  }

  /**
   * PUT /customer/wizard-sessions/:sessionId
   * Update a wizard session
   */
  @Put(':sessionId')
  async updateSession(
    @Param('sessionId') sessionId: string,
    @Body() updateDto: UpdateWizardSessionDto,
    @Request() req,
  ) {
    const session = await this.wizardSessionService.updateSession(
      sessionId,
      req.user.id,
      updateDto,
    );

    return {
      success: true,
      session: session.toDto(),
      message: 'Wizard session updated successfully',
    };
  }

  /**
   * PUT /customer/wizard-sessions/:sessionId/complete
   * Mark session as completed
   */
  @Put(':sessionId/complete')
  async completeSession(@Param('sessionId') sessionId: string, @Request() req) {
    const session = await this.wizardSessionService.completeSession(
      sessionId,
      req.user.id,
    );

    return {
      success: true,
      session: session.toDto(),
      message: 'Wizard session completed successfully',
    };
  }

  /**
   * DELETE /customer/wizard-sessions/:sessionId
   * Delete a wizard session
   */
  @Delete(':sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSession(@Param('sessionId') sessionId: string, @Request() req) {
    await this.wizardSessionService.deleteSession(sessionId, req.user.id);

    return {
      success: true,
      message: 'Wizard session deleted successfully',
    };
  }

  /**
   * POST /customer/wizard-sessions/cleanup
   * Clean up old abandoned sessions (admin or scheduled task)
   */
  @Post('cleanup')
  async cleanupOldSessions() {
    const count = await this.wizardSessionService.cleanupOldSessions();

    return {
      success: true,
      message: `Cleaned up ${count} old sessions`,
      count,
    };
  }

  /**
   * POST /customer/wizard-sessions/fix-progress
   * MAINTENANCE: Fix all sessions with incorrect progress values
   */
  @Post('fix-progress')
  async fixAllProgressValues(@Request() req) {
    const count = await this.wizardSessionService.fixAllProgressValues();

    return {
      success: true,
      message: `Fixed ${count} sessions with incorrect progress values`,
      count,
    };
  }

  /**
   * POST /customer/wizard-sessions/:sessionId/images
   * Upload an image for a wizard session
   */
  @Post(':sessionId/images')
  async uploadSessionImage(
    @Param('sessionId') sessionId: string,
    @Body() body: { role: string; filename: string; dataUrl: string },
    @Request() req,
  ) {
    const { role, filename, dataUrl } = body;

    if (!role || !filename || !dataUrl) {
      return {
        success: false,
        error: 'Missing required fields: role, filename, dataUrl',
      };
    }

    const result = await this.wizardSessionService.saveSessionImage(
      sessionId,
      req.user.id,
      role,
      filename,
      dataUrl,
    );

    return {
      success: true,
      image: result.image,
      message: 'Image uploaded successfully',
    };
  }

  /**
   * GET /customer/wizard-sessions/:sessionId/images
   * Get all images for a wizard session
   */
  @Get(':sessionId/images')
  async getSessionImages(
    @Param('sessionId') sessionId: string,
    @Request() req,
  ) {
    const images = await this.wizardSessionService.getSessionImages(
      sessionId,
      req.user.id,
    );

    return {
      success: true,
      images,
    };
  }

  /**
   * POST /customer/wizard-sessions/generate-site-id
   * Generate a unique site identifier based on business name (per user)
   */
  @Post('generate-site-id')
  async generateUniqueSiteId(
    @Body() body: { businessName: string },
    @Request() req,
  ) {
    const { businessName } = body;

    if (!businessName || businessName.trim().length < 2) {
      return {
        success: false,
        error: 'Business name must be at least 2 characters long',
      };
    }

    const uniqueSiteId = await this.wizardSessionService.generateUniqueSiteId(
      businessName.trim(),
      req.user.id, // Pass user ID for per-user uniqueness
    );

    return {
      success: true,
      siteId: uniqueSiteId,
    };
  }
}

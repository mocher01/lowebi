import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../auth/decorators/public.decorator';
import { OAuth2Service } from '../../auth/services/oauth2.service';
import { WizardSession } from '../entities/wizard-session.entity';

@Controller('customer/oauth2')
export class OAuth2Controller {
  constructor(
    private oauth2Service: OAuth2Service,
    @InjectRepository(WizardSession)
    private wizardSessionRepository: Repository<WizardSession>,
  ) {}

  /**
   * Initiate Google OAuth2 flow
   * GET /customer/oauth2/authorize?wizardSessionId=xxx
   *
   * NOTE: This endpoint is intentionally NOT protected by JwtAuthGuard
   * because it's accessed via browser redirect (window.location.href)
   * which doesn't include Authorization headers. The wizardSessionId
   * is validated in the callback instead.
   */
  @Public()
  @Get('authorize')
  authorize(
    @Query('wizardSessionId') wizardSessionId: string,
    @Res() res: Response,
  ) {
    if (!wizardSessionId) {
      throw new BadRequestException('wizardSessionId is required');
    }

    // Store wizardSessionId in state parameter to retrieve after callback
    const state = JSON.stringify({ wizardSessionId });
    const authUrl = this.oauth2Service.getGoogleAuthUrl(state);

    // Redirect to Google OAuth consent screen
    return res.redirect(authUrl);
  }

  /**
   * Google OAuth2 callback endpoint
   * GET /customer/oauth2/callback?code=xxx&state=xxx
   */
  @Public()
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!code) {
      throw new BadRequestException('Authorization code is required');
    }

    try {
      // Parse state to get wizardSessionId
      const { wizardSessionId } = JSON.parse(state || '{}');
      console.log(
        '🔐 [OAuth Callback] Step 1: wizardSessionId from state:',
        wizardSessionId,
      );

      if (!wizardSessionId) {
        throw new BadRequestException('Invalid state: wizardSessionId missing');
      }

      // Get wizard session to extract userId
      const wizardSession = await this.wizardSessionRepository.findOne({
        where: { sessionId: wizardSessionId },
      });

      console.log('🔐 [OAuth Callback] Step 2: Found wizard session:', {
        sessionId: wizardSession?.sessionId,
        siteName: wizardSession?.siteName,
        id: wizardSession?.id,
        userId: wizardSession?.userId,
      });

      if (!wizardSession) {
        throw new BadRequestException('Wizard session not found');
      }

      const userId = wizardSession.userId;

      if (!userId) {
        throw new BadRequestException('User ID not found in wizard session');
      }

      // Exchange code for tokens and save credentials
      // Note: Pass wizardSession.id (UUID) not wizardSessionId (string)
      console.log(
        '🔐 [OAuth Callback] Step 3: Calling handleGoogleCallback with:',
        {
          userId,
          wizardSessionUUID: wizardSession.id,
          wizardSessionString: wizardSessionId,
        },
      );

      const credential = await this.oauth2Service.handleGoogleCallback(
        code,
        userId,
        wizardSession.id, // UUID instead of session_id string
      );

      console.log('🔐 [OAuth Callback] Step 4: OAuth credential saved:', {
        credentialId: credential.id,
        email: credential.email,
        wizardSessionId: wizardSession.id,
      });

      // Redirect back to frontend Advanced Features step (index 5) with success
      // CRITICAL: Use 'continue' parameter so frontend loads the session properly
      const frontendUrl =
        process.env.FRONTEND_URL || 'https://logen.locod-ai.com';
      const redirectUrl = `${frontendUrl}/wizard?continue=${wizardSessionId}&step=5&oauth2Status=success&credentialId=${credential.id}&email=${encodeURIComponent(credential.email)}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      console.error('OAuth2 callback error:', error);

      // Redirect back to frontend with error (Advanced Features step = index 5)
      const frontendUrl =
        process.env.FRONTEND_URL || 'https://logen.locod-ai.com';
      const redirectUrl = `${frontendUrl}/wizard?step=5&oauth2Status=error&message=${encodeURIComponent(error.message || 'Failed to connect Google account')}`;

      return res.redirect(redirectUrl);
    }
  }

  /**
   * Check OAuth2 connection status
   * GET /customer/oauth2/status?credentialId=xxx
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus(
    @Query('credentialId') credentialId: string,
    @Req() req: Request,
  ) {
    const userId = (req.user as any)?.userId;

    if (!credentialId) {
      return {
        connected: false,
        email: null,
      };
    }

    const credential = await this.oauth2Service.getCredential(
      credentialId,
      userId,
    );

    if (!credential || !credential.isActive) {
      return {
        connected: false,
        email: null,
      };
    }

    return {
      connected: true,
      email: credential.email,
      provider: credential.provider,
      expiresAt: credential.expiresAt,
    };
  }

  /**
   * Revoke OAuth2 connection
   * POST /customer/oauth2/revoke
   */
  @Post('revoke')
  @UseGuards(JwtAuthGuard)
  async revoke(
    @Query('credentialId') credentialId: string,
    @Req() req: Request,
  ) {
    const userId = (req.user as any)?.userId;

    if (!credentialId) {
      throw new BadRequestException('Credential ID is required');
    }

    await this.oauth2Service.revokeCredential(credentialId, userId);

    return {
      success: true,
      message: 'OAuth2 credential revoked successfully',
    };
  }
}

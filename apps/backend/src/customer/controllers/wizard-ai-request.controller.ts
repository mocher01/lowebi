import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  NotFoundException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { WizardSessionService } from '../services/wizard-session.service';
import { AiQueueService } from '../../admin/services/ai-queue.service';
import type { CreateAiRequestDto } from '../../admin/services/ai-queue.service';

@Controller('customer/wizard-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
@Throttle({ default: { limit: 15, ttl: 10000 } })
export class WizardAiRequestController {
  constructor(
    private readonly wizardSessionService: WizardSessionService,
    private readonly aiQueueService: AiQueueService,
  ) {}

  /**
   * POST /customer/wizard-sessions/:sessionId/ai-request
   * Create AI request for wizard session
   */
  @Post(':sessionId/ai-request')
  @HttpCode(HttpStatus.CREATED)
  async createAiRequest(
    @Param('sessionId') sessionId: string,
    @Body() createDto: { requestType: string; wizardData?: any },
    @Request() req,
  ) {
    // First verify the user owns this wizard session
    const session = await this.wizardSessionService.getSession(
      sessionId,
      req.user.id,
    );

    // Extract business description from wizardData for AI prompt
    const wizardData = createDto.wizardData || session.wizardData || {};
    const businessDescription = wizardData.businessDescription || '';

    // 🐛 Debug Bug #4 - Log what's being extracted
    console.log(`🔍 Bug #4 Debug - AI Request Creation:`);
    console.log(`   Session siteName: "${session.siteName}"`);
    console.log(`   Session businessType: "${session.businessType}"`);
    console.log(`   wizardData keys:`, Object.keys(wizardData));
    console.log(`   businessDescription extracted: "${businessDescription}"`);
    console.log(`   businessDescription length: ${businessDescription.length}`);
    console.log(`   Full wizardData:`, JSON.stringify(wizardData, null, 2));

    // Prepare AI request data based on wizard session
    const aiRequestData: CreateAiRequestDto = {
      customerId: req.user.id,
      siteId: undefined, // AI requests for wizard sessions don't need a specific site ID
      requestType: createDto.requestType as any,
      businessType: session.businessType || 'Unknown',
      terminology: wizardData.terminology || 'services',
      priority: 'normal' as any,
      requestData: {
        siteName: session.siteName,
        businessType: session.businessType,
        businessDescription: businessDescription, // ✅ Fix Bug #4: Include business description
        wizardData: wizardData,
        domain: session.domain,
        slogan: wizardData.slogan || '',
        city: wizardData.contact?.address || 'France',
      },
      wizardSessionId: session.id, // Use the UUID of the wizard session record
      estimatedCost: 2.5,
    };

    try {
      const aiRequest = await this.aiQueueService.createRequest(aiRequestData);

      return {
        success: true,
        requestId: aiRequest.id,
        status: aiRequest.status,
        requestType: aiRequest.requestType,
        message: 'AI request created successfully',
      };
    } catch (error) {
      console.error('Failed to create AI request:', error);
      throw error;
    }
  }

  /**
   * GET /customer/wizard-sessions/:sessionId/ai-request/:requestId/status
   * Get AI request status
   */
  @Get(':sessionId/ai-request/:requestId/status')
  async getAiRequestStatus(
    @Param('sessionId') sessionId: string,
    @Param('requestId') requestId: string,
    @Request() req,
  ) {
    // Verify user owns the wizard session
    const session = await this.wizardSessionService.getSession(
      sessionId,
      req.user.id,
    );

    // Get AI request details
    const aiRequest = await this.aiQueueService.getRequest(parseInt(requestId));

    // Verify the AI request belongs to this wizard session (compare UUIDs)
    if (aiRequest.wizardSessionId !== session.id) {
      throw new NotFoundException('AI request not found for this session');
    }

    // NOTE: Content is automatically applied by AI Queue when request is completed
    // No need to apply it again here to avoid duplicate applications

    return {
      success: true,
      status: aiRequest.status,
      requestType: aiRequest.requestType,
      createdAt: aiRequest.createdAt,
      completedAt: aiRequest.completedAt,
      generatedContent:
        aiRequest.status === 'completed' ? aiRequest.generatedContent : null,
    };
  }

  /**
   * DELETE /customer/wizard-sessions/:sessionId/ai-request/:requestId
   * Cancel/retry AI request
   */
  @Delete(':sessionId/ai-request/:requestId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelAiRequest(
    @Param('sessionId') sessionId: string,
    @Param('requestId') requestId: string,
    @Request() req,
  ) {
    // Verify user owns the wizard session
    const session = await this.wizardSessionService.getSession(
      sessionId,
      req.user.id,
    );

    // Get AI request details
    const aiRequest = await this.aiQueueService.getRequest(parseInt(requestId));

    // Verify the AI request belongs to this wizard session (compare UUIDs)
    if (aiRequest.wizardSessionId !== session.id) {
      throw new NotFoundException('AI request not found for this session');
    }

    // Only allow canceling pending/assigned requests
    if (['pending', 'assigned'].includes(aiRequest.status)) {
      await this.aiQueueService.rejectRequest(
        parseInt(requestId),
        req.user.id,
        'Cancelled by user for retry',
      );
    }

    return {
      success: true,
      message: 'AI request cancelled successfully',
    };
  }
}

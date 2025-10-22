import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Public } from '../../auth/decorators/public.decorator';
import { AiQueueService } from '../../admin/services/ai-queue.service';
import { WizardSession } from '../entities/wizard-session.entity';

@Controller('public/ai-requests')
export class PublicAiRequestController {
  constructor(
    private readonly aiQueueService: AiQueueService,
    @InjectRepository(WizardSession)
    private readonly wizardSessionRepository: Repository<WizardSession>,
  ) {}

  /**
   * POST /public/ai-requests
   * Create AI request for anonymous wizard users
   */
  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async createAiRequest(@Body() createDto: any) {
    // Look up wizard session by sessionId to get UUID
    let wizardSessionUuid: string | undefined;
    if (createDto.wizardSessionId) {
      const wizardSession = await this.wizardSessionRepository.findOne({
        where: { sessionId: createDto.wizardSessionId },
      });
      wizardSessionUuid = wizardSession?.id;
    }

    // Map wizard request to admin queue format
    const aiRequestData = {
      customerId: createDto.customerId, // Use provided customer ID (should be UUID)
      siteId:
        wizardSessionUuid || createDto.siteId || createDto.wizardSessionId, // Use wizard session UUID as site ID
      requestType: createDto.requestType || 'content',
      businessType:
        createDto.requestData?.businessType ||
        createDto.businessType ||
        'unknown',
      terminology:
        createDto.requestData?.terminology ||
        createDto.terminology ||
        'services',
      priority: createDto.priority || 'normal',
      requestData: {
        siteName: createDto.requestData?.siteName,
        businessType:
          createDto.requestData?.businessType || createDto.businessType,
        terminology:
          createDto.requestData?.terminology || createDto.terminology,
        ...createDto.requestData,
      },
      wizardSessionId: wizardSessionUuid,
      estimatedCost: createDto.estimatedCost || 2.5,
    };

    try {
      const result = await this.aiQueueService.createRequest(aiRequestData);

      return {
        success: true,
        id: result.id,
        status: result.status,
        requestType: result.requestType,
        estimatedCost: createDto.estimatedCost || 2.5,
        message: 'AI request created successfully',
      };
    } catch (error) {
      console.error('Failed to create AI request:', error);
      throw error;
    }
  }

  /**
   * GET /public/ai-requests/:id
   * Get AI request status for anonymous users
   */
  @Get(':id')
  @Public()
  async getAiRequest(@Param('id') id: string) {
    try {
      const request = await this.aiQueueService.getRequest(parseInt(id));

      if (!request) {
        throw new NotFoundException('AI request not found');
      }

      // Return only safe information for public access
      return {
        success: true,
        id: request.id,
        status: request.status,
        requestType: request.requestType,
        generatedContent: request.generatedContent,
        errorMessage: request.errorMessage,
        createdAt: request.createdAt,
        completedAt: request.completedAt,
        isPublic: true,
      };
    } catch (error) {
      console.error('Failed to get AI request:', error);
      throw error;
    }
  }

  /**
   * GET /public/ai-requests/site/:siteId/:requestType
   * Get AI request by site and type for wizard polling
   */
  @Get('site/:siteId/:requestType')
  @Public()
  async getAiRequestBysite(
    @Param('siteId') siteId: string,
    @Param('requestType') requestType: string,
  ) {
    try {
      // Find the most recent request for this site and type
      const requests = await this.aiQueueService.getRequestsBySite(siteId);
      const matchingRequest = requests
        .filter((req) => req.requestType === requestType)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

      if (!matchingRequest) {
        throw new NotFoundException(
          `No ${requestType} request found for site ${siteId}`,
        );
      }

      return {
        success: true,
        id: matchingRequest.id,
        status: matchingRequest.status,
        requestType: matchingRequest.requestType,
        generatedContent: matchingRequest.generatedContent,
        errorMessage: matchingRequest.errorMessage,
        createdAt: matchingRequest.createdAt,
        completedAt: matchingRequest.completedAt,
        isPublic: true,
      };
    } catch (error) {
      console.error('Failed to get AI request by site:', error);
      throw error;
    }
  }
}

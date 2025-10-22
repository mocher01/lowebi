import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { User } from '../../auth/entities/user.entity';
import { CustomerWizardService } from '../services/customer-wizard.service';
import {
  StartWizardDto,
  UpdateWizardSessionDto,
  CompleteWizardDto,
  WizardSessionResponseDto,
  BusinessInfoDto,
  TemplateSelectionDto,
  DesignPreferencesDto,
} from '../dto/customer-wizard.dto';

@ApiTags('Website Creation Wizard')
@Controller('customer/wizard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CustomerWizardController {
  constructor(private readonly customerWizardService: CustomerWizardService) {}

  @Post('start')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Start website creation wizard',
    description: 'Initialize a new website creation wizard session',
  })
  @ApiBody({ type: StartWizardDto, required: false })
  @ApiResponse({
    status: 201,
    description: 'Wizard session created successfully',
    type: WizardSessionResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Site limit reached for current plan',
  })
  async startWizard(
    @CurrentUser() user: User,
    @Body() startDto: StartWizardDto = {},
  ): Promise<WizardSessionResponseDto> {
    return this.customerWizardService.startWizard(user.id, startDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get wizard session',
    description: 'Retrieve current wizard session details',
  })
  @ApiParam({ name: 'id', description: 'Wizard session ID' })
  @ApiResponse({
    status: 200,
    description: 'Wizard session retrieved successfully',
    type: WizardSessionResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Wizard session not found',
  })
  async getWizardSession(
    @CurrentUser() user: User,
    @Param('id') sessionId: string,
  ): Promise<WizardSessionResponseDto> {
    return this.customerWizardService.getWizardSession(user.id, sessionId);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update wizard session',
    description: 'Update wizard session with step data',
  })
  @ApiParam({ name: 'id', description: 'Wizard session ID' })
  @ApiBody({ type: UpdateWizardSessionDto })
  @ApiResponse({
    status: 200,
    description: 'Wizard session updated successfully',
    type: WizardSessionResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Wizard session not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid step data',
  })
  async updateWizardSession(
    @CurrentUser() user: User,
    @Param('id') sessionId: string,
    @Body() updateDto: UpdateWizardSessionDto,
  ): Promise<WizardSessionResponseDto> {
    return this.customerWizardService.updateWizardSession(
      user.id,
      sessionId,
      updateDto,
    );
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete website creation',
    description: 'Complete the wizard and create the website',
  })
  @ApiParam({ name: 'id', description: 'Wizard session ID' })
  @ApiBody({ type: CompleteWizardDto })
  @ApiResponse({
    status: 200,
    description: 'Website created successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Wizard session not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Wizard not ready for completion',
  })
  async completeWizard(
    @CurrentUser() user: User,
    @Param('id') sessionId: string,
    @Body() completeDto: CompleteWizardDto,
  ): Promise<{ siteId: string; message: string; deploymentUrl?: string }> {
    return this.customerWizardService.completeWizard(
      user.id,
      sessionId,
      completeDto,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'List wizard sessions',
    description: 'Get all wizard sessions for the authenticated customer',
  })
  @ApiResponse({
    status: 200,
    description: 'Wizard sessions retrieved successfully',
    type: [WizardSessionResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async listWizardSessions(
    @CurrentUser() user: User,
  ): Promise<WizardSessionResponseDto[]> {
    return this.customerWizardService.listWizardSessions(user.id);
  }

  @Post(':id/business-info')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Save business information',
    description: 'Save business information step data',
  })
  @ApiParam({ name: 'id', description: 'Wizard session ID' })
  @ApiBody({ type: BusinessInfoDto })
  @ApiResponse({
    status: 200,
    description: 'Business information saved successfully',
    type: WizardSessionResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Wizard session not found',
  })
  async saveBusinessInfo(
    @CurrentUser() user: User,
    @Param('id') sessionId: string,
    @Body() businessInfoDto: BusinessInfoDto,
  ): Promise<WizardSessionResponseDto> {
    return this.customerWizardService.saveBusinessInfo(
      user.id,
      sessionId,
      businessInfoDto,
    );
  }

  @Post(':id/template-selection')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Save template selection',
    description: 'Save template selection step data',
  })
  @ApiParam({ name: 'id', description: 'Wizard session ID' })
  @ApiBody({ type: TemplateSelectionDto })
  @ApiResponse({
    status: 200,
    description: 'Template selection saved successfully',
    type: WizardSessionResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Wizard session not found',
  })
  async saveTemplateSelection(
    @CurrentUser() user: User,
    @Param('id') sessionId: string,
    @Body() templateSelectionDto: TemplateSelectionDto,
  ): Promise<WizardSessionResponseDto> {
    return this.customerWizardService.saveTemplateSelection(
      user.id,
      sessionId,
      templateSelectionDto,
    );
  }

  @Post(':id/design-preferences')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Save design preferences',
    description: 'Save design preferences step data',
  })
  @ApiParam({ name: 'id', description: 'Wizard session ID' })
  @ApiBody({ type: DesignPreferencesDto })
  @ApiResponse({
    status: 200,
    description: 'Design preferences saved successfully',
    type: WizardSessionResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Wizard session not found',
  })
  async saveDesignPreferences(
    @CurrentUser() user: User,
    @Param('id') sessionId: string,
    @Body() designPreferencesDto: DesignPreferencesDto,
  ): Promise<WizardSessionResponseDto> {
    return this.customerWizardService.saveDesignPreferences(
      user.id,
      sessionId,
      designPreferencesDto,
    );
  }

  @Post(':id/generate-content')
  @Public()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Generate AI content',
    description:
      'Generate website content using AI based on business information',
  })
  @ApiParam({ name: 'id', description: 'Wizard session ID' })
  @ApiResponse({
    status: 202,
    description: 'AI content generation started',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Wizard session not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Insufficient data for content generation',
  })
  async generateAIContent(
    @Param('id') sessionId: string,
  ): Promise<{ message: string; estimatedTime: number }> {
    // Use anonymous user ID for public wizard sessions
    const anonymousUserId = 'anonymous';
    return this.customerWizardService.generateAIContent(
      anonymousUserId,
      sessionId,
    );
  }

  @Get(':id/content-status')
  @Public()
  @ApiOperation({
    summary: 'Check content generation status',
    description: 'Check the status of AI content generation',
  })
  @ApiParam({ name: 'id', description: 'Wizard session ID' })
  @ApiResponse({
    status: 200,
    description: 'Content generation status retrieved',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Wizard session not found',
  })
  async getContentGenerationStatus(
    @Param('id') sessionId: string,
  ): Promise<{ status: string; progress: number; content?: any }> {
    // Use anonymous user ID for public wizard sessions
    const anonymousUserId = 'anonymous';
    return this.customerWizardService.getContentGenerationStatus(
      anonymousUserId,
      sessionId,
    );
  }
}

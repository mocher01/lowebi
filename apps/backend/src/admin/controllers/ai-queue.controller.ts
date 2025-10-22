import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { Public } from '../../auth/decorators/public.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  AiQueueService,
  type CreateAiRequestDto,
  type UpdateAiRequestDto,
  type QueueFilters,
} from '../services/ai-queue.service';
import {
  AiRequest,
  RequestStatus,
  RequestType,
  RequestPriority,
} from '../entities/ai-request.entity';

@ApiTags('AI Queue Management')
@ApiBearerAuth()
@Controller('admin/queue')
@UseGuards(JwtAuthGuard)
export class AiQueueController {
  constructor(private readonly aiQueueService: AiQueueService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create new AI request' })
  @ApiResponse({
    status: 201,
    description: 'AI request created successfully',
    type: AiRequest,
  })
  async createRequest(
    @Body() createDto: CreateAiRequestDto,
  ): Promise<AiRequest> {
    return this.aiQueueService.createRequest(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get AI queue with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'AI queue retrieved successfully' })
  async getQueue(
    @Query('status') status?: RequestStatus,
    @Query('requestType') requestType?: RequestType,
    @Query('adminId') adminId?: string,
    @Query('businessType') businessType?: string,
    @Query('priority') priority?: RequestPriority,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    const filters: QueueFilters = {};

    if (status) filters.status = status;
    if (requestType) filters.requestType = requestType;
    if (adminId) filters.adminId = adminId;
    if (businessType) filters.businessType = businessType;
    if (priority) filters.priority = priority;
    if (fromDate) filters.fromDate = new Date(fromDate);
    if (toDate) filters.toDate = new Date(toDate);

    return this.aiQueueService.getQueue(filters, Number(page), Number(limit));
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get queue statistics' })
  @ApiResponse({
    status: 200,
    description: 'Queue statistics retrieved successfully',
  })
  async getQueueStats() {
    return this.aiQueueService.getQueueStats();
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get overdue requests' })
  @ApiResponse({
    status: 200,
    description: 'Overdue requests retrieved successfully',
  })
  async getOverdueRequests(): Promise<AiRequest[]> {
    return this.aiQueueService.getOverdueRequests();
  }

  @Get('admin/:adminId')
  @ApiOperation({ summary: 'Get requests by admin' })
  @ApiResponse({
    status: 200,
    description: 'Admin requests retrieved successfully',
  })
  async getRequestsByAdmin(
    @Param('adminId') adminId: string,
  ): Promise<AiRequest[]> {
    return this.aiQueueService.getRequestsByAdmin(adminId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get specific AI request' })
  @ApiResponse({
    status: 200,
    description: 'AI request retrieved successfully',
    type: AiRequest,
  })
  async getRequest(@Param('id', ParseIntPipe) id: number): Promise<AiRequest> {
    return this.aiQueueService.getRequest(id);
  }

  @Get(':id/prompt')
  @Public()
  @ApiOperation({ summary: 'Generate suggested prompt for AI request' })
  @ApiResponse({
    status: 200,
    description: 'Suggested prompt generated successfully',
  })
  async generatePrompt(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ prompt: string }> {
    return this.aiQueueService.generatePrompt(id);
  }

  @Put(':id/assign')
  @ApiOperation({ summary: 'Assign request to admin' })
  @ApiResponse({
    status: 200,
    description: 'Request assigned successfully',
    type: AiRequest,
  })
  async assignRequest(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<AiRequest> {
    const adminId = req.user.id;
    return this.aiQueueService.assignRequest(id, adminId);
  }

  @Put(':id/start')
  @ApiOperation({ summary: 'Start processing request' })
  @ApiResponse({
    status: 200,
    description: 'Request processing started',
    type: AiRequest,
  })
  async startProcessing(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<AiRequest> {
    const adminId = req.user.id;
    return this.aiQueueService.startProcessing(id, adminId);
  }

  @Put(':id/complete')
  @ApiOperation({ summary: 'Complete request with generated content' })
  @ApiResponse({
    status: 200,
    description: 'Request completed successfully',
    type: AiRequest,
  })
  async completeRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      generatedContent: any;
      processingNotes?: string;
      actualCost?: number;
    },
    @Request() req: any,
  ): Promise<AiRequest> {
    const adminId = req.user.id;
    const { generatedContent, processingNotes, actualCost } = body;

    if (!generatedContent) {
      throw new BadRequestException('Generated content is required');
    }

    return this.aiQueueService.completeRequest(
      id,
      adminId,
      generatedContent,
      processingNotes,
      actualCost,
    );
  }

  @Put(':id/reject')
  @ApiOperation({ summary: 'Reject request' })
  @ApiResponse({
    status: 200,
    description: 'Request rejected successfully',
    type: AiRequest,
  })
  async rejectRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason: string },
    @Request() req: any,
  ): Promise<AiRequest> {
    const adminId = req.user.id;
    const { reason } = body;

    if (!reason) {
      throw new BadRequestException('Rejection reason is required');
    }

    return this.aiQueueService.rejectRequest(id, adminId, reason);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update AI request' })
  @ApiResponse({
    status: 200,
    description: 'Request updated successfully',
    type: AiRequest,
  })
  async updateRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateAiRequestDto,
  ): Promise<AiRequest> {
    return this.aiQueueService.updateRequest(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete AI request' })
  @ApiResponse({ status: 200, description: 'Request deleted successfully' })
  async deleteRequest(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    // For now, we'll soft delete by marking as cancelled
    await this.aiQueueService.updateRequest(id, {
      status: RequestStatus.CANCELLED,
    });
    return { message: `Request ${id} cancelled successfully` };
  }
}

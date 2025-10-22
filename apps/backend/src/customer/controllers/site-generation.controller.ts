import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SiteGenerationOrchestratorService } from '../services/site-generation-orchestrator.service';

/**
 * SiteGenerationController
 *
 * Endpoints for Step 7: Review & Site Generation
 * - POST /customer/sites/generate - Start site generation
 * - GET /customer/sites/generate/:taskId - Check generation progress
 * - GET /customer/sites/generate/active - Get active tasks
 *
 * Related: Issue #137 - Step 7: Review & Site Generation
 */
@Controller('customer/sites')
@UseGuards(JwtAuthGuard)
export class SiteGenerationController {
  constructor(
    private readonly orchestrator: SiteGenerationOrchestratorService,
  ) {}

  /**
   * Start site generation from wizard session
   */
  @Post('generate')
  @HttpCode(HttpStatus.ACCEPTED)
  async startGeneration(
    @Request() req,
    @Body('wizardSessionId') wizardSessionId: string,
  ) {
    const task = await this.orchestrator.startGeneration(
      wizardSessionId,
      req.user.id,
    );

    return {
      success: true,
      message: 'Site generation started',
      taskId: task.id,
      status: task.status,
      progress: task.progress,
      currentStep: task.currentStep,
    };
  }

  /**
   * Get generation task status (for frontend polling)
   */
  @Get('generate/:taskId')
  async getGenerationStatus(@Request() req, @Param('taskId') taskId: string) {
    const task = await this.orchestrator.getTaskStatus(taskId);

    return {
      success: true,
      task: {
        id: task.id,
        status: task.status,
        progress: task.progress,
        currentStep: task.currentStep,
        siteId: task.siteId,
        port: task.port,
        siteUrl: task.siteUrl,
        error: task.error,
        startedAt: task.startedAt,
        completedAt: task.completedAt,
        createdAt: task.createdAt,
      },
    };
  }

  /**
   * Get active generation tasks for current user
   */
  @Get('generate/active/list')
  async getActiveTasks(@Request() req) {
    const tasks = await this.orchestrator.getActiveTasksForCustomer(
      req.user.id,
    );

    return {
      success: true,
      tasks: tasks.map((task) => ({
        id: task.id,
        status: task.status,
        progress: task.progress,
        currentStep: task.currentStep,
        siteId: task.siteId,
        wizardSessionId: task.wizardSessionId,
        startedAt: task.startedAt,
        createdAt: task.createdAt,
      })),
    };
  }
}

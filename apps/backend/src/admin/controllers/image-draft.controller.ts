import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AiQueueService } from '../services/ai-queue.service';
import type { SaveImageDraftDto } from '../services/ai-queue.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';

@ApiTags('Admin - Image Drafts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/ai-requests')
export class ImageDraftController {
  constructor(private readonly aiQueueService: AiQueueService) {}

  @Put(':id/images-draft')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Save image draft',
    description:
      'Upload and save a single image draft for processing. File is persisted to disk immediately.',
  })
  @ApiParam({
    name: 'id',
    description: 'AI request ID',
    type: 'number',
  })
  @ApiBody({
    description: 'Image draft data',
    schema: {
      type: 'object',
      required: ['role', 'filename', 'dataUrl'],
      properties: {
        role: {
          type: 'string',
          description: 'Image role/type (e.g., "logoNav", "hero", "service_1")',
          example: 'logoNav',
        },
        filename: {
          type: 'string',
          description: 'Target filename for the image',
          example: 'site-logo-clair.png',
        },
        dataUrl: {
          type: 'string',
          description: 'Base64 data URL of the image',
          example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Image draft saved successfully',
    schema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean', example: true },
        image: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              example: '/uploads/requests/123/site-logo-clair.png',
            },
            filename: { type: 'string', example: 'site-logo-clair.png' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        imagesDraft: {
          type: 'object',
          description: 'All draft images for this request',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid data URL or file type' })
  @ApiResponse({ status: 404, description: 'AI request not found' })
  async saveImageDraft(
    @Param('id', ParseIntPipe) requestId: number,
    @Body() saveDto: SaveImageDraftDto,
  ) {
    return this.aiQueueService.saveImageDraft(requestId, saveDto);
  }

  @Get(':id/images-draft')
  @ApiOperation({
    summary: 'Get all image drafts',
    description: 'Retrieve all uploaded image drafts for a request',
  })
  @ApiParam({
    name: 'id',
    description: 'AI request ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Image drafts retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean', example: true },
        imagesDraft: {
          type: 'object',
          description: 'Map of role -> image data',
          example: {
            logoNav: {
              url: '/uploads/requests/123/site-logo-clair.png',
              filename: 'site-logo-clair.png',
              updatedAt: '2024-01-15T10:30:00.000Z',
            },
            hero: {
              url: '/uploads/requests/123/site-hero.png',
              filename: 'site-hero.png',
              updatedAt: '2024-01-15T10:35:00.000Z',
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'AI request not found' })
  async getImageDrafts(@Param('id', ParseIntPipe) requestId: number) {
    return this.aiQueueService.getImageDrafts(requestId);
  }

  @Delete(':id/images-draft/:role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete image draft by role',
    description: 'Remove a specific image draft by its role identifier',
  })
  @ApiParam({
    name: 'id',
    description: 'AI request ID',
    type: 'number',
  })
  @ApiParam({
    name: 'role',
    description: 'Image role to delete',
    type: 'string',
    example: 'logoNav',
  })
  @ApiResponse({
    status: 200,
    description: 'Image draft deleted successfully',
    schema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'AI request not found' })
  async deleteImageDraft(
    @Param('id', ParseIntPipe) requestId: number,
    @Param('role') role: string,
  ) {
    return this.aiQueueService.deleteImageDraft(requestId, role);
  }
}

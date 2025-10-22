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
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SiteManagementService } from '../services/site-management.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { User, UserRole } from '../../auth/entities/user.entity';
import {
  CreateSiteDto,
  UpdateSiteDto,
  SiteListQueryDto,
  SiteResponseDto,
  SiteListResponseDto,
  SiteAnalyticsQueryDto,
  SiteAnalyticsResponseDto,
  AdminDeploySiteDto,
  BulkSiteOperationDto,
} from '../dto/site-management.dto';

@ApiTags('Site Management')
@ApiBearerAuth('JWT-auth')
@Controller('admin/sites')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@UseInterceptors(ClassSerializerInterceptor)
export class SiteManagementController {
  constructor(private readonly siteManagementService: SiteManagementService) {}

  @Post()
  @ApiOperation({
    summary: 'Create new site',
    description: 'Create a new website for a user or admin',
  })
  @ApiResponse({
    status: 201,
    description: 'Site created successfully',
    type: SiteResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data or domain already exists',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  @HttpCode(HttpStatus.CREATED)
  async createSite(
    @Body() createSiteDto: CreateSiteDto,
    @CurrentUser() user: User,
  ): Promise<SiteResponseDto> {
    return this.siteManagementService.createSite(createSiteDto, user.id);
  }

  @Get()
  @ApiOperation({
    summary: 'List all sites',
    description:
      'Get paginated list of all sites with filtering and search capabilities',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20, max: 100)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in site name, domain, or description',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by site status',
  })
  @ApiQuery({
    name: 'template',
    required: false,
    type: String,
    description: 'Filter by template type',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filter by owner user ID',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort field (default: createdAt)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order (default: DESC)',
  })
  @ApiResponse({
    status: 200,
    description: 'Sites list retrieved successfully',
    type: SiteListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  @HttpCode(HttpStatus.OK)
  async getSites(
    @Query() query: SiteListQueryDto,
  ): Promise<SiteListResponseDto> {
    return this.siteManagementService.getSites(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get site by ID',
    description: 'Retrieve detailed information about a specific site',
  })
  @ApiParam({ name: 'id', type: String, description: 'Site UUID' })
  @ApiResponse({
    status: 200,
    description: 'Site details retrieved successfully',
    type: SiteResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  @ApiResponse({
    status: 404,
    description: 'Site not found',
  })
  @HttpCode(HttpStatus.OK)
  async getSiteById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SiteResponseDto> {
    return this.siteManagementService.getSiteById(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update site',
    description:
      'Update site information including name, domain, configuration, and status',
  })
  @ApiParam({ name: 'id', type: String, description: 'Site UUID' })
  @ApiResponse({
    status: 200,
    description: 'Site updated successfully',
    type: SiteResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data or domain already exists',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  @ApiResponse({
    status: 404,
    description: 'Site not found',
  })
  @HttpCode(HttpStatus.OK)
  async updateSite(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSiteDto: UpdateSiteDto,
    @CurrentUser() user: User,
  ): Promise<SiteResponseDto> {
    return this.siteManagementService.updateSite(id, updateSiteDto, user.id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete/archive site',
    description: 'Soft delete a site by archiving it and making it inactive',
  })
  @ApiParam({ name: 'id', type: String, description: 'Site UUID' })
  @ApiResponse({
    status: 204,
    description: 'Site deleted/archived successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  @ApiResponse({
    status: 404,
    description: 'Site not found',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSite(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.siteManagementService.deleteSite(id, user.id);
  }

  @Post(':id/deploy')
  @ApiOperation({
    summary: 'Deploy site',
    description: 'Initiate deployment process for a site',
  })
  @ApiParam({ name: 'id', type: String, description: 'Site UUID' })
  @ApiResponse({
    status: 200,
    description: 'Site deployment initiated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Cannot deploy inactive site',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  @ApiResponse({
    status: 404,
    description: 'Site not found',
  })
  @HttpCode(HttpStatus.OK)
  async deploySite(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() deploySiteDto: AdminDeploySiteDto,
    @CurrentUser() user: User,
  ): Promise<{ message: string; deploymentId?: string }> {
    return this.siteManagementService.deploySite(id, deploySiteDto, user.id);
  }

  @Get(':id/analytics')
  @ApiOperation({
    summary: 'Get site analytics',
    description: 'Retrieve comprehensive analytics data for a specific site',
  })
  @ApiParam({ name: 'id', type: String, description: 'Site UUID' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for analytics (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for analytics (ISO string)',
  })
  @ApiQuery({
    name: 'granularity',
    required: false,
    enum: ['hour', 'day', 'week', 'month'],
    description: 'Time granularity for analytics',
  })
  @ApiResponse({
    status: 200,
    description: 'Site analytics retrieved successfully',
    type: SiteAnalyticsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  @ApiResponse({
    status: 404,
    description: 'Site not found',
  })
  @HttpCode(HttpStatus.OK)
  async getSiteAnalytics(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: SiteAnalyticsQueryDto,
  ): Promise<SiteAnalyticsResponseDto> {
    return this.siteManagementService.getSiteAnalytics(id, query);
  }

  @Post('bulk-operation')
  @ApiOperation({
    summary: 'Perform bulk operations on sites',
    description:
      'Execute bulk operations (activate, deactivate, archive, delete) on multiple sites',
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk operation completed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Some sites not found or invalid operation',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  @HttpCode(HttpStatus.OK)
  async bulkSiteOperation(
    @Body() bulkOperationDto: BulkSiteOperationDto,
    @CurrentUser() user: User,
  ): Promise<{ message: string; processedCount: number }> {
    return this.siteManagementService.bulkSiteOperation(
      bulkOperationDto,
      user.id,
    );
  }
}

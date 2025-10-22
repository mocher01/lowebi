import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
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
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { User, UserRole } from '../../auth/entities/user.entity';
import { CustomerSitesService } from '../services/customer-sites.service';
import { WizardSessionService } from '../services/wizard-session.service';
import { SiteContentService } from '../services/site-content.service';
import {
  CreateCustomerSiteDto,
  UpdateCustomerSiteDto,
  CustomerSiteResponseDto,
  DeploySiteDto,
  SiteDeploymentStatusDto,
} from '../dto/customer-site.dto';
import {
  CreateBlogPostDto,
  UpdateBlogPostDto,
  BlogPostResponseDto,
  UpdatePageContentDto,
} from '../dto/blog-post.dto';
import { BlogPostStatus } from '../entities/blog-post.entity';

@ApiTags('Customer Site Management')
@Controller('customer/sites')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
@ApiBearerAuth('JWT-auth')
export class CustomerSitesController {
  constructor(
    private readonly customerSitesService: CustomerSitesService,
    private readonly wizardSessionService: WizardSessionService,
    private readonly siteContentService: SiteContentService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List customer sites',
    description: 'Retrieve all websites owned by the authenticated customer',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by site status',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by site name or domain',
  })
  @ApiResponse({
    status: 200,
    description: 'Sites retrieved successfully',
    type: [CustomerSiteResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async listSites(
    @CurrentUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ): Promise<{
    sites: CustomerSiteResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.customerSitesService.listSites(user.id, {
      page,
      limit,
      status,
      search,
    });
  }

  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new website',
    description: 'Create a new website for wizard or authenticated customer',
  })
  @ApiBody({ type: CreateCustomerSiteDto })
  @ApiResponse({
    status: 201,
    description: 'Site created successfully',
    type: CustomerSiteResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or domain already taken',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Site limit reached for current plan',
  })
  async createSite(
    @Body() createSiteDto: CreateCustomerSiteDto,
  ): Promise<CustomerSiteResponseDto> {
    // Use anonymous customer ID for wizard-created sites
    const anonymousCustomerId = 'anonymous';
    return this.customerSitesService.createSite(
      anonymousCustomerId,
      createSiteDto,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get website details',
    description: 'Retrieve detailed information about a specific website',
  })
  @ApiParam({ name: 'id', description: 'Site ID' })
  @ApiResponse({
    status: 200,
    description: 'Site details retrieved successfully',
    type: CustomerSiteResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Site not found',
  })
  async getSite(
    @CurrentUser() user: User,
    @Param('id') siteId: string,
  ): Promise<CustomerSiteResponseDto> {
    return this.customerSitesService.getSite(user.id, siteId);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update website',
    description: 'Update website configuration, content, or settings',
  })
  @ApiParam({ name: 'id', description: 'Site ID' })
  @ApiBody({ type: UpdateCustomerSiteDto })
  @ApiResponse({
    status: 200,
    description: 'Site updated successfully',
    type: CustomerSiteResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Site not found',
  })
  async updateSite(
    @CurrentUser() user: User,
    @Param('id') siteId: string,
    @Body() updateSiteDto: UpdateCustomerSiteDto,
  ): Promise<CustomerSiteResponseDto> {
    return this.customerSitesService.updateSite(user.id, siteId, updateSiteDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete website',
    description: 'Permanently delete a website and all its data',
  })
  @ApiParam({ name: 'id', description: 'Site ID' })
  @ApiResponse({
    status: 204,
    description: 'Site deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Site not found',
  })
  async deleteSite(
    @CurrentUser() user: User,
    @Param('id') siteId: string,
  ): Promise<void> {
    return this.customerSitesService.deleteSite(user.id, siteId);
  }

  @Post(':id/deploy')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Deploy website',
    description: 'Deploy website to production environment',
  })
  @ApiParam({ name: 'id', description: 'Site ID' })
  @ApiBody({ type: DeploySiteDto, required: false })
  @ApiResponse({
    status: 202,
    description: 'Deployment started successfully',
    type: SiteDeploymentStatusDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Site not ready for deployment',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Site not found',
  })
  async deploySite(
    @CurrentUser() user: User,
    @Param('id') siteId: string,
    @Body() deployDto: DeploySiteDto = {},
  ): Promise<SiteDeploymentStatusDto> {
    return this.customerSitesService.deploySite(user.id, siteId, deployDto);
  }

  @Get(':id/status')
  @ApiOperation({
    summary: 'Get deployment status',
    description: 'Check the current deployment status of a website',
  })
  @ApiParam({ name: 'id', description: 'Site ID' })
  @ApiResponse({
    status: 200,
    description: 'Deployment status retrieved successfully',
    type: SiteDeploymentStatusDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Site not found',
  })
  async getDeploymentStatus(
    @CurrentUser() user: User,
    @Param('id') siteId: string,
  ): Promise<SiteDeploymentStatusDto> {
    return this.customerSitesService.getDeploymentStatus(user.id, siteId);
  }

  @Post(':id/preview')
  @ApiOperation({
    summary: 'Generate site preview',
    description: 'Generate a preview URL for the website without deploying',
  })
  @ApiParam({ name: 'id', description: 'Site ID' })
  @ApiResponse({
    status: 200,
    description: 'Preview generated successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Site not found',
  })
  async generatePreview(
    @CurrentUser() user: User,
    @Param('id') siteId: string,
  ): Promise<{ previewUrl: string; expiresAt: Date }> {
    return this.customerSitesService.generatePreview(user.id, siteId);
  }

  @Get(':id/analytics')
  @ApiOperation({
    summary: 'Get site analytics',
    description: 'Retrieve basic analytics data for the website',
  })
  @ApiParam({ name: 'id', description: 'Site ID' })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Analytics period (7d, 30d, 90d)',
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics data retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Site not found',
  })
  async getSiteAnalytics(
    @CurrentUser() user: User,
    @Param('id') siteId: string,
    @Query('period') period = '30d',
  ): Promise<any> {
    return this.customerSitesService.getSiteAnalytics(user.id, siteId, period);
  }

  // Phase 1: Site Admin Operations

  @Post(':id/restart')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restart site container',
    description: 'Stop and restart the Docker container for a deployed site',
  })
  @ApiParam({ name: 'id', description: 'Site ID' })
  @ApiResponse({
    status: 200,
    description: 'Container restarted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Site not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Site is not deployed',
  })
  async restartSite(
    @CurrentUser() user: User,
    @Param('id') siteId: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.wizardSessionService.restartSiteContainer(siteId, user.id);
  }

  @Get(':id/logs')
  @ApiOperation({
    summary: 'Get container logs',
    description: 'Retrieve Docker container logs for a deployed site',
  })
  @ApiParam({ name: 'id', description: 'Site ID' })
  @ApiQuery({
    name: 'lines',
    required: false,
    description: 'Number of log lines to retrieve (default: 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Logs retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Site not found',
  })
  async getSiteLogs(
    @CurrentUser() user: User,
    @Param('id') siteId: string,
    @Query('lines') lines = 100,
  ): Promise<{ success: boolean; logs: string; timestamp: Date }> {
    const result = await this.wizardSessionService.getSiteContainerLogs(
      siteId,
      user.id,
      lines,
    );
    // Convert logs array to newline-separated string for frontend
    return {
      success: true,
      logs: result.logs.join('\n'),
      timestamp: result.timestamp,
    };
  }

  // Phase 2: Content Editor & Blog Posts

  @Get(':id/content')
  @ApiOperation({
    summary: 'Get editable page content',
    description:
      'Retrieve all editable page sections (hero, about, services, etc.)',
  })
  @ApiParam({ name: 'id', description: 'Site ID' })
  @ApiResponse({
    status: 200,
    description: 'Page content retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Site not found',
  })
  async getPageContent(
    @CurrentUser() user: User,
    @Param('id') siteId: string,
  ): Promise<any> {
    return this.siteContentService.getPageContent(siteId, user.id);
  }

  @Patch(':id/content/pages/:section')
  @ApiOperation({
    summary: 'Update page section',
    description:
      'Update a specific page section (hero, about, services, contact, faq, testimonials)',
  })
  @ApiParam({ name: 'id', description: 'Site ID' })
  @ApiParam({
    name: 'section',
    description:
      'Section name (hero, about, services, contact, faq, testimonials)',
  })
  @ApiBody({ type: UpdatePageContentDto })
  @ApiResponse({
    status: 200,
    description: 'Section updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid section name',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Site not found',
  })
  async updatePageSection(
    @CurrentUser() user: User,
    @Param('id') siteId: string,
    @Param('section') section: string,
    @Body() updateDto: UpdatePageContentDto,
  ): Promise<any> {
    return this.siteContentService.updatePageSection(
      siteId,
      user.id,
      section,
      updateDto,
    );
  }

  @Get(':id/blog')
  @ApiOperation({
    summary: 'Get all blog posts',
    description: 'Retrieve all blog posts for a site',
  })
  @ApiParam({ name: 'id', description: 'Site ID' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: BlogPostStatus,
    description: 'Filter by post status',
  })
  @ApiResponse({
    status: 200,
    description: 'Blog posts retrieved successfully',
    type: [BlogPostResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Site not found',
  })
  async getBlogPosts(
    @CurrentUser() user: User,
    @Param('id') siteId: string,
    @Query('status') status?: BlogPostStatus,
  ): Promise<BlogPostResponseDto[]> {
    return this.siteContentService.getBlogPosts(siteId, user.id, status);
  }

  @Post(':id/blog')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create blog post',
    description: 'Create a new blog post for the site',
  })
  @ApiParam({ name: 'id', description: 'Site ID' })
  @ApiBody({ type: CreateBlogPostDto })
  @ApiResponse({
    status: 201,
    description: 'Blog post created successfully',
    type: BlogPostResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Site not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Slug already exists',
  })
  async createBlogPost(
    @CurrentUser() user: User,
    @Param('id') siteId: string,
    @Body() createDto: CreateBlogPostDto,
  ): Promise<BlogPostResponseDto> {
    return this.siteContentService.createBlogPost(siteId, user.id, createDto);
  }

  @Get(':id/blog/:postId')
  @ApiOperation({
    summary: 'Get blog post',
    description: 'Retrieve a specific blog post',
  })
  @ApiParam({ name: 'id', description: 'Site ID' })
  @ApiParam({ name: 'postId', description: 'Blog post ID' })
  @ApiResponse({
    status: 200,
    description: 'Blog post retrieved successfully',
    type: BlogPostResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Site or blog post not found',
  })
  async getBlogPost(
    @CurrentUser() user: User,
    @Param('id') siteId: string,
    @Param('postId') postId: string,
  ): Promise<BlogPostResponseDto> {
    return this.siteContentService.getBlogPost(postId, siteId, user.id);
  }

  @Patch(':id/blog/:postId')
  @ApiOperation({
    summary: 'Update blog post',
    description: 'Update an existing blog post',
  })
  @ApiParam({ name: 'id', description: 'Site ID' })
  @ApiParam({ name: 'postId', description: 'Blog post ID' })
  @ApiBody({ type: UpdateBlogPostDto })
  @ApiResponse({
    status: 200,
    description: 'Blog post updated successfully',
    type: BlogPostResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Site or blog post not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Slug already exists',
  })
  async updateBlogPost(
    @CurrentUser() user: User,
    @Param('id') siteId: string,
    @Param('postId') postId: string,
    @Body() updateDto: UpdateBlogPostDto,
  ): Promise<BlogPostResponseDto> {
    return this.siteContentService.updateBlogPost(
      postId,
      siteId,
      user.id,
      updateDto,
    );
  }

  @Delete(':id/blog/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete blog post',
    description: 'Delete a blog post',
  })
  @ApiParam({ name: 'id', description: 'Site ID' })
  @ApiParam({ name: 'postId', description: 'Blog post ID' })
  @ApiResponse({
    status: 204,
    description: 'Blog post deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Site or blog post not found',
  })
  async deleteBlogPost(
    @CurrentUser() user: User,
    @Param('id') siteId: string,
    @Param('postId') postId: string,
  ): Promise<void> {
    return this.siteContentService.deleteBlogPost(postId, siteId, user.id);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Publish content changes',
    description:
      'Regenerate site config from database and redeploy the site (takes 30-60s)',
  })
  @ApiParam({ name: 'id', description: 'Site ID' })
  @ApiResponse({
    status: 202,
    description: 'Site publish started successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Site not found',
  })
  async publishSite(
    @CurrentUser() user: User,
    @Param('id') siteId: string,
  ): Promise<{ success: boolean; message: string; deploymentId?: string }> {
    return this.siteContentService.publishSite(siteId, user.id);
  }
}

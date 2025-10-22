import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../auth/entities/user.entity';
import { CustomerTemplatesService } from '../services/customer-templates.service';
import {
  CustomerTemplate,
  TemplateCategory,
} from '../entities/customer-template.entity';

@ApiTags('Customer Templates')
@Controller('customer/templates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CustomerTemplatesController {
  constructor(
    private readonly customerTemplatesService: CustomerTemplatesService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List available templates',
    description:
      'Retrieve all templates available to the customer based on their subscription',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: TemplateCategory,
    description: 'Filter by template category',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search templates by name or description',
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
  @ApiResponse({
    status: 200,
    description: 'Templates retrieved successfully',
    type: [CustomerTemplate],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async listTemplates(
    @CurrentUser() user: User,
    @Query('category') category?: TemplateCategory,
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 12,
  ): Promise<{
    templates: CustomerTemplate[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.customerTemplatesService.listTemplates(user.id, {
      category,
      search,
      page,
      limit,
    });
  }

  @Get('categories')
  @ApiOperation({
    summary: 'Get template categories',
    description: 'Retrieve all available template categories',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getCategories(): Promise<
    { category: TemplateCategory; name: string; count: number }[]
  > {
    return this.customerTemplatesService.getCategories();
  }

  @Get('featured')
  @ApiOperation({
    summary: 'Get featured templates',
    description: 'Retrieve featured templates for the customer',
  })
  @ApiResponse({
    status: 200,
    description: 'Featured templates retrieved successfully',
    type: [CustomerTemplate],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getFeaturedTemplates(
    @CurrentUser() user: User,
  ): Promise<CustomerTemplate[]> {
    return this.customerTemplatesService.getFeaturedTemplates(user.id);
  }

  @Get('popular')
  @ApiOperation({
    summary: 'Get popular templates',
    description: 'Retrieve most popular templates based on usage',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of templates to return',
  })
  @ApiResponse({
    status: 200,
    description: 'Popular templates retrieved successfully',
    type: [CustomerTemplate],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getPopularTemplates(
    @CurrentUser() user: User,
    @Query('limit') limit = 6,
  ): Promise<CustomerTemplate[]> {
    return this.customerTemplatesService.getPopularTemplates(user.id, limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get template details',
    description: 'Retrieve detailed information about a specific template',
  })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: 200,
    description: 'Template details retrieved successfully',
    type: CustomerTemplate,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Template not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Template not available for current subscription',
  })
  async getTemplate(
    @CurrentUser() user: User,
    @Param('id') templateId: string,
  ): Promise<CustomerTemplate> {
    return this.customerTemplatesService.getTemplate(user.id, templateId);
  }

  @Get(':id/preview')
  @ApiOperation({
    summary: 'Get template preview',
    description: 'Get template preview configuration and demo data',
  })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: 200,
    description: 'Template preview retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Template not found',
  })
  async getTemplatePreview(
    @CurrentUser() user: User,
    @Param('id') templateId: string,
  ): Promise<{
    template: CustomerTemplate;
    previewUrl: string;
    configuration: any;
    demoContent: any;
  }> {
    return this.customerTemplatesService.getTemplatePreview(
      user.id,
      templateId,
    );
  }

  @Get('industry/:industry')
  @ApiOperation({
    summary: 'Get templates by industry',
    description: 'Retrieve templates recommended for a specific industry',
  })
  @ApiParam({ name: 'industry', description: 'Industry name' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of templates to return',
  })
  @ApiResponse({
    status: 200,
    description: 'Industry templates retrieved successfully',
    type: [CustomerTemplate],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getTemplatesByIndustry(
    @CurrentUser() user: User,
    @Param('industry') industry: string,
    @Query('limit') limit = 8,
  ): Promise<CustomerTemplate[]> {
    return this.customerTemplatesService.getTemplatesByIndustry(
      user.id,
      industry,
      limit,
    );
  }
}

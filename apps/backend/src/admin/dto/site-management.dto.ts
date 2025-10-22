import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsUrl,
  IsObject,
  IsNumber,
  Min,
  Max,
  Length,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  SiteStatus,
  SiteTemplate,
} from '../../customer/entities/customer-site.entity';

// Site Creation DTO
export class CreateSiteDto {
  @ApiProperty({ description: 'Site name', example: 'My Business Website' })
  @IsString()
  @Length(1, 255)
  name: string;

  @ApiProperty({
    description: 'Site domain/subdomain',
    example: 'mybusiness.example.com',
  })
  @IsString()
  @Length(1, 255)
  domain: string;

  @ApiPropertyOptional({
    description: 'Site description',
    example: 'A professional business website',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Business type', example: 'Technology' })
  @IsOptional()
  @IsString()
  businessType?: string;

  @ApiProperty({
    description: 'Site template type',
    enum: SiteTemplate,
    example: SiteTemplate.BUSINESS,
  })
  @IsEnum(SiteTemplate)
  template: SiteTemplate;

  @ApiPropertyOptional({ description: 'Site configuration object' })
  @IsOptional()
  @IsObject()
  configuration?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Site metadata object' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Owner user ID (admin only)' })
  @IsOptional()
  @IsUUID()
  userId?: string;
}

// Site Update DTO
export class UpdateSiteDto {
  @ApiPropertyOptional({ description: 'Site name' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @ApiPropertyOptional({ description: 'Site domain/subdomain' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  domain?: string;

  @ApiPropertyOptional({ description: 'Site description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Site status', enum: SiteStatus })
  @IsOptional()
  @IsEnum(SiteStatus)
  status?: SiteStatus;

  @ApiPropertyOptional({
    description: 'Site template type',
    enum: SiteTemplate,
  })
  @IsOptional()
  @IsEnum(SiteTemplate)
  template?: SiteTemplate;

  @ApiPropertyOptional({ description: 'Site configuration object' })
  @IsOptional()
  @IsObject()
  configuration?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Site metadata object' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Build output path' })
  @IsOptional()
  @IsString()
  buildPath?: string;

  @ApiPropertyOptional({ description: 'Deployment URL' })
  @IsOptional()
  @IsUrl()
  deploymentUrl?: string;

  @ApiPropertyOptional({ description: 'Site active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// Site Query DTO
export class SiteListQueryDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Search in site name, domain, or description',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by site status',
    enum: SiteStatus,
  })
  @IsOptional()
  @IsEnum(SiteStatus)
  status?: SiteStatus;

  @ApiPropertyOptional({
    description: 'Filter by template type',
    enum: SiteTemplate,
  })
  @IsOptional()
  @IsEnum(SiteTemplate)
  template?: SiteTemplate;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Filter by owner user ID' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Sort field', example: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

// Site Response DTO
export class SiteResponseDto {
  @ApiProperty({ description: 'Site ID' })
  id: string;

  @ApiProperty({ description: 'Site name' })
  name: string;

  @ApiProperty({ description: 'Site domain' })
  domain: string;

  @ApiProperty({ description: 'Site description' })
  description: string;

  @ApiProperty({
    description: 'Site template',
    enum: SiteTemplate,
    nullable: true,
  })
  template: SiteTemplate | null;

  @ApiProperty({ description: 'Site status', enum: SiteStatus })
  status: SiteStatus;

  @ApiProperty({ description: 'Site configuration' })
  configuration: Record<string, any>;

  @ApiProperty({ description: 'Site metadata', nullable: true })
  metadata: Record<string, any> | null;

  @ApiProperty({ description: 'Build path', nullable: true })
  buildPath: string | null;

  @ApiProperty({ description: 'Deployment URL' })
  deploymentUrl: string;

  @ApiProperty({ description: 'Last deployment date' })
  lastDeployedAt: Date;

  @ApiProperty({ description: 'Total page views' })
  pageViews: number;

  @ApiProperty({ description: 'Unique visitors' })
  uniqueVisitors: number;

  @ApiProperty({ description: 'Site active status' })
  isActive: boolean;

  @ApiProperty({ description: 'Owner user ID' })
  userId: string;

  @ApiProperty({ description: 'Owner email' })
  userEmail: string;

  @ApiProperty({ description: 'Owner full name' })
  userFullName: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

// Site List Response DTO
export class SiteListResponseDto {
  @ApiProperty({ description: 'Array of sites', type: [SiteResponseDto] })
  sites: SiteResponseDto[];

  @ApiProperty({ description: 'Total number of sites' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;
}

// Site Analytics Query DTO
export class SiteAnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'Start date (ISO string)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date (ISO string)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Metrics granularity',
    enum: ['hour', 'day', 'week', 'month'],
  })
  @IsOptional()
  @IsString()
  granularity?: 'hour' | 'day' | 'week' | 'month' = 'day';
}

// Site Analytics Response DTO
export class SiteAnalyticsResponseDto {
  @ApiProperty({ description: 'Site ID' })
  siteId: string;

  @ApiProperty({ description: 'Total page views in period' })
  totalPageViews: number;

  @ApiProperty({ description: 'Unique visitors in period' })
  uniqueVisitors: number;

  @ApiProperty({ description: 'Average session duration (minutes)' })
  avgSessionDuration: number;

  @ApiProperty({ description: 'Bounce rate percentage' })
  bounceRate: number;

  @ApiProperty({ description: 'Top pages', type: [Object] })
  topPages: Array<{
    page: string;
    views: number;
    percentage: number;
  }>;

  @ApiProperty({ description: 'Traffic sources', type: [Object] })
  trafficSources: Array<{
    source: string;
    visitors: number;
    percentage: number;
  }>;

  @ApiProperty({ description: 'Device breakdown', type: [Object] })
  deviceBreakdown: Array<{
    device: string;
    visitors: number;
    percentage: number;
  }>;

  @ApiProperty({ description: 'Time series data', type: [Object] })
  timeSeries: Array<{
    date: string;
    pageViews: number;
    uniqueVisitors: number;
  }>;
}

// Deployment DTO
export class AdminDeploySiteDto {
  @ApiPropertyOptional({ description: 'Force rebuild even if no changes' })
  @IsOptional()
  @IsBoolean()
  forceRebuild?: boolean = false;

  @ApiPropertyOptional({
    description: 'Deployment environment',
    enum: ['staging', 'production'],
  })
  @IsOptional()
  @IsString()
  environment?: 'staging' | 'production' = 'production';
}

// Bulk Operations DTO
export class BulkSiteOperationDto {
  @ApiProperty({ description: 'Array of site IDs', type: [String] })
  @IsUUID(4, { each: true })
  siteIds: string[];

  @ApiProperty({
    description: 'Operation to perform',
    enum: ['activate', 'deactivate', 'archive', 'delete'],
  })
  @IsEnum(['activate', 'deactivate', 'archive', 'delete'])
  operation: 'activate' | 'deactivate' | 'archive' | 'delete';

  @ApiPropertyOptional({ description: 'Reason for bulk operation' })
  @IsOptional()
  @IsString()
  reason?: string;
}

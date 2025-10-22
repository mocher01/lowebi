import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsUrl,
  IsObject,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SiteStatus } from '../entities/customer-site.entity';

export class CreateCustomerSiteDto {
  @ApiProperty({ example: 'My Business Website', description: 'Site name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'A professional website for my business',
    description: 'Site description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'restaurant',
    description: 'Type of business (e.g., restaurant, plumbing, education)',
  })
  @IsString()
  @IsOptional()
  businessType?: string;

  @ApiProperty({
    example: 'mybusiness.com',
    description: 'Domain for the site',
  })
  @IsString()
  domain: string;

  @ApiPropertyOptional({
    example: 'uuid-string',
    description: 'Template ID to use for the site',
  })
  @IsUUID()
  @IsOptional()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Site configuration object' })
  @IsObject()
  @IsOptional()
  configuration?: any;

  @ApiPropertyOptional({ description: 'Site content object' })
  @IsObject()
  @IsOptional()
  content?: any;
}

export class UpdateCustomerSiteDto {
  @ApiPropertyOptional({
    example: 'Updated Business Website',
    description: 'Site name',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: 'Updated description',
    description: 'Site description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'plumbing',
    description: 'Type of business (e.g., restaurant, plumbing, education)',
  })
  @IsString()
  @IsOptional()
  businessType?: string;

  @ApiPropertyOptional({
    example: 'example.com',
    description: 'Custom domain for the site',
  })
  @IsString()
  @IsOptional()
  customDomain?: string;

  @ApiPropertyOptional({ description: 'Site configuration object' })
  @IsObject()
  @IsOptional()
  configuration?: any;

  @ApiPropertyOptional({ description: 'Site content object' })
  @IsObject()
  @IsOptional()
  content?: any;

  @ApiPropertyOptional({ example: true, description: 'Site active status' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CustomerSiteResponseDto {
  @ApiProperty({ example: 'uuid-string', description: 'Site ID' })
  id: string;

  @ApiProperty({ example: 'My Business Website', description: 'Site name' })
  name: string;

  @ApiProperty({
    example: 'A professional website for my business',
    description: 'Site description',
  })
  description?: string;

  @ApiProperty({
    example: 'restaurant',
    description: 'Type of business (e.g., restaurant, plumbing, education)',
  })
  businessType?: string;

  @ApiProperty({ example: 'mybusiness.com', description: 'Site domain' })
  domain: string;

  @ApiProperty({ example: 'example.com', description: 'Custom domain' })
  customDomain?: string;

  @ApiProperty({
    example: SiteStatus.DEPLOYED,
    enum: SiteStatus,
    description: 'Site status',
  })
  status: SiteStatus;

  @ApiProperty({
    example: 'https://mybusiness.logen.com',
    description: 'Site deployment URL',
  })
  deploymentUrl?: string;

  @ApiProperty({ example: 'deployed', description: 'Deployment status' })
  deploymentStatus?: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00Z',
    description: 'Last deployment time',
  })
  lastDeployedAt?: Date;

  @ApiProperty({ example: true, description: 'Site active status' })
  isActive: boolean;

  @ApiProperty({ example: 1250, description: 'Visitor count' })
  visitorCount: number;

  @ApiProperty({ example: 3750, description: 'Page views' })
  pageViews: number;

  @ApiProperty({
    example: '2024-01-01T00:00:00Z',
    description: 'Site creation time',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00Z',
    description: 'Last update time',
  })
  updatedAt: Date;
}

export class DeploySiteDto {
  @ApiPropertyOptional({
    example: false,
    description: 'Force deployment even if no changes',
  })
  @IsBoolean()
  @IsOptional()
  force?: boolean;

  @ApiPropertyOptional({
    example: 'production',
    description: 'Deployment environment',
  })
  @IsString()
  @IsOptional()
  environment?: string;
}

export class SiteDeploymentStatusDto {
  @ApiProperty({ example: 'uuid-string', description: 'Site ID' })
  id: string;

  @ApiProperty({ example: 'deployed', description: 'Deployment status' })
  deploymentStatus: string;

  @ApiProperty({
    example: 'https://mybusiness.logen.com',
    description: 'Deployment URL',
  })
  deploymentUrl?: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00Z',
    description: 'Last deployment time',
  })
  lastDeployedAt?: Date;

  @ApiProperty({
    example: 'Deployment completed successfully',
    description: 'Status message',
  })
  message?: string;
}

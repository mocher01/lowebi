import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsArray,
  IsBoolean,
  IsNumber,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  WizardStatus,
  WizardStep,
} from '../entities/website-wizard-session.entity';

export class StartWizardDto {
  @ApiPropertyOptional({
    example: 'My New Website Project',
    description: 'Session name for the wizard',
  })
  @IsString()
  @IsOptional()
  sessionName?: string;

  @ApiPropertyOptional({ description: 'Initial business information' })
  @IsObject()
  @IsOptional()
  businessInfo?: any;
}

export class UpdateWizardSessionDto {
  @ApiPropertyOptional({
    example: WizardStep.TEMPLATE_SELECTION,
    enum: WizardStep,
    description: 'Current wizard step',
  })
  @IsEnum(WizardStep)
  @IsOptional()
  currentStep?: WizardStep;

  @ApiPropertyOptional({ description: 'Business information data' })
  @IsObject()
  @IsOptional()
  businessInfo?: any;

  @ApiPropertyOptional({ description: 'Template selection data' })
  @IsObject()
  @IsOptional()
  templateSelection?: any;

  @ApiPropertyOptional({ description: 'Design preferences data' })
  @IsObject()
  @IsOptional()
  designPreferences?: any;

  @ApiPropertyOptional({ description: 'Content data' })
  @IsObject()
  @IsOptional()
  contentData?: any;

  @ApiPropertyOptional({ description: 'AI generation requests' })
  @IsObject()
  @IsOptional()
  aiGenerationRequests?: any;

  @ApiPropertyOptional({ description: 'Customization settings' })
  @IsObject()
  @IsOptional()
  customizationSettings?: any;

  @ApiPropertyOptional({ description: 'Final configuration' })
  @IsObject()
  @IsOptional()
  finalConfiguration?: any;

  @ApiPropertyOptional({ description: 'Deployment configuration' })
  @IsObject()
  @IsOptional()
  deploymentConfig?: any;

  @ApiPropertyOptional({
    example: [WizardStep.BUSINESS_INFO, WizardStep.TEMPLATE_SELECTION],
    description: 'Completed steps array',
  })
  @IsArray()
  @IsEnum(WizardStep, { each: true })
  @IsOptional()
  completedSteps?: WizardStep[];
}

export class CompleteWizardDto {
  @ApiProperty({
    example: 'my-new-site',
    description: 'Subdomain for the generated site',
  })
  @IsString()
  subdomain: string;

  @ApiPropertyOptional({
    example: 'My Amazing Website',
    description: 'Final site name',
  })
  @IsString()
  @IsOptional()
  siteName?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Deploy site immediately after creation',
  })
  @IsBoolean()
  @IsOptional()
  deployImmediately?: boolean;
}

export class WizardSessionResponseDto {
  @ApiProperty({ example: 'uuid-string', description: 'Wizard session ID' })
  id: string;

  @ApiProperty({
    example: 'My New Website Project',
    description: 'Session name',
  })
  sessionName?: string;

  @ApiProperty({
    example: WizardStatus.IN_PROGRESS,
    enum: WizardStatus,
    description: 'Session status',
  })
  status: WizardStatus;

  @ApiProperty({
    example: WizardStep.CONTENT_CREATION,
    enum: WizardStep,
    description: 'Current step',
  })
  currentStep: WizardStep;

  @ApiProperty({
    example: [WizardStep.BUSINESS_INFO, WizardStep.TEMPLATE_SELECTION],
    description: 'Completed steps',
  })
  completedSteps: WizardStep[];

  @ApiProperty({ example: 37, description: 'Progress percentage' })
  progressPercentage: number;

  @ApiProperty({ description: 'Business information' })
  businessInfo?: any;

  @ApiProperty({ description: 'Template selection' })
  templateSelection?: any;

  @ApiProperty({ description: 'Design preferences' })
  designPreferences?: any;

  @ApiProperty({ description: 'Content data' })
  contentData?: any;

  @ApiProperty({ description: 'AI generation requests' })
  aiGenerationRequests?: any;

  @ApiProperty({ description: 'Customization settings' })
  customizationSettings?: any;

  @ApiProperty({ description: 'Final configuration' })
  finalConfiguration?: any;

  @ApiProperty({
    example: 'uuid-string',
    description: 'Generated site ID (if completed)',
  })
  generatedSiteId?: string;

  @ApiProperty({ description: 'Deployment configuration' })
  deploymentConfig?: any;

  @ApiProperty({
    example: '2024-01-01T12:00:00Z',
    description: 'Session expiration time',
  })
  expiresAt: Date;

  @ApiProperty({
    example: '2024-01-01T10:30:00Z',
    description: 'Last activity time',
  })
  lastActivityAt: Date;

  @ApiProperty({
    example: 45,
    description: 'Estimated completion time in minutes',
  })
  estimatedCompletionTime?: number;

  @ApiProperty({
    example: '2024-01-01T09:00:00Z',
    description: 'Session creation time',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T10:30:00Z',
    description: 'Last update time',
  })
  updatedAt: Date;
}

export class BusinessInfoDto {
  @ApiProperty({ example: 'Acme Corporation', description: 'Business name' })
  @IsString()
  businessName: string;

  @ApiProperty({ example: 'technology', description: 'Business industry' })
  @IsString()
  industry: string;

  @ApiPropertyOptional({
    example: 'We provide innovative tech solutions',
    description: 'Business description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: ['Software Development', 'Consulting', 'Training'],
    description: 'Services offered',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  services?: string[];

  @ApiPropertyOptional({
    example: 'contact@acme.com',
    description: 'Contact email',
  })
  @IsString()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({ example: '+1234567890', description: 'Contact phone' })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({
    example: '123 Main St, City, State',
    description: 'Business address',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    example: 'https://existing-site.com',
    description: 'Existing website URL',
  })
  @IsString()
  @IsOptional()
  existingWebsite?: string;
}

export class TemplateSelectionDto {
  @ApiProperty({ example: 'uuid-string', description: 'Selected template ID' })
  @IsUUID()
  templateId: string;

  @ApiPropertyOptional({ description: 'Template customization preferences' })
  @IsObject()
  @IsOptional()
  customizations?: any;
}

export class DesignPreferencesDto {
  @ApiPropertyOptional({ example: '#1E40AF', description: 'Primary color' })
  @IsString()
  @IsOptional()
  primaryColor?: string;

  @ApiPropertyOptional({ example: '#64748B', description: 'Secondary color' })
  @IsString()
  @IsOptional()
  secondaryColor?: string;

  @ApiPropertyOptional({
    example: 'Inter, sans-serif',
    description: 'Font family',
  })
  @IsString()
  @IsOptional()
  fontFamily?: string;

  @ApiPropertyOptional({ example: 'modern', description: 'Design style' })
  @IsString()
  @IsOptional()
  style?: string;

  @ApiPropertyOptional({
    example: ['hero', 'services', 'about', 'contact'],
    description: 'Sections to include',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sections?: string[];
}

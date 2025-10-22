import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MaxLength,
  MinLength,
} from 'class-validator';
import { BlogPostStatus } from '../entities/blog-post.entity';

export class CreateBlogPostDto {
  @ApiProperty({
    description: 'Blog post title',
    example: 'Getting Started with Our Services',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    description: 'URL-friendly slug (auto-generated if not provided)',
    example: 'getting-started-with-our-services',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  slug?: string;

  @ApiPropertyOptional({
    description: 'Short excerpt/summary',
    example:
      'Learn how to get started with our amazing services in just 5 minutes.',
  })
  @IsString()
  @IsOptional()
  excerpt?: string;

  @ApiProperty({
    description: 'Blog post content (markdown supported)',
    example: '# Welcome\n\nThis is the content...',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  content: string;

  @ApiPropertyOptional({
    description: 'Blog post image URL',
    example: 'site-blog-1.png',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  image?: string;

  @ApiPropertyOptional({
    description: 'Post status',
    enum: BlogPostStatus,
    default: BlogPostStatus.DRAFT,
  })
  @IsEnum(BlogPostStatus)
  @IsOptional()
  status?: BlogPostStatus;
}

export class UpdateBlogPostDto {
  @ApiPropertyOptional({
    description: 'Blog post title',
    example: 'Updated Title',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    description: 'URL-friendly slug',
    example: 'updated-title',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  slug?: string;

  @ApiPropertyOptional({ description: 'Short excerpt/summary' })
  @IsString()
  @IsOptional()
  excerpt?: string;

  @ApiPropertyOptional({
    description: 'Blog post content (markdown supported)',
  })
  @IsString()
  @IsOptional()
  @MinLength(10)
  content?: string;

  @ApiPropertyOptional({ description: 'Blog post image URL' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  image?: string;

  @ApiPropertyOptional({ description: 'Post status', enum: BlogPostStatus })
  @IsEnum(BlogPostStatus)
  @IsOptional()
  status?: BlogPostStatus;
}

export class BlogPostResponseDto {
  @ApiProperty({ description: 'Blog post ID' })
  id: string;

  @ApiProperty({ description: 'Blog post title' })
  title: string;

  @ApiProperty({ description: 'URL-friendly slug' })
  slug: string;

  @ApiPropertyOptional({ description: 'Short excerpt' })
  excerpt?: string;

  @ApiProperty({ description: 'Blog post content' })
  content: string;

  @ApiPropertyOptional({ description: 'Blog post image URL' })
  image?: string;

  @ApiProperty({ description: 'Post status', enum: BlogPostStatus })
  status: BlogPostStatus;

  @ApiPropertyOptional({ description: 'When the post was published' })
  publishedAt?: Date;

  @ApiProperty({ description: 'When the post was created' })
  createdAt: Date;

  @ApiProperty({ description: 'When the post was last updated' })
  updatedAt: Date;

  @ApiProperty({ description: 'Whether the post is published' })
  isPublished: boolean;

  @ApiProperty({ description: 'Whether the post is a draft' })
  isDraft: boolean;
}

export class UpdatePageContentDto {
  @ApiPropertyOptional({ description: 'Section title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Section subtitle' })
  @IsString()
  @IsOptional()
  subtitle?: string;

  @ApiPropertyOptional({ description: 'Section description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Additional section data (JSON)' })
  @IsOptional()
  data?: any;
}

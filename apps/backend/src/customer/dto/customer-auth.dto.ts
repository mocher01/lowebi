import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../auth/entities/user.entity';

export class CustomerRegisterDto {
  @ApiProperty({
    example: 'customer@example.com',
    description: 'Customer email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'Customer password (minimum 8 characters)',
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: 'John', description: 'Customer first name' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe', description: 'Customer last name' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    example: 'My Business Inc.',
    description: 'Business name',
  })
  @IsString()
  @IsOptional()
  businessName?: string;

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'Customer phone number',
  })
  @IsString()
  @IsOptional()
  phone?: string;
}

export class CustomerLoginDto {
  @ApiProperty({
    example: 'customer@example.com',
    description: 'Customer email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'Customer password',
  })
  @IsString()
  password: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Remember me for extended session',
  })
  @IsBoolean()
  @IsOptional()
  rememberMe?: boolean;
}

export class CustomerProfileUpdateDto {
  @ApiPropertyOptional({ example: 'John', description: 'Customer first name' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe', description: 'Customer last name' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    example: 'My Business Inc.',
    description: 'Business name',
  })
  @IsString()
  @IsOptional()
  businessName?: string;

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'Customer phone number',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    example: '123 Main St, City, State',
    description: 'Business address',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    example: 'https://website.com',
    description: 'Existing website URL',
  })
  @IsString()
  @IsOptional()
  website?: string;
}

export class CustomerUserDto {
  @ApiProperty({ example: 'uuid-string', description: 'Customer ID' })
  id: string;

  @ApiProperty({
    example: 'customer@example.com',
    description: 'Customer email',
  })
  email: string;

  @ApiProperty({ example: 'John', description: 'Customer first name' })
  firstName?: string;

  @ApiProperty({ example: 'Doe', description: 'Customer last name' })
  lastName?: string;

  @ApiProperty({ example: 'customer', description: 'User role' })
  role: string;

  @ApiProperty({ example: false, description: 'Email verification status' })
  isEmailVerified: boolean;

  @ApiProperty({ example: 'active', description: 'Subscription status' })
  subscriptionStatus: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Created at' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Updated at' })
  updatedAt: string;
}

export class CustomerAuthResponseDto {
  @ApiProperty({ type: CustomerUserDto, description: 'Customer user data' })
  user: CustomerUserDto;

  @ApiProperty({ example: 'jwt-token-string', description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({
    example: 'refresh-token-string',
    description: 'JWT refresh token',
  })
  refreshToken: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00Z',
    description: 'Token expiration time',
  })
  expiresAt: Date;
}

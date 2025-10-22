import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class UpdateCustomerProfileDto {
  @ApiPropertyOptional({ description: 'First name of the customer' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name of the customer' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class CustomerProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  firstName?: string;

  @ApiPropertyOptional()
  lastName?: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CustomerSettingsDto {
  @ApiPropertyOptional({ description: 'Notification preferences' })
  @IsOptional()
  notifications?: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };

  @ApiPropertyOptional({ description: 'Theme preferences' })
  @IsOptional()
  theme?: {
    mode: 'light' | 'dark' | 'system';
    primaryColor: string;
  };

  @ApiPropertyOptional({ description: 'Language preference' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'Timezone preference' })
  @IsOptional()
  @IsString()
  timezone?: string;
}

import {
  IsUUID,
  IsString,
  IsDate,
  IsOptional,
  IsNumber,
  IsBoolean,
} from 'class-validator';

export class SessionResponseDto {
  @IsUUID()
  id: string;

  @IsUUID()
  userId: string;

  @IsString()
  userEmail: string;

  @IsOptional()
  @IsString()
  userFullName?: string;

  @IsOptional()
  @IsString()
  deviceInfo?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsDate()
  createdAt: Date;

  @IsDate()
  lastActiveAt: Date;

  @IsDate()
  expiresAt: Date;

  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  @IsString()
  location?: string;
}

export class SessionListResponseDto {
  sessions: SessionResponseDto[];

  @IsNumber()
  total: number;

  @IsNumber()
  page: number;

  @IsNumber()
  limit: number;
}

export class TerminateSessionDto {
  @IsUUID()
  sessionId: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class BulkTerminateSessionsDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

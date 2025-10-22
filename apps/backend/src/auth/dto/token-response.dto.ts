import { User } from '../entities/user.entity';
import { Exclude, Expose, Transform } from 'class-transformer';
import { IsString } from 'class-validator';

export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  firstName?: string;

  @Expose()
  lastName?: string;

  @Expose()
  role: string;

  @Expose()
  isActive: boolean;

  @Expose()
  emailVerified: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  @Transform(({ obj }) => `${obj.firstName || ''} ${obj.lastName || ''}`.trim())
  fullName: string;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}

export class TokenResponseDto {
  accessToken: string;
  refreshToken: string;
  user: UserResponseDto;

  constructor(accessToken: string, refreshToken: string, user: User) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.user = new UserResponseDto(user);
  }
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

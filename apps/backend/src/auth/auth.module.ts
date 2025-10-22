import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OAuth2Service } from './services/oauth2.service';
import { User } from './entities/user.entity';
import { Session } from './entities/session.entity';
import { VerificationToken } from './entities/password-reset-token.entity';
import { OAuth2Credential } from './entities/oauth2-credential.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Session,
      VerificationToken,
      OAuth2Credential,
    ]),
    PassportModule,
    CommonModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, OAuth2Service, JwtStrategy, LocalStrategy],
  exports: [AuthService, OAuth2Service, JwtModule],
})
export class AuthModule {}

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { User } from './auth/entities/user.entity';
import { AdminModule } from './admin/admin.module';
import { CustomerModule } from './customer/customer.module';
import { HealthModule } from './health/health.module';
import { SecurityModule } from './security/security.module';
import { TemplatesModule } from './templates/templates.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
// import { PerformanceInterceptor } from './common/interceptors/performance.interceptor';
// import { CacheInterceptor } from './common/interceptors/cache.interceptor';
// import { ApiOptimizationService } from './common/services/api-optimization.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // V2.1: Serve static files from /public directory for uploaded images
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST') || 'localhost',
        port: parseInt(configService.get<string>('DB_PORT') || '5432'),
        username: configService.get<string>('DB_USERNAME') || 'locod_user',
        password: configService.get<string>('DB_PASSWORD') || 'locod_pass_2024',
        database: configService.get<string>('DB_DATABASE') || 'locod_db',
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Disable to avoid conflicts with existing data
        logging: configService.get<string>('NODE_ENV') === 'development',
        ssl: (() => {
          const dbSsl = configService.get<string>('DB_SSL');
          const nodeEnv = configService.get<string>('NODE_ENV');

          // Explicit SSL control via environment variable
          if (dbSsl === 'false' || dbSsl === 'disabled' || dbSsl === 'no') {
            return false;
          }

          if (dbSsl === 'require' || dbSsl === 'strict') {
            // Require SSL with certificate validation
            return {
              rejectUnauthorized: true,
              checkServerIdentity: (host, cert) => {
                // Custom certificate validation if needed
                return undefined;
              },
            };
          }

          if (dbSsl === 'prefer' || dbSsl === 'allow' || dbSsl === 'true') {
            // Use SSL but allow self-signed certificates (common for local/internal)
            return {
              rejectUnauthorized: false,
              checkServerIdentity: () => undefined,
            };
          }

          // Default behavior based on environment
          if (nodeEnv === 'production') {
            // Production: prefer SSL but allow self-signed
            return { rejectUnauthorized: false };
          }

          // Development: no SSL by default
          return false;
        })(),
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User]), // Add User entity for AppController health check
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 3, // 3 requests per second for admin operations
      },
      {
        name: 'medium',
        ttl: 10000, // 10 seconds
        limit: 20, // 20 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    AuthModule,
    AdminModule,
    CustomerModule,
    HealthModule,
    SecurityModule,
    TemplatesModule,
    InfrastructureModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // PerformanceInterceptor,
    // CacheInterceptor,
    // ApiOptimizationService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: PerformanceInterceptor,
    // },
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: CacheInterceptor,
    // },
  ],
})
export class AppModule {}

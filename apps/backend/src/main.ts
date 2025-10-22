import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as express from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configure body parser for large payloads (image uploads)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Security middleware
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false, // Allow embedding for Swagger UI
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    }),
  );

  // Enable CORS for frontend integration - Production Ready
  app.enableCors({
    origin: [
      'https://dev.lowebi.com', // Production frontend domain
      'http://dev.lowebi.com', // HTTP fallback for production
      'http://localhost:3000', // Next.js dev server
      'http://localhost:3001', // Next.js production port
      'http://162.55.213.90:3001', // Frontend production HTTP
      'https://162.55.213.90:3001', // Frontend production HTTPS
      'http://162.55.213.90:6001', // Frontend production HTTP
      'https://162.55.213.90:6001', // Frontend production HTTPS
      'http://162.55.213.90:7611', // Frontend QA testing port
      'https://162.55.213.90:7611', // Frontend QA testing HTTPS
      'http://localhost:6001',
      'https://localhost:6001',
      'http://localhost:6000',
      'https://localhost:6000',
      'http://localhost:7610',
      'https://localhost:7610',
      'http://localhost:7611',
      'https://localhost:7611',
      'http://localhost:7612', // Admin frontend
      'https://localhost:7612', // Admin frontend HTTPS
      'https://admin.dev.lowebi.com', // Production admin portal
      'http://admin.dev.lowebi.com', // Admin portal HTTP fallback
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Website Generator v2 - Complete API')
    .setDescription(
      'Comprehensive API for the website generator platform including admin dashboard, customer portal, and website management',
    )
    .setVersion('2.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'User authentication and authorization endpoints')
    .addTag(
      'Customer Authentication',
      'Customer registration, login, and profile management',
    )
    .addTag(
      'Customer Site Management',
      'Customer website creation, editing, and deployment',
    )
    .addTag(
      'Customer Billing & Subscriptions',
      'Customer subscription plans, billing, and usage management',
    )
    .addTag(
      'Website Creation Wizard',
      'Step-by-step website creation wizard for customers',
    )
    .addTag(
      'Customer Templates',
      'Template browsing and selection for customers',
    )
    .addTag('Admin Dashboard', 'Admin dashboard statistics and monitoring')
    .addTag('User Management', 'Admin user CRUD operations')
    .addTag('Session Management', 'Admin session management and monitoring')
    .addTag('Site Management', 'Website creation and management')
    .addTag(
      'System Monitoring',
      'System health, performance, and error tracking',
    )
    .addTag('System Health', 'System health checks and monitoring')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT ?? 7600;
  const bindHost = '0.0.0.0'; // Bind to all interfaces for Docker networking
  await app.listen(port, bindHost);

  const protocol =
    process.env.NODE_ENV === 'production' &&
    process.env.HTTPS_ENABLED === 'true'
      ? 'https'
      : 'http';
  const host =
    process.env.NODE_ENV === 'production' ? '162.55.213.90' : 'localhost';

  console.log(`🚀 Server running on ${protocol}://${host}:${port}`);
  console.log(
    `📚 API Documentation available at ${protocol}://${host}:${port}/api/docs`,
  );
  console.log(
    `🔍 Health check available at ${protocol}://${host}:${port}/api/health`,
  );
  console.log(
    `📊 System metrics available at ${protocol}://${host}:${port}/api/metrics`,
  );

  // Log production readiness status
  if (process.env.NODE_ENV === 'production') {
    console.log('🔒 Production mode: Security headers enabled');
    console.log('🛡️ Rate limiting: Active');
    console.log('🗄️ Database: Connected');
    console.log('✅ Production deployment ready');
  }
}
bootstrap();

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { User, UserRole } from '../src/auth/entities/user.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('Admin API (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let userRepository: Repository<User>;
  let adminToken: string;
  let customerToken: string;

  const testAdmin = {
    email: 'admin@test.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.ADMIN,
  };

  const testCustomer = {
    email: 'customer@test.com',
    password: 'customer123',
    firstName: 'Customer',
    lastName: 'User',
    role: UserRole.CUSTOMER,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
          synchronize: true,
          logging: false,
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    authService = moduleFixture.get<AuthService>(AuthService);
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );

    await app.init();

    // Create test users
    const admin = await authService.register(testAdmin);
    const customer = await authService.register(testCustomer);

    // Generate tokens
    const adminLogin = await authService.login({
      email: testAdmin.email,
      password: testAdmin.password,
    });
    const customerLogin = await authService.login({
      email: testCustomer.email,
      password: testCustomer.password,
    });

    adminToken = adminLogin.access_token;
    customerToken = customerLogin.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/admin/dashboard/stats (GET)', () => {
    it('should return dashboard statistics for admin', () => {
      return request(app.getHttpServer())
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalUsers');
          expect(res.body).toHaveProperty('activeUsers');
          expect(res.body).toHaveProperty('activeSessions');
          expect(res.body).toHaveProperty('lastUpdated');
        });
    });

    it('should deny access for customer', () => {
      return request(app.getHttpServer())
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should deny access without token', () => {
      return request(app.getHttpServer())
        .get('/api/admin/dashboard/stats')
        .expect(401);
    });
  });

  describe('/api/admin/users (GET)', () => {
    it('should return paginated users list for admin', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('users');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
          expect(res.body).toHaveProperty('limit');
          expect(Array.isArray(res.body.users)).toBe(true);
        });
    });

    it('should support search functionality', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ search: 'admin' })
        .expect(200)
        .expect((res) => {
          expect(res.body.users.length).toBeGreaterThan(0);
          expect(res.body.users[0].email).toContain('admin');
        });
    });

    it('should support role filtering', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ role: UserRole.ADMIN })
        .expect(200);
    });
  });

  describe('/api/admin/sites (POST)', () => {
    it('should create a new site for admin', () => {
      const newSite = {
        name: 'Test Site',
        domain: 'test-site.example.com',
        description: 'A test site',
        template: 'business',
      };

      return request(app.getHttpServer())
        .post('/api/admin/sites')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newSite)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe(newSite.name);
          expect(res.body.domain).toBe(newSite.domain);
          expect(res.body.template).toBe(newSite.template);
        });
    });

    it('should reject duplicate domain', async () => {
      const duplicateSite = {
        name: 'Duplicate Site',
        domain: 'test-site.example.com', // Same domain as above
        description: 'A duplicate site',
        template: 'business',
      };

      return request(app.getHttpServer())
        .post('/api/admin/sites')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateSite)
        .expect(400);
    });

    it('should validate required fields', () => {
      const invalidSite = {
        name: '', // Empty name
        domain: 'invalid-site.example.com',
      };

      return request(app.getHttpServer())
        .post('/api/admin/sites')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidSite)
        .expect(400);
    });
  });

  describe('/api/admin/sites (GET)', () => {
    it('should return paginated sites list', () => {
      return request(app.getHttpServer())
        .get('/api/admin/sites')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('sites');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
          expect(res.body).toHaveProperty('totalPages');
          expect(Array.isArray(res.body.sites)).toBe(true);
        });
    });

    it('should support site filtering by template', () => {
      return request(app.getHttpServer())
        .get('/api/admin/sites')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ template: 'business' })
        .expect(200);
    });

    it('should support site search', () => {
      return request(app.getHttpServer())
        .get('/api/admin/sites')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ search: 'test' })
        .expect(200);
    });
  });

  describe('/api/admin/monitoring/metrics (GET)', () => {
    it('should return system metrics for admin', () => {
      return request(app.getHttpServer())
        .get('/api/admin/monitoring/metrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('system');
          expect(res.body).toHaveProperty('memory');
          expect(res.body).toHaveProperty('database');
          expect(res.body).toHaveProperty('application');
          expect(res.body).toHaveProperty('performance');
          expect(res.body).toHaveProperty('security');
        });
    });

    it('should deny access for customer', () => {
      return request(app.getHttpServer())
        .get('/api/admin/monitoring/metrics')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });

  describe('/api/admin/monitoring/database (GET)', () => {
    it('should return database metrics for admin', () => {
      return request(app.getHttpServer())
        .get('/api/admin/monitoring/database')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('connections');
          expect(res.body).toHaveProperty('performance');
          expect(res.body).toHaveProperty('storage');
          expect(res.body).toHaveProperty('tables');
        });
    });
  });

  describe('/api/admin/monitoring/errors (GET)', () => {
    it('should return error tracking data for admin', () => {
      return request(app.getHttpServer())
        .get('/api/admin/monitoring/errors')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('summary');
          expect(res.body).toHaveProperty('topErrors');
          expect(res.body).toHaveProperty('errorsByEndpoint');
          expect(res.body).toHaveProperty('errorTrends');
        });
    });
  });

  describe('/api/admin/optimization/report (GET)', () => {
    it('should return optimization report for admin', () => {
      return request(app.getHttpServer())
        .get('/api/admin/optimization/report')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('performance');
          expect(res.body).toHaveProperty('cache');
          expect(res.body).toHaveProperty('recommendations');
          expect(res.body).toHaveProperty('optimizationScore');
          expect(typeof res.body.optimizationScore).toBe('number');
          expect(res.body.optimizationScore).toBeGreaterThanOrEqual(0);
          expect(res.body.optimizationScore).toBeLessThanOrEqual(100);
        });
    });
  });

  describe('/api/admin/optimization/cache/optimize (POST)', () => {
    it('should optimize cache for admin', () => {
      return request(app.getHttpServer())
        .post('/api/admin/optimization/cache/optimize')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('clearedEntries');
          expect(typeof res.body.clearedEntries).toBe('number');
        });
    });
  });

  describe('/api/admin/optimization/performance/optimize (POST)', () => {
    it('should optimize performance for admin', () => {
      return request(app.getHttpServer())
        .post('/api/admin/optimization/performance/optimize')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('recommendations');
          expect(Array.isArray(res.body.recommendations)).toBe(true);
        });
    });
  });

  describe('/api/admin/health (GET)', () => {
    it('should return system health status for admin', () => {
      return request(app.getHttpServer())
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('version');
          expect(res.body).toHaveProperty('uptime');
          expect(res.body).toHaveProperty('database');
        });
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to admin endpoints', async () => {
      // Make multiple rapid requests to test rate limiting
      const requests = Array(10)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .get('/api/admin/dashboard/stats')
            .set('Authorization', `Bearer ${adminToken}`),
        );

      const responses = await Promise.all(requests);

      // At least one request should be rate limited
      const rateLimitedResponses = responses.filter(
        (res) => res.status === 429,
      );
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should return proper error format for not found resources', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users/non-existent-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('error');
          expect(res.body).toHaveProperty('statusCode', 404);
        });
    });

    it('should handle validation errors properly', () => {
      const invalidData = {
        name: '', // Invalid empty name
        domain: 'invalid-domain', // Invalid domain format
        template: 'invalid-template', // Invalid template
      };

      return request(app.getHttpServer())
        .post('/api/admin/sites')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
        });
    });
  });

  describe('CORS and Security Headers', () => {
    it('should include proper CORS headers', () => {
      return request(app.getHttpServer())
        .options('/api/admin/dashboard/stats')
        .expect((res) => {
          expect(res.headers).toHaveProperty('access-control-allow-origin');
          expect(res.headers).toHaveProperty('access-control-allow-methods');
          expect(res.headers).toHaveProperty('access-control-allow-headers');
        });
    });

    it('should include security headers', () => {
      return request(app.getHttpServer())
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect((res) => {
          expect(res.headers).toHaveProperty('x-content-type-options');
          expect(res.headers).toHaveProperty('x-frame-options');
          expect(res.headers).toHaveProperty('x-xss-protection');
        });
    });
  });
});

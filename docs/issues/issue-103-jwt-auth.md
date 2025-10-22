# Issue #103 - JWT Authentication Implementation

**Parent Issue:** #44 (Portal v2.0)  
**Type:** Feature  
**Component:** Backend  
**Priority:** High 🔥  
**Version:** v2.0.0-alpha  

## 📋 Summary

Implement complete JWT-based authentication system for the v2.0 NestJS backend, providing secure user registration, login, and session management with role-based access control.

## 🎯 Objectives

- Secure user authentication with JWT tokens
- Role-based access control (customer/admin)
- Session management with refresh tokens
- Protected API endpoints
- Integration with PostgreSQL user tables

## 🏗️ Technical Requirements

### 1. **Dependencies**
```json
{
  "@nestjs/jwt": "^10.2.0",
  "@nestjs/passport": "^10.0.3",
  "passport": "^0.7.0",
  "passport-jwt": "^4.0.1",
  "passport-local": "^1.0.0",
  "bcrypt": "^5.1.1"
}
```

### 2. **Module Structure**
```
v2/backend/src/auth/
├── auth.module.ts
├── auth.service.ts
├── auth.controller.ts
├── strategies/
│   ├── jwt.strategy.ts
│   └── local.strategy.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   ├── local-auth.guard.ts
│   └── roles.guard.ts
├── decorators/
│   ├── current-user.decorator.ts
│   └── roles.decorator.ts
├── dto/
│   ├── register.dto.ts
│   ├── login.dto.ts
│   └── token-response.dto.ts
└── entities/
    └── refresh-token.entity.ts
```

## 📌 Implementation Tasks

### Phase 1: Core Setup
- [ ] Create auth module structure
- [ ] Configure JWT module with secret and expiration
- [ ] Set up Passport strategies (local + JWT)
- [ ] Create user service for database operations

### Phase 2: Authentication Endpoints
- [ ] **POST /auth/register** - User registration
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Doe",
    "companyName": "ACME Corp"
  }
  ```

- [ ] **POST /auth/login** - User login
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }
  Response:
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "customer"
    }
  }
  ```

- [ ] **POST /auth/refresh** - Refresh access token
- [ ] **POST /auth/logout** - Invalidate refresh token
- [ ] **GET /auth/profile** - Get current user (protected)

### Phase 3: Guards & Decorators
- [ ] Implement JWT auth guard for protected routes
- [ ] Create roles guard for admin-only endpoints
- [ ] Create @CurrentUser() decorator
- [ ] Create @Roles() decorator for role-based access

### Phase 4: Security Features
- [ ] Password hashing with bcrypt (10 rounds)
- [ ] JWT token expiration (15 minutes access, 7 days refresh)
- [ ] Refresh token rotation
- [ ] Rate limiting on auth endpoints
- [ ] Session tracking in database

## 🔐 Security Configuration

### Environment Variables
```env
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRATION=15m
REFRESH_TOKEN_SECRET=another-secret-for-refresh-tokens
REFRESH_TOKEN_EXPIRATION=7d
BCRYPT_ROUNDS=10
```

### Token Structure
```typescript
interface JwtPayload {
  sub: string;        // User ID
  email: string;      // User email
  role: string;       // 'customer' | 'admin'
  iat: number;        // Issued at
  exp: number;        // Expiration
}
```

## ✅ Acceptance Criteria

### Functional Requirements
- [ ] Users can register with email/password
- [ ] Email uniqueness is enforced
- [ ] Users can login and receive JWT tokens
- [ ] Access tokens expire after 15 minutes
- [ ] Refresh tokens can generate new access tokens
- [ ] Protected endpoints require valid JWT
- [ ] Admin endpoints require admin role
- [ ] Logout invalidates refresh token

### Security Requirements
- [ ] Passwords are hashed with bcrypt
- [ ] JWT secrets are environment variables
- [ ] No sensitive data in JWT payload
- [ ] SQL injection protection via TypeORM
- [ ] Rate limiting prevents brute force

### Testing Requirements
- [ ] Unit tests for auth service
- [ ] Integration tests for auth endpoints
- [ ] Test invalid credentials handling
- [ ] Test token expiration
- [ ] Test role-based access

## 🧪 Testing Scenarios

### 1. **Registration Flow**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### 2. **Login Flow**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

### 3. **Protected Endpoint**
```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📊 Database Schema

### Users Table (existing)
```sql
auth.users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'customer',
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

### Sessions Table (existing)
```sql
auth.sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  token VARCHAR(500) UNIQUE NOT NULL,
  refresh_token VARCHAR(500) UNIQUE,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

## 🔄 Integration Points

- **Frontend:** Next.js will use these endpoints for authentication
- **Database:** PostgreSQL via TypeORM for user storage
- **Sites Module:** Will use guards to protect site CRUD operations
- **Admin Module:** Will use role guards for admin-only features

## 📈 Success Metrics

- [ ] All auth endpoints return < 100ms
- [ ] 100% test coverage for auth module
- [ ] Zero security vulnerabilities in auth flow
- [ ] Successful integration with frontend

## 🚀 Definition of Done

- [ ] All endpoints implemented and working
- [ ] Guards protecting appropriate routes
- [ ] Unit and integration tests passing
- [ ] Documentation updated
- [ ] Security review completed
- [ ] Frontend can authenticate successfully
- [ ] Branch 103 created as backup

## 📝 Notes

- Use existing auth.users and auth.sessions tables from init.sql
- Admin user (admin@locod.ai) already exists with bcrypt hash
- Consider adding OAuth providers in future (Issue #XXX)
- Rate limiting via @nestjs/throttler recommended

---

**Created:** August 2024  
**Assignee:** TBD  
**Sprint:** v2.0.0-alpha Week 1  
**Estimated:** 2-3 days
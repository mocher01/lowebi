# JWT Authentication Testing Guide

This guide shows how to test the JWT authentication endpoints.

## Prerequisites

1. PostgreSQL database running on localhost:5433
2. Backend server running on localhost:3000
3. Environment variables configured in .env file

## Starting the Application

```bash
# Build the application
npm run build

# Start in development mode
npm run start:dev

# Or start built version
npm run start:prod
```

## API Endpoints Testing

### 1. Health Check (Public)

```bash
curl -X GET http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-08-15T09:30:00.000Z",
  "service": "locod-backend-v2"
}
```

### 2. User Registration

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "User"
  }'
```

Expected response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "role": "customer",
    "isActive": true,
    "emailVerified": false,
    "createdAt": "2024-08-15T09:30:00.000Z",
    "fullName": "Test User"
  }
}
```

### 3. User Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

### 4. Get Profile (Protected)

```bash
# Replace YOUR_JWT_TOKEN with the actual token from login/register response
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Refresh Token

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### 6. Logout

```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### 7. Admin Endpoint (Admin Role Required)

```bash
# First login as admin user (admin@locod.ai with password 'admin123')
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@locod.ai",
    "password": "admin123"
  }'

# Then use the admin token
curl -X GET http://localhost:3000/auth/admin/users \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

## Error Responses

### Validation Errors
```json
{
  "statusCode": 400,
  "message": [
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
  ],
  "error": "Bad Request"
}
```

### Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Conflict (User Already Exists)
```json
{
  "statusCode": 409,
  "message": "User with this email already exists",
  "error": "Conflict"
}
```

## Database Setup

If you need to start the PostgreSQL database:

```bash
# Using Docker Compose (if available)
docker compose up -d postgres

# Or manually with Docker
docker run --name locod-postgres \
  -e POSTGRES_USER=locod_user \
  -e POSTGRES_PASSWORD=locod_pass_2024 \
  -e POSTGRES_DB=locod_db \
  -p 5433:5432 \
  -d postgres:15

# Initialize the database with the schema
# Run the init.sql file located in v2/docker/init.sql
```

## Security Features Implemented

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT tokens with configurable expiration (15 minutes default)
- ✅ Refresh tokens with longer expiration (7 days default)
- ✅ Role-based access control (customer/admin)
- ✅ Session tracking in database
- ✅ Input validation with class-validator
- ✅ CORS configuration
- ✅ Global authentication guard
- ✅ Public route decorator for unprotected endpoints

## Development Notes

- All routes are protected by default (JwtAuthGuard is global)
- Use @Public() decorator to make routes accessible without authentication
- Use @Roles() decorator to restrict access to specific roles
- Use @CurrentUser() decorator to get the authenticated user in controllers
- Passwords must be at least 8 characters with uppercase, lowercase, number, and special character
- JWT secrets are loaded from environment variables
- Database connection uses TypeORM with PostgreSQL
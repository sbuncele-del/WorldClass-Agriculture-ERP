# Phase 2: Authentication System - Testing Guide

## Overview
This guide provides complete testing instructions for the authentication system including signup, login, token refresh, password reset, and user info endpoints.

## Prerequisites
- Backend server running (`npm run dev` in `/backend`)
- PostgreSQL database with multi-tenant schema deployed
- Postman or curl installed

## Environment Setup

### 1. Start Backend Server
```bash
cd backend
npm run dev
```

Server should start on `http://localhost:3000`

### 2. Verify Health Check
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

## API Endpoints

### Base URL
```
http://localhost:3000/api/auth
```

### Available Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/signup` | Company signup | No |
| POST | `/login` | User login | No |
| POST | `/refresh` | Refresh access token | No |
| POST | `/logout` | Revoke refresh token | No |
| POST | `/forgot-password` | Request password reset | No |
| POST | `/reset-password` | Reset password with token | No |
| GET | `/me` | Get current user info | Yes |
| GET | `/verify-email/:token` | Verify email (not implemented) | No |
| POST | `/resend-verification` | Resend verification (not implemented) | No |

---

## Test Cases

### TEST 1: Company Signup (Success)

**Endpoint:** `POST /api/auth/signup`

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Acme Corporation",
    "companySlug": "acme-corp",
    "email": "admin@acme.com",
    "password": "Acme123!",
    "firstName": "John",
    "lastName": "Smith",
    "plan": "professional",
    "billingCycle": "monthly"
  }'
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Company account created successfully",
  "data": {
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    },
    "tenant": {
      "id": "uuid",
      "slug": "acme-corp",
      "name": "Acme Corporation",
      "status": "trial",
      "trialEndsAt": "2024-12-21T..."
    },
    "user": {
      "id": "uuid",
      "email": "admin@acme.com",
      "firstName": "John",
      "lastName": "Smith",
      "role": "admin"
    }
  }
}
```

**Validation:**
- Tenant created in `tenants` table with `status = 'trial'`
- User created in `users` table with `role = 'admin'`
- Refresh token stored in `refresh_tokens` table
- Trial period set to 14 days from now
- Audit log entry created

---

### TEST 2: Signup Validation (Missing Fields)

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Acme Corporation",
    "email": "admin@acme.com"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "Missing required fields",
  "required": ["companyName", "email", "password", "firstName", "lastName"]
}
```

---

### TEST 3: Signup Validation (Duplicate Email)

**Request:** (Use same email as Test 1)
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Another Company",
    "email": "admin@acme.com",
    "password": "Test123!",
    "firstName": "Jane",
    "lastName": "Doe",
    "plan": "starter",
    "billingCycle": "monthly"
  }'
```

**Expected Response (409 Conflict):**
```json
{
  "error": "Email already registered"
}
```

---

### TEST 4: Signup Validation (Weak Password)

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Test Company",
    "email": "test@example.com",
    "password": "weak",
    "firstName": "Test",
    "lastName": "User",
    "plan": "starter",
    "billingCycle": "monthly"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number"
}
```

---

### TEST 5: User Login (Success)

**Endpoint:** `POST /api/auth/login`

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme.com",
    "password": "Acme123!"
  }'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    },
    "tenant": {
      "id": "uuid",
      "slug": "acme-corp",
      "name": "Acme Corporation",
      "status": "trial",
      "trialEndsAt": "2024-12-21T..."
    },
    "user": {
      "id": "uuid",
      "email": "admin@acme.com",
      "firstName": "John",
      "lastName": "Smith",
      "role": "admin"
    }
  }
}
```

**Validation:**
- `users.last_login_at` updated
- `users.failed_login_attempts` reset to 0
- Audit log entry created

---

### TEST 6: Login with Tenant Slug

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme.com",
    "password": "Acme123!",
    "tenantSlug": "acme-corp"
  }'
```

**Expected Response:** Same as Test 5

**Use Case:** When user email exists in multiple tenants

---

### TEST 7: Login Failure (Invalid Credentials)

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme.com",
    "password": "WrongPassword123!"
  }'
```

**Expected Response (401 Unauthorized):**
```json
{
  "error": "Invalid email or password"
}
```

**Validation:**
- `users.failed_login_attempts` incremented
- After 5 failed attempts, account locked for 15 minutes

---

### TEST 8: Refresh Access Token

**Endpoint:** `POST /api/auth/refresh`

**Request:** (Use refreshToken from Test 5)
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

**Notes:**
- Returns new access token
- Refresh token remains the same
- Use case: When access token expires (1 hour)

---

### TEST 9: Get Current User Info

**Endpoint:** `GET /api/auth/me`

**Request:** (Use accessToken from Test 5)
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@acme.com",
    "first_name": "John",
    "last_name": "Smith",
    "role": "admin",
    "status": "active",
    "phone": null,
    "avatar_url": null,
    "preferences": {
      "language": "en",
      "theme": "light",
      "notifications": {
        "email": true,
        "sms": false,
        "push": true
      }
    },
    "last_login_at": "2024-12-07T...",
    "tenant_id": "uuid",
    "tenant_name": "Acme Corporation",
    "tenant_slug": "acme-corp",
    "subscription_plan": "professional",
    "trial_ends_at": "2024-12-21T..."
  }
}
```

---

### TEST 10: Logout (Revoke Refresh Token)

**Endpoint:** `POST /api/auth/logout`

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Validation:**
- `refresh_tokens.revoked` set to `true`
- Token can no longer be used for refresh

---

### TEST 11: Forgot Password

**Endpoint:** `POST /api/auth/forgot-password`

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme.com"
  }'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "If the email exists, a password reset link has been sent"
}
```

**Validation:**
- `users.reset_token` generated (32-byte hex string)
- `users.reset_token_expires_at` set to 1 hour from now
- Email sent (when email service implemented)

---

### TEST 12: Reset Password

**Endpoint:** `POST /api/auth/reset-password`

**Request:** (Use reset_token from database)
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "resetToken": "abc123...",
    "newPassword": "NewPassword123!"
  }'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Validation:**
- `users.password_hash` updated
- `users.reset_token` and `reset_token_expires_at` cleared
- `users.password_changed_at` updated

---

## JWT Token Structure

### Access Token (1 hour expiry)
```json
{
  "userId": "uuid",
  "tenantId": "uuid",
  "email": "admin@acme.com",
  "role": "admin",
  "type": "access",
  "iat": 1701964800,
  "exp": 1701968400
}
```

### Refresh Token (7 days expiry)
```json
{
  "userId": "uuid",
  "tenantId": "uuid",
  "type": "refresh",
  "iat": 1701964800,
  "exp": 1702569600
}
```

---

## Postman Collection

### Import JSON
Save this as `auth-endpoints.postman_collection.json`:

```json
{
  "info": {
    "name": "Aetheros ERP - Authentication",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Signup",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"companyName\": \"Acme Corporation\",\n  \"companySlug\": \"acme-corp\",\n  \"email\": \"admin@acme.com\",\n  \"password\": \"Acme123!\",\n  \"firstName\": \"John\",\n  \"lastName\": \"Smith\",\n  \"plan\": \"professional\",\n  \"billingCycle\": \"monthly\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/auth/signup",
          "host": ["{{baseUrl}}"],
          "path": ["api", "auth", "signup"]
        }
      }
    },
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"admin@acme.com\",\n  \"password\": \"Acme123!\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/auth/login",
          "host": ["{{baseUrl}}"],
          "path": ["api", "auth", "login"]
        }
      }
    },
    {
      "name": "Get Current User",
      "request": {
        "method": "GET",
        "header": [{"key": "Authorization", "value": "Bearer {{accessToken}}"}],
        "url": {
          "raw": "{{baseUrl}}/api/auth/me",
          "host": ["{{baseUrl}}"],
          "path": ["api", "auth", "me"]
        }
      }
    },
    {
      "name": "Refresh Token",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"refreshToken\": \"{{refreshToken}}\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/auth/refresh",
          "host": ["{{baseUrl}}"],
          "path": ["api", "auth", "refresh"]
        }
      }
    },
    {
      "name": "Logout",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"refreshToken\": \"{{refreshToken}}\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/auth/logout",
          "host": ["{{baseUrl}}"],
          "path": ["api", "auth", "logout"]
        }
      }
    },
    {
      "name": "Forgot Password",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"admin@acme.com\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/auth/forgot-password",
          "host": ["{{baseUrl}}"],
          "path": ["api", "auth", "forgot-password"]
        }
      }
    },
    {
      "name": "Reset Password",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"resetToken\": \"reset-token-here\",\n  \"newPassword\": \"NewPassword123!\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/auth/reset-password",
          "host": ["{{baseUrl}}"],
          "path": ["api", "auth", "reset-password"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    },
    {
      "key": "accessToken",
      "value": ""
    },
    {
      "key": "refreshToken",
      "value": ""
    }
  ]
}
```

---

## Security Checklist

### ✅ Implemented
- [x] Password hashing with bcrypt (10 rounds)
- [x] JWT tokens with expiry (1 hour access, 7 days refresh)
- [x] Failed login tracking (5 attempts = 15min lock)
- [x] Password validation (min 8 chars, uppercase, lowercase, number)
- [x] Email validation (regex pattern)
- [x] Tenant isolation (tenantId in JWT)
- [x] Role-based access (admin, manager, user, viewer)
- [x] Refresh token storage and revocation
- [x] Audit logging for sensitive actions

### 🔄 To Implement (Phase 3+)
- [ ] Email verification on signup
- [ ] Password reset email sending
- [ ] Rate limiting on login attempts
- [ ] CSRF protection
- [ ] Session management (multiple devices)
- [ ] 2FA/MFA support
- [ ] OAuth2 integration (Google, Microsoft)
- [ ] IP-based geolocation restrictions
- [ ] Account lockout policies

---

## Testing with Demo Tenant

**Demo Credentials:**
```
Email: demo@aetheros.co.za
Password: Demo123!
Tenant Slug: demo
Tenant ID: 00000000-0000-0000-0000-000000000001
```

**Demo Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@aetheros.co.za",
    "password": "Demo123!",
    "tenantSlug": "demo"
  }'
```

---

## Troubleshooting

### Error: "Database connection failed"
- Check if PostgreSQL is running
- Verify DATABASE_URL in `.env` file
- Test connection: `psql postgresql://...`

### Error: "Invalid token"
- Check JWT_SECRET is set in `.env`
- Ensure token hasn't expired (check `exp` claim)
- Verify Authorization header format: `Bearer <token>`

### Error: "Email already registered"
- User with that email already exists
- Use different email or delete existing user

### Error: "Account is temporarily locked"
- Too many failed login attempts
- Wait 15 minutes or reset in database:
  ```sql
  UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE email = 'user@example.com';
  ```

---

## Next Steps

After authentication system is tested:
1. ✅ Phase 2 Complete
2. 🔄 Phase 3: Tenant Provisioning (auto-create chart of accounts)
3. 🔄 Phase 3: Onboarding Wizard UI
4. 🔄 Phase 4: Ozow Payment Integration
5. 🔄 Phase 4: Subscription Management

---

## Files Created in Phase 2

1. `backend/src/auth/auth.service.ts` - Authentication business logic
2. `backend/src/auth/auth.controller.ts` - HTTP request handlers
3. `backend/src/auth/auth.routes.ts` - Express route definitions
4. `backend/src/index.ts` - Updated with auth routes
5. `backend/.env` - Added JWT_SECRET
6. `backend/PHASE-2-AUTH-TESTING.md` - This file

---

**Testing Completed:** ___________  
**Phase 2 Status:** ✅ READY FOR TESTING  
**Next Phase:** Tenant Provisioning + Onboarding Wizard

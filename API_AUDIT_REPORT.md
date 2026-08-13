# HTI LMS Backend — API Audit Report

> **Audit Date:** 2026-06-17  
> **Auditor:** Automated Full-Codebase Analysis  
> **Source of Truth:** All controllers, services, DTOs, guards, interceptors, filters, entities, and pipes were directly inspected. The Postman collection was used only for navigation cross-referencing.  
> **Total Endpoints Audited:** 40  
> **Base Path:** `/api/v1`

---

## Table of Contents

1. [API Overview](#1-api-overview)
2. [Authentication Flow](#2-authentication-flow)
3. [User Journeys](#3-user-journeys)
4. [Permission Matrix (RBAC)](#4-permission-matrix-rbac)
5. [Error Handling Guide](#5-error-handling-guide)
6. [Rate Limiting Guide](#6-rate-limiting-guide)
7. [File Upload Guide](#7-file-upload-guide)
8. [Mobile Integration Notes](#8-mobile-integration-notes)
9. [Security Documentation](#9-security-documentation)
10. [Breaking Change Risks](#10-breaking-change-risks)
11. [Known Inconsistencies & Bugs](#11-known-inconsistencies--bugs)
12. [Dead Endpoints](#12-dead-endpoints)
13. [Missing Validation](#13-missing-validation)
14. [Endpoint Inventory](#14-endpoint-inventory)

---

## 1. API Overview

The HTI LMS Backend is a **NestJS** application using **TypeORM** (MySQL), **Redis**, and **Cloudinary**. It serves a Learning Management System for Higher Technological Institute with five user roles across three academic departments.

### Technology Stack (verified from source)
| Component | Technology |
|-----------|-----------|
| Framework | NestJS (Express adapter) |
| Database | MySQL via TypeORM |
| Cache / Session | Redis (ioredis) |
| File Storage | Cloudinary |
| Auth | JWT (access: 15m, refresh: 7d) |
| Email | SMTP via NodeMailer + NestJS EventEmitter |
| Deployment | Vercel (serverless adapter present) + Docker |

### Modules
| Module | Controller Prefix | Description |
|--------|-------------------|-------------|
| Auth | `/auth` | Registration, login, password flows |
| Users | `/users` | User CRUD, profile |
| Courses | `/courses` | Course management |
| CourseInstructors | `/courses/:courseId/instructors` | Assign/manage instructors |
| Chapters | `/courses/:courseId/chapters` | Chapter management |
| Materials | `/courses/:courseId/chapters/:chapterId/materials` | File/link materials |
| Assignments | `/courses/:courseId/assignments` | Assignment management |
| Enrollment | `/course/:id` | **[INCONSISTENCY]** Singular `course`, not `courses` |
| Notifications | `/notifications` | Push notifications |
| StudentProfiles | `/student-profiles` | Student profile CRUD |
| Dashboard | `/dashboard` | Role-specific dashboards |

---

## 2. Authentication Flow

### 2.1 Student Onboarding Flow

```
1. POST /auth/verify-email-student
   Body: { email: "XXXXXXX@hti.edu.eg" }
   → Validates: email matches /^\d+@hti\.edu\.eg$/
   → Redis: saves set-password:<uuid>=email (TTL: 3600s)
   → Email: sends set-password link with sessionId token

2. (Student clicks link) → Frontend redirects to /set-password?token=<sessionId>

3. POST /auth/set-password-student/<sessionId>
   Body: { username, password, confirmPassword }
   → MatchPasswordPipe: password === confirmPassword
   → Redis: retrieves email from set-password:<sessionId>
   → Creates User record (role=student, isActive=true)
   → Redis: deletes session, resets email attempts

4. POST /auth/login
   → Returns { accessToken, refreshToken }

5. POST /student-profiles/profile (multipart/form-data)
   → Creates StudentProfile with student_number, department, track, GPA
   → Optionally uploads avatar to Cloudinary
```

### 2.2 Staff Onboarding Flow (Admin/Doctor/TA)

```
1. POST /auth/create-admin | /auth/create-doctor | /auth/create-ta
   (SUPER_ADMIN only)
   → Creates inactive User record

2. POST /auth/verify-email-staff
   Body: { email: "name@hti.edu.eg" }
   → Validates: user exists AND has role in [admin, doctor, ta]
   → Redis: saves set-password:<uuid>=email (TTL: 3600s)
   → Email: sends set-password link

3. POST /auth/set-password-staff/<sessionId>
   Body: { password, confirmPassword }
   → Sets password, marks isActive=true
   → Increments dashboard stat (admin_count / doctor_count / ta_count)

4. POST /auth/login → Returns tokens
```

### 2.3 Login Flow

```
POST /auth/login
  Input: { email, password }
  → Checks login attempts (Redis: login-attempts:<email>, TTL: 900s)
  → If >= 5 attempts: 401 "Too many attempts"
  → Compares password with bcrypt hash
  → If wrong: increments attempts, returns 401
  → If inactive: increments attempts, returns 403
  → On success: resets attempts
  → Returns: { accessToken (15m), refreshToken (7d) }
```

### 2.4 Access Token Lifecycle

```
Access Token (JWT):
  - Algorithm: HS256 (HMAC-SHA256)
  - Secret: ACCESS_SECRET env var
  - Expiry: 15 minutes
  - Payload: { sub: userId, email, role, iat, exp }
  - Usage: Authorization: Bearer <token>

Validation pipeline (AuthGuard):
  1. Check Authorization header starts with "Bearer "
  2. Extract token
  3. Check Redis blacklist (sha256 hash of token)
  4. Verify JWT signature and expiry
  5. Load user from DB (with role relation)
  6. Check user.isActive
  7. Attach user to request
```

### 2.5 Refresh Token Lifecycle

```
Refresh Token (JWT):
  - Secret: REFRESH_SECRET env var
  - Expiry: 7 days
  - Payload: { sub, email, role, iat, exp }

POST /auth/refresh-token
  → Verifies refresh token signature
  → Checks Redis blacklist
  → Loads user from DB
  → Issues NEW access token (15m)
  → Does NOT issue new refresh token (no rotation)
```

### 2.6 Logout Flow

```
POST /auth/logout
  Headers: Authorization: Bearer <accessToken>
  Body: { refreshToken }
  → AuthGuard validates access token (must be valid)
  → Blacklists accessToken in Redis (TTL = remaining seconds)
  → Verifies refresh token signature
  → Blacklists refreshToken in Redis (TTL = remaining seconds)
  → Blacklist key: blacklist:<sha256(token)>
```

### 2.7 Password Reset Flow

```
POST /auth/forgot-password
  Body: { email }
  → Checks email attempt rate (5 per 15 min)
  → Looks up user — throws 404 if not found (NOT privacy-safe!)
  → Redis: saves reset session (1h TTL)
  → Email: sends reset link (FRONTEND_DOMAIN/reset-password?token=<sessionId>)

POST /auth/reset-password/<sessionId>
  Body: { password, confirmPassword }
  → MatchPasswordPipe validates match
  → Retrieves email from Redis session
  → Checks user exists and isActive
  → Hashes and saves new password
  → Deletes Redis session
```

---

## 3. User Journeys

### 3.1 Student Journey

```
1. Email verification → Set password → Login
2. Create student profile (POST /student-profiles/profile)
3. Browse courses (GET /courses)
4. Enroll in courses (POST /course/:id/enroll)
5. View course chapters (GET /courses/:courseId/chapters)
6. View chapter materials (GET /courses/:courseId/chapters/:chapterId/materials)
7. View assignments (GET /courses/:courseId/assignments)
8. View personal assignments (GET /courses/:courseId/assignments/my)
9. Check dashboard stats (GET /dashboard/student)
10. Mark notifications as read (PATCH /notifications/:id/read)
11. Update profile (PATCH /student-profiles/me)
12. Change password (PATCH /users/change-password)
```

### 3.2 Doctor Journey

```
1. Created by SuperAdmin → Email verification → Set password → Login
2. Create courses (POST /courses) — auto-added as DOCTOR instructor
3. Add TA instructors (POST /courses/:courseId/instructors)
4. Create chapters (POST /courses/:courseId/chapters)
5. Upload materials (POST /courses/:courseId/chapters/:chapterId/materials)
6. Create assignments with files (POST /courses/:courseId/assignments)
7. Send notifications to enrolled students (POST /notifications)
8. View doctor dashboard (GET /dashboard/doctor)
9. View enrolled students (GET /course/:id/students)
```

### 3.3 TA Journey

```
1. Created by Doctor/Admin/SuperAdmin → Verify email → Set password → Login
2. Create chapters (POST /courses/:courseId/chapters)
3. Upload materials (POST /courses/:courseId/chapters/:chapterId/materials)
4. Create/update assignments (POST /courses/:courseId/assignments)
5. View assignments (GET /courses/:courseId/assignments)
```

### 3.4 Admin Journey

```
1. Created by SuperAdmin → Verify email → Set password → Login
2. View users in own department (GET /users)
3. Update/delete users in own department (PATCH/DELETE /users/:id)
4. Create courses (POST /courses)
5. Send notifications (POST /notifications)
6. View admin dashboard (GET /dashboard/admin)
7. View student profiles (GET /student-profiles/findAllStudentProfiles)
8. View course students (GET /course/:id/students)
9. Add/remove instructors (POST/DELETE /courses/:courseId/instructors)
```

---

## 4. Permission Matrix (RBAC)

> **SUPER_ADMIN Bypass:** The RolesGuard always allows SUPER_ADMIN regardless of the @Roles decorator (`user.role.name !== RoleEnum.SUPER_ADMIN`). SUPER_ADMIN can access ALL endpoints.

| Endpoint | SUPER_ADMIN | ADMIN | DOCTOR | TA | STUDENT |
|----------|:-----------:|:-----:|:------:|:--:|:-------:|
| **AUTH** | | | | | |
| POST /auth/verify-email-student | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /auth/verify-email-staff | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /auth/set-password-staff/:sessionId | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /auth/set-password-student/:sessionId | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /auth/login | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /auth/refresh-token | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /auth/logout | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /auth/forgot-password | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /auth/reset-password/:sessionId | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /auth/create-admin | ✅ | ❌ | ❌ | ❌ | ❌ |
| POST /auth/create-doctor | ✅ | ❌ | ❌ | ❌ | ❌ |
| POST /auth/create-ta | ✅ | ❌ | ❌ | ❌ | ❌ |
| **USERS** | | | | | |
| GET /users | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /users/profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| PATCH /users/profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| PATCH /users/change-password | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /users/:id | ✅ | ✅ | ❌ | ❌ | ❌ |
| PATCH /users/:id | ✅ | ✅* | ❌ | ❌ | ❌ |
| DELETE /users/:id | ✅ | ✅* | ❌ | ❌ | ❌ |
| **COURSES** | | | | | |
| POST /courses | ✅ | ✅ | ✅ | ❌ | ❌ |
| GET /courses | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /courses/:id | ✅ | ✅ | ✅ | ✅ | ✅ |
| PATCH /courses/:id | ✅ | ✅ | ✅ | ❌ | ❌ |
| DELETE /courses/:id | ✅ | ✅ | ✅ | ❌ | ❌ |
| **COURSE INSTRUCTORS** | | | | | |
| POST /courses/:courseId/instructors | ✅ | ✅ | ✅** | ❌ | ❌ |
| GET /courses/:courseId/instructors | ✅ | ✅ | ✅ | ✅ | ✅ |
| PATCH /courses/:courseId/instructors/:userId | ✅ | ✅ | ✅ | ❌ | ❌ |
| DELETE /courses/:courseId/instructors/:userId | ✅ | ✅ | ❌ | ❌ | ❌ |
| **CHAPTERS** | | | | | |
| POST /courses/:courseId/chapters | ✅ | ✅ | ✅ | ✅ | ❌ |
| GET /courses/:courseId/chapters | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /courses/:courseId/chapters/:id | ✅ | ✅ | ✅ | ✅ | ✅ |
| PATCH /courses/:courseId/chapters/:id | ✅ | ✅ | ✅ | ✅ | ❌ |
| DELETE /courses/:courseId/chapters/:id | ✅ | ✅ | ✅ | ❌ | ❌ |
| **MATERIALS** | | | | | |
| POST .../materials | ✅ | ✅ | ✅ | ✅ | ❌ |
| GET .../materials | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET .../materials/:id | ✅ | ✅ | ✅ | ✅ | ✅ |
| PATCH .../materials/:id | ✅ | ✅ | ✅ | ❌ | ❌ |
| DELETE .../materials/:id | ✅ | ✅ | ✅ | ❌ | ❌ |
| **ASSIGNMENTS** | | | | | |
| POST /courses/:courseId/assignments | ✅ | ❌ | ✅ | ✅ | ❌ |
| GET /courses/:courseId/assignments | ✅ | ❌ | ✅ | ✅ | ✅ |
| GET /courses/:courseId/assignments/my | ✅ | ❌ | ❌ | ❌ | ✅ |
| GET /courses/:courseId/assignments/:id | ✅ | ❌ | ✅ | ✅ | ✅ |
| PATCH /courses/:courseId/assignments/:id | ✅ | ❌ | ✅ | ✅ | ❌ |
| DELETE /courses/:courseId/assignments/:id | ✅ | ❌ | ✅ | ✅ | ❌ |
| **ENROLLMENT** | | | | | |
| POST /course/:id/enroll | ✅ | ❌ | ❌ | ❌ | ✅ |
| DELETE /course/:id/unenroll | ✅ | ❌ | ❌ | ❌ | ✅ |
| GET /course/:id/students | ✅ | ✅ | ✅ | ❌ | ❌ |
| **NOTIFICATIONS** | | | | | |
| POST /notifications | ✅ | ✅ | ✅ | ❌ | ❌ |
| PATCH /notifications/:id/read | ✅ | ✅ | ✅ | ✅ | ✅ |
| PATCH /notifications/read-all | ✅ | ✅ | ✅ | ✅ | ✅ |
| **STUDENT PROFILES** | | | | | |
| POST /student-profiles/profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /student-profiles/findAllStudentProfiles | ✅ | ✅ | ✅ | ❌ | ❌ |
| GET /student-profiles/me | ✅ | ❌ | ❌ | ❌ | ✅ |
| PATCH /student-profiles/me | ✅ | ❌ | ❌ | ❌ | ✅ |
| DELETE /student-profiles/me | ✅ | ❌ | ❌ | ❌ | ✅ |
| **DASHBOARD** | | | | | |
| GET /dashboard/super-admin | ✅ | ❌ | ❌ | ❌ | ❌ |
| GET /dashboard/admin | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /dashboard/doctor | ✅ | ❌ | ✅ | ❌ | ❌ |
| GET /dashboard/student | ✅ | ❌ | ❌ | ❌ | ✅ |

> `*` ADMIN has additional restrictions: own department only, cannot update/delete other admins or super_admin  
> `**` DOCTOR can only add TAs (not other doctors), and only if they are themselves an assigned DOCTOR in that course

---

## 5. Error Handling Guide

### Global Exception Filter (`GlobalExceptionFilter`)

ALL errors are normalized into this structure:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Human-readable error message (first validation message only)",
  "data": null,
  "timestamp": "2024-01-15T12:00:00.000Z",
  "path": "/api/v1/endpoint"
}
```

> **Important:** ValidationPipe error arrays are collapsed — only the **first** message is returned to the client.

### HTTP Status Codes Produced

| Code | When | Example |
|------|------|---------|
| 200 | Successful GET, PATCH, POST (with explicit @HttpCode) | Login, logout |
| 201 | Successful POST (NestJS default) | Create course, enroll |
| 400 | Validation failure OR business logic error | Bad email format, link expired |
| 401 | Missing/invalid/expired JWT OR too many login/email attempts | Token revoked |
| 403 | Valid JWT but insufficient role OR inactive account | Wrong role |
| 404 | Entity not found | User not found, assignment not found |
| 409 | Duplicate resource | Course code exists, already enrolled |
| 429 | Rate limit exceeded | 5+ requests in 60s |
| 500 | Unhandled exception (logged with Logger) | DB connection error |

### Error Message Sources (by endpoint)

#### Auth Errors
| Message | Code | Source |
|---------|------|--------|
| `"Email must be a valid HTI student email"` | 400 | `@ISHtiStudentEmail()` validator |
| `"Email must be a valid HTI staff email"` | 400 | `@ISHtiStaffEmail()` validator |
| `"User already activated"` | 400 | `auth.service.VerifyEmailStudent` |
| `"Invalid staff member"` | 400 | `auth.service.VerifyEmailStaff` |
| `"Too many attempts, try again later"` | 401 | Redis email/login attempt counter |
| `"Link expired or already used"` | 400 | Redis session lookup returns null |
| `"Username already taken"` | 400 | `auth.service.SetPasswordStudent` |
| `"Email already exists"` | 400 | `auth.service.createAdmin/Doctor/Ta` |
| `"Invalid credentials"` | 401 | `auth.service.login` |
| `"Account not activated"` | 403 | `auth.service.login` |
| `"in-valid token"` | 400 | `auth.service.refreshToken` (blacklisted) |
| `"Invalid request"` | 400 | `auth.service.refreshToken` (user inactive) |
| `"Password does not match confirm password"` | 400 | `MatchPasswordPipe` |
| `"User does not exist in our records"` | 404 | `auth.service.forgotPassword` |

#### Auth Guard Errors
| Message | Code | Source |
|---------|------|--------|
| `"Invalid token format"` | 401 | No `Bearer ` prefix |
| `"Token has been revoked"` | 401 | Redis blacklist |
| `"User no longer exists"` | 401 | User deleted after login |
| `"User account is inactive"` | 403 | `isActive = false` |
| `"Invalid or expired access token"` | 401 | JWT verify failed |

#### Roles Guard Errors
| Message | Code | Source |
|---------|------|--------|
| `"User not found in request"` | 403 | No user attached to request |
| `"User role not found"` | 403 | User has no role |
| `"You do not have permission to perform this action"` | 403 | Role not in allowed list |

---

## 6. Rate Limiting Guide

### Implementation
Rate limiting uses `express-rate-limit` wrapped in a NestJS guard (`RateLimitGuard`), applied via the `@RateLimit(limit, windowMs)` decorator.

### Rate Limit Configuration (verified from code)

| Controller/Endpoint Group | Limit | Window | Applied At |
|--------------------------|-------|--------|------------|
| Auth controller | 5 req | 60,000 ms (1 min) | `@Controller` level |
| Courses controller | 5 req | 60,000 ms (1 min) | `@Controller` level |
| Chapters controller | 5 req | 60,000 ms (1 min) | `@Controller` level |
| Materials controller | 5 req | 60,000 ms (1 min) | `@Controller` level |
| Enrollment controller | 5 req | 60,000 ms (1 min) | `@Controller` level |
| Student Profiles controller | 5 req | 60,000 ms (1 min) | `@Controller` level |
| Dashboard controller | 5 req | 60,000 ms (1 min) | `@Controller` level |
| Course Instructors controller | 5 req | 60,000 ms (1 min) | `@Controller` level |

> ⚠️ **NOT rate limited:** `AssignmentsController`, `NotificationsController`, `UsersController`

### Rate Limit Response (bypasses GlobalExceptionFilter)

```json
{
  "success": false,
  "statusCode": 429,
  "message": "Too many requests, try again later"
}
```

> Note: Rate limit response does NOT include `timestamp` or `path` fields because it is produced by the `express-rate-limit` handler directly, bypassing `GlobalExceptionFilter`.

### Additional Redis-Based Rate Limits

| Mechanism | Limit | Window | Reset On |
|-----------|-------|--------|----------|
| Email attempts (verify/forgot) | 5 attempts | 900s (15 min) | Success |
| Login attempts | 5 attempts | 900s (15 min) | Success |

---

## 7. File Upload Guide

### Upload Infrastructure

All uploads use **Cloudinary** (`cloud_service.ts`). Files are uploaded from memory buffer via stream. No files are saved to disk in production.

### Upload Endpoints

| Endpoint | Field Name | Destination Folder | Required? |
|----------|------------|-------------------|-----------|
| POST /courses/:courseId/assignments | `file` | `HTI/assignments/` | Optional |
| PATCH /courses/:courseId/assignments/:id | `file` | `HTI/assignments/` | Optional |
| POST /courses/:courseId/chapters/:chapterId/materials | `file` | `HTI/materials/` | Optional |
| POST /student-profiles/profile | `avatar` | `HTI/avatars/` | Optional |
| PATCH /student-profiles/me | `avatar` | `HTI/avatars/` | Optional |

### Multer Configuration

All upload endpoints use `FileInterceptor` with `memoryStorage()`. **No file size limit is configured on the interceptor** (`{ storage: memoryStorage() }` — no `limits` key).

> ⚠️ The `createUploader` utility in `upload.ts` defines a **5MB limit** and MIME validation, but it is **NOT used** by any controller. All controllers use raw `memoryStorage()` directly. This means there is **no enforced file size limit** at the NestJS level.

### File Type Validation

No MIME type validation is applied at the controller level. The `upload.ts` utility defines `fileTypes` but is unused by controllers.

```typescript
// upload.ts — DEFINED but NOT USED
fileTypes = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  pdf: ['application/pdf'],
  document: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
}
```

### Avatar Replacement Logic (Student Profile Update)

When updating a student profile with a new avatar:
1. Looks up current `user.avatar_url`
2. Extracts Cloudinary `public_id` from URL
3. Calls `cloudinary.uploader.destroy(publicId)` to delete old image
4. Uploads new image and updates `user.avatar_url`

> ⚠️ **Bug:** In `student-profiles.service.ts` `updateStudentProfile`, the upload code runs **twice** (lines 90-119). The avatar upload block at line 91 uploads once, then the code falls through to upload again at line 114. This results in **two Cloudinary uploads per profile update with avatar**.

---

## 8. Mobile Integration Notes

### 8.1 Authentication
- Store `accessToken` (15min) and `refreshToken` (7 days) securely (e.g., encrypted storage)
- Implement automatic token refresh on 401 responses
- On logout: call `/auth/logout` with both tokens, then clear local storage

### 8.2 Token Refresh Strategy
```
Request → 401 Unauthorized
  → POST /auth/refresh-token { refreshToken }
  → Store new accessToken
  → Retry original request
  → If refresh also fails → force logout
```

### 8.3 Email Constraints
- Student emails MUST match: `^\d+@hti\.edu\.eg$` (numeric prefix only)
- Staff emails MUST match: `^(\d+|[a-zA-Z]+)@hti\.edu\.eg$`
- NO other email formats are accepted anywhere in the API

### 8.4 Pagination
Two different pagination meta formats are used across the API:

**Format A** (Users, Dashboard/Doctor):
```json
{ "total": 50, "page": 1, "limit": 10, "total_pages": 5 }
```

**Format B** (Courses, Student Profiles, Enrollment):
```json
{ "totalItems": 50, "itemCount": 10, "itemsPerPage": 10, "totalPages": 5, "currentPage": 1 }
```

> ⚠️ Mobile apps must handle BOTH pagination formats depending on the endpoint.

### 8.5 Route Inconsistency: Enrollment
Enrollment uses `/course/:id` (singular) not `/courses/:id`:
```
POST  /api/v1/course/:id/enroll
DELETE /api/v1/course/:id/unenroll
GET   /api/v1/course/:id/students
```

### 8.6 File Uploads
- Content-Type: `multipart/form-data`
- Field names: `file` (assignments/materials), `avatar` (student profiles)
- No server-side file size enforcement (client should cap at 5MB by convention)
- After upload, the API returns a `storage_url` or `avatar_url` (Cloudinary HTTPS URL)

### 8.7 Response Envelope
ALL responses (success and error) use a consistent envelope:
```json
{
  "success": true|false,
  "statusCode": 200,
  "message": "...",
  "data": {} | [] | null,
  "meta": {} // optional, pagination only
}
```

### 8.8 Arabic Content
`title_ar` fields contain Arabic text. Ensure your HTTP client sends `Content-Type: application/json; charset=utf-8`.

---

## 9. Security Documentation

### 9.1 Password Hashing
- Algorithm: **bcrypt** via `HashingService`
- Rounds: `SALT_ROUNDS` env var (default: 12)

### 9.2 Token Blacklisting (Logout/Revocation)
- Blacklisted tokens stored in Redis: `blacklist:<sha256(token)>`
- TTL = remaining token lifetime
- Checked by `AuthGuard` on every authenticated request

### 9.3 CORS
- Configured from `CORS_ORIGIN` env var (comma-separated origins)
- `credentials: true` enabled
- Throws startup error if `CORS_ORIGIN` is not set

### 9.4 HTTP Headers
- Helmet enabled (security headers)

### 9.5 ValidationPipe
```typescript
new ValidationPipe({
  transform: true,        // Auto-transform types
  whitelist: true,        // Strip unknown properties
  transformOptions: {
    enableImplicitConversion: true  // Enable type coercion
  }
})
```

### 9.6 Set-Password Sessions
- UUID-based session IDs (crypto.randomUUID())
- Stored in Redis: `set-password:<uuid>=email` (TTL: 3600s = 1 hour)
- One-time use: deleted after successful password set
- Email attempts tracked separately: `email-attempts:<email>` (TTL: 900s)

### 9.7 Known Security Issues
1. **Forgot Password leaks user existence** — `forgotPassword()` throws `NotFoundException('User does not exist in our records')`. An attacker can enumerate valid email addresses.
2. **No file type validation at controller level** — Any file type can be uploaded to Cloudinary.
3. **No file size limit** — Potential DoS via large file uploads.
4. **Refresh token rotation not implemented** — Compromised refresh token remains valid until expiry.
5. **Assignment DTO validation bypassed** — Controller uses `@Body() dto: any` instead of `CreateAssignmentDto`.

---

## 10. Breaking Change Risks

### HIGH RISK

| Risk | Description | Impact |
|------|-------------|--------|
| **Enrollment path** | `/course/:id` vs `/courses/:id` inconsistency | Mobile apps must handle both prefixes |
| **Pagination meta format** | Two different meta schemas | Mobile parsing must be endpoint-aware |
| **Assignment DTO bypass** | `dto: any` means no type safety | Server accepts malformed data |
| **No rate limit on Assignments/Notifications/Users** | Future addition would break clients | — |

### MEDIUM RISK

| Risk | Description |
|------|-------------|
| **Double avatar upload bug** | Wastes Cloudinary credits on every profile update |
| **Forgot password 404** | Reveals user existence; cannot be changed without API version bump |
| **No refresh token rotation** | Security gap if refresh token is leaked |
| **Session TTL hardcoded** | 3600s for set-password, 900s for attempts — cannot be configured via env |

### LOW RISK

| Risk | Description |
|------|-------------|
| **Redis key structure** | If Redis namespace changes, all sessions/blacklists are invalidated |
| **Course cache** | If cache TTL changes (not configurable), stale data window changes |

---

## 11. Known Inconsistencies & Bugs

### 11.1 Route Naming Inconsistency
- `GET /student-profiles/findAllStudentProfiles` — uses camelCase in a URL path (should be `/student-profiles` or `/student-profiles/all`)
- Enrollment controller prefix: `/course/:id` (singular) while all other course-related controllers use `/courses`

### 11.2 Validation Bypass on Assignments
**File:** `assignments.controller.ts:35`
```typescript
@Body() dto: any,  // BUG: Should be @Body() dto: CreateAssignmentDto
```
The DTO class validators (`@IsString()`, `@IsEnum()`, `@IsDateString()`, etc.) are NOT enforced on the assignment creation endpoint. Any body structure is accepted.

### 11.3 Double Avatar Upload
**File:** `student-profiles.service.ts:90-119`  
The `updateStudentProfile` method uploads the avatar twice when an avatar is provided. The first upload (line 104) succeeds and updates `avatar_url`, then the code falls through to a second upload block (line 114-118) which uploads again and overwrites.

### 11.4 SendNotification user_ids Field Naming
**DTO:** `SendNotificationDto.user_ids` is described as "user IDs" but the service implementation queries `student_profile.student_number`. This means `user_ids` is actually an array of **student numbers** (not database user IDs).

```typescript
// notifications.service.ts:66
.where('profile.student_number IN (:...numbers)', {
  numbers: unique.map(String),  // user_ids treated as student numbers!
})
```

### 11.5 `forgotPassword` Not Privacy-Safe
Returns 404 with `"User does not exist in our records"` — unlike `verifyEmailStudent` which always returns the same message.

### 11.6 Redundant Guard on Student Profile Create
```typescript
@Post('profile')
@UseGuards(AuthGuard)  // Redundant — AuthGuard already on @Controller
```

### 11.7 Inconsistent Pagination Meta Keys
| Endpoint Group | `total` key | `pages` key | `current` key |
|---|---|---|---|
| Users, Doctor Dashboard | `total` | `total_pages` | `page` |
| Courses, StudentProfiles, Enrollment | `totalItems` | `totalPages` | `currentPage` |

### 11.8 Missing `@HttpCode` on Several POST Endpoints
These POST endpoints return **201** by default (NestJS) but semantically should return **200**:
- `POST /courses` — creates and returns resource → 201 ✅ correct
- `POST /notifications` — returns success message → 201 (debatable; no resource created in response)
- `POST /auth/create-admin/doctor/ta` → 201 (but the resource is not returned)

### 11.9 Assignment Soft Delete Returns Entity
`DELETE /courses/:courseId/assignments/:id` returns the full updated entity with `is_active: false`. HTTP semantics suggest 200 with message or 204 with no content — NOT the modified entity.

### 11.10 UpdateCourse Returns Raw Entity
`PATCH /courses/:id` returns the raw TypeORM `Course` entity, while other PATCH endpoints return `{ message: '...' }`. Response shape inconsistency.

### 11.11 Login Attempt Counter on 401 from Inactive Account
When `isActive=false`, the login attempt counter is also incremented before throwing 403. This means repeated login attempts on an inactive account consume the rate limit quota.

---

## 12. Dead Endpoints

### 12.1 Potentially Dead: SignupSuperAdminDto
**File:** `src/modules/auth/dto/signup-super-admin.dto.ts`  
A `SignupSuperAdminDto` exists with `fullName, email, username, password, confirmPassword` but there is **NO controller endpoint** that uses it. There is also a `db/seeder` that handles initial super admin creation via environment variables. This DTO is dead code.

### 12.2 Potentially Dead: UpdateUserDtoBySuperAdmin
**File:** `src/modules/auth/dto/update-user-by-super-admin.dto.ts`  
`UpdateUserDtoBySuperAdmin` (with `roleId`) exists but is not imported by any controller. The `UpdateUserDto` in `users/dto/updateUser.dto.ts` covers the same functionality. Dead code.

### 12.3 Potentially Dead: RequestResetPasswordDto
**File:** `src/modules/auth/dto/request-reset-password.dto.ts`  
A `RequestResetPasswordDto` exists separately from `ForgotPasswordDto` — both contain only an `email` field. `RequestResetPasswordDto` is not imported anywhere. Dead code.

### 12.4 Exam Entity — No Controller
**File:** `src/db/entities/exam.entity.ts`  
An `Exam` entity is defined and used by `DashboardService.getStudentDashboard()` to count upcoming exams. However, there is **no ExamsController or ExamsService** for CRUD operations. Students can see an exam count in their dashboard but cannot view exam details.

### 12.5 Announcement Entity — No CRUD Controller
**File:** `src/db/entities/announcement.entity.ts`  
An `Announcement` entity exists and is referenced by `Notification`. However, there is **no AnnouncementController** for creating/reading announcements. Referenced in dashboard queries.

### 12.6 Create Enrollment DTO Is Empty
**File:** `src/modules/enrollment/dto/create-enrollment.dto.ts`  
The file is 0 bytes (empty). No DTO is defined. Enrollment uses path param only (`courseId`).

---

## 13. Missing Validation

| Endpoint | Missing Validation | Risk |
|----------|--------------------|------|
| POST /courses/:courseId/assignments | DTO validators not applied (`dto: any`) | Any body accepted |
| PATCH /student-profiles/me | `@Body() body: any` — DTO not enforced at controller | Any field accepted |
| POST /auth/refresh-token | `refreshToken` field not validated (only manual check) | No format validation |
| POST /auth/logout | `refreshToken` field not validated | No format validation |
| GET /courses?page=&limit= | `ParseIntPipe` throws 400 for non-integers with no friendly message | Poor UX |
| GET /course/:id/students | Same `ParseIntPipe` issue | Poor UX |
| POST /courses | `title_ar` has no `@IsNotEmpty()` — empty string allowed | Data quality |
| POST /courses | `code` has no `@IsNotEmpty()` — empty string allowed | Data quality |

---

## 14. Endpoint Inventory

Complete list of all 40 endpoints discovered (sorted by module):

### Auth (12 endpoints)
| Method | Path | Auth | Roles | Rate Limited |
|--------|------|------|-------|-------------|
| POST | /auth/verify-email-student | No | All | Yes (5/60s) |
| POST | /auth/verify-email-staff | No | All | Yes (5/60s) |
| POST | /auth/set-password-staff/:sessionId | No | All | Yes (5/60s) |
| POST | /auth/set-password-student/:sessionId | No | All | Yes (5/60s) |
| POST | /auth/login | No | All | Yes (5/60s) |
| POST | /auth/refresh-token | No | All | Yes (5/60s) |
| POST | /auth/logout | Yes | All | Yes (5/60s) |
| POST | /auth/forgot-password | No | All | Yes (5/60s) |
| POST | /auth/reset-password/:sessionId | No | All | Yes (5/60s) |
| POST | /auth/create-admin | Yes | super_admin | Yes (5/60s) |
| POST | /auth/create-doctor | Yes | super_admin | Yes (5/60s) |
| POST | /auth/create-ta | Yes | super_admin | Yes (5/60s) |

### Users (6 endpoints)
| Method | Path | Auth | Roles |
|--------|------|------|-------|
| GET | /users | Yes | super_admin, admin |
| GET | /users/profile | Yes | All |
| PATCH | /users/profile | Yes | All |
| PATCH | /users/change-password | Yes | All |
| GET | /users/:id | Yes | super_admin, admin |
| PATCH | /users/:id | Yes | super_admin, admin |
| DELETE | /users/:id | Yes | super_admin, admin |

### Courses (4 endpoints)
| Method | Path | Auth | Roles |
|--------|------|------|-------|
| POST | /courses | Yes | super_admin, admin, doctor |
| GET | /courses | Yes | All |
| GET | /courses/:id | Yes | All |
| PATCH | /courses/:id | Yes | super_admin, admin, doctor |
| DELETE | /courses/:id | Yes | super_admin, admin, doctor |

### Course Instructors (4 endpoints)
| Method | Path | Auth | Roles |
|--------|------|------|-------|
| POST | /courses/:courseId/instructors | Yes | super_admin, admin, doctor |
| GET | /courses/:courseId/instructors | Yes | All |
| PATCH | /courses/:courseId/instructors/:userId | Yes | super_admin, admin, doctor |
| DELETE | /courses/:courseId/instructors/:userId | Yes | super_admin, admin |

### Chapters (5 endpoints)
| Method | Path | Auth | Roles |
|--------|------|------|-------|
| POST | /courses/:courseId/chapters | Yes | super_admin, admin, doctor, ta |
| GET | /courses/:courseId/chapters | Yes | All |
| GET | /courses/:courseId/chapters/:id | Yes | All |
| PATCH | /courses/:courseId/chapters/:id | Yes | super_admin, admin, doctor, ta |
| DELETE | /courses/:courseId/chapters/:id | Yes | super_admin, admin, doctor |

### Materials (5 endpoints)
| Method | Path | Auth | Roles |
|--------|------|------|-------|
| POST | /courses/:courseId/chapters/:chapterId/materials | Yes | super_admin, admin, doctor, ta |
| GET | /courses/:courseId/chapters/:chapterId/materials | Yes | All |
| GET | /courses/:courseId/chapters/:chapterId/materials/:id | Yes | All |
| PATCH | /courses/:courseId/chapters/:chapterId/materials/:id | Yes | super_admin, admin, doctor |
| DELETE | /courses/:courseId/chapters/:chapterId/materials/:id | Yes | super_admin, admin, doctor |

### Assignments (6 endpoints)
| Method | Path | Auth | Roles |
|--------|------|------|-------|
| POST | /courses/:courseId/assignments | Yes | doctor, ta |
| GET | /courses/:courseId/assignments | Yes | doctor, ta, student |
| GET | /courses/:courseId/assignments/my | Yes | student |
| GET | /courses/:courseId/assignments/:id | Yes | doctor, ta, student |
| PATCH | /courses/:courseId/assignments/:id | Yes | doctor, ta |
| DELETE | /courses/:courseId/assignments/:id | Yes | doctor, ta |

### Enrollment (3 endpoints)
| Method | Path | Auth | Roles | Note |
|--------|------|------|-------|------|
| POST | /course/:id/enroll | Yes | student | Singular `course` |
| DELETE | /course/:id/unenroll | Yes | student | Singular `course` |
| GET | /course/:id/students | Yes | super_admin, admin, doctor | Singular `course` |

### Notifications (3 endpoints)
| Method | Path | Auth | Roles |
|--------|------|------|-------|
| POST | /notifications | Yes | super_admin, admin, doctor |
| PATCH | /notifications/:id/read | Yes | All |
| PATCH | /notifications/read-all | Yes | All |

### Student Profiles (5 endpoints)
| Method | Path | Auth | Roles |
|--------|------|------|-------|
| POST | /student-profiles/profile | Yes | All |
| GET | /student-profiles/findAllStudentProfiles | Yes | super_admin, admin, doctor |
| GET | /student-profiles/me | Yes | student |
| PATCH | /student-profiles/me | Yes | student |
| DELETE | /student-profiles/me | Yes | student |

### Dashboard (4 endpoints)
| Method | Path | Auth | Roles |
|--------|------|------|-------|
| GET | /dashboard/super-admin | Yes | super_admin |
| GET | /dashboard/admin | Yes | admin |
| GET | /dashboard/doctor | Yes | doctor |
| GET | /dashboard/student | Yes | student |

---

## Appendix: Environment Variables (from app.module.ts Joi schema)

| Variable | Required | Type | Default | Description |
|----------|----------|------|---------|-------------|
| PORT | No | number | 3000 | Server port |
| NODE_ENV | No | string | production | development/production/test |
| CORS_ORIGIN | **Yes** | string | — | Comma-separated allowed origins |
| FRONTEND_DOMAIN | **Yes** | string | — | Used in email links |
| DB_HOST | **Yes** | string | — | MySQL host |
| DB_PORT | No | number | 3306 | MySQL port |
| DB_USER | **Yes** | string | — | MySQL username |
| DB_PASS | No | string | '' | MySQL password (optional) |
| DB_NAME | **Yes** | string | — | MySQL database name |
| DB_SSL | No | boolean | false | MySQL SSL |
| ACCESS_SECRET | **Yes** | string | — | JWT access token secret |
| REFRESH_SECRET | **Yes** | string | — | JWT refresh token secret |
| SET_PASSWORD_SECRET | **Yes** | string | — | JWT set-password token secret |
| SALT_ROUNDS | No | number | 12 | bcrypt salt rounds |
| SMTP_HOST | **Yes** | string | — | Email SMTP host |
| SMTP_PORT | No | number | 587 | Email SMTP port |
| SMTP_USER | **Yes** | string | — | Email username |
| SMTP_PASS | **Yes** | string | — | Email password |
| CLOUDINARY_CLOUD_NAME | **Yes** | string | — | Cloudinary cloud name |
| CLOUDINARY_API_KEY | **Yes** | string | — | Cloudinary API key |
| CLOUDINARY_API_SECRET | **Yes** | string | — | Cloudinary API secret |
| CLOUDINARY_CLOUD_FOLDER | No | string | 'HTI' | Cloudinary base folder |
| REDIS_URL | **Yes** | string | — | Redis connection URL |
| REDIS_TLS | No | boolean | false | Redis TLS |
| fullName | No | string | — | Seeder: super admin full name |
| email | No | string | — | Seeder: super admin email |
| username | No | string | — | Seeder: super admin username |
| password | No | string | — | Seeder: super admin password |

---

*End of HTI LMS API Audit Report*

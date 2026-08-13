# HTI-LMS Backend

> Learning Management System backend for the Higher Technological Institute (HTI), built with NestJS, TypeORM, MySQL, and Redis.

## Tech Stack

| Technology | Purpose |
|---|---|
| **NestJS 11** | API framework (TypeScript) |
| **TypeORM 0.3** | ORM & database migrations |
| **MySQL 8** | Relational database |
| **Redis 7** | Caching & session management |
| **Cloudinary** | File/image storage |
| **Nodemailer** | Email delivery (SMTP) |
| **JWT** | Authentication (access + refresh tokens) |
| **Docker** | Containerization & deployment |

## Prerequisites

- **Docker** ≥ 20.x & **Docker Compose** ≥ 2.x (recommended)
- Or **Node.js** ≥ 20.x, **MySQL** 8.x, **Redis** 7.x (for local development)

---

## Quick Start (Docker) 🐳

```bash
# 1. Clone the repository
git clone <repo-url> && cd Backend-HTI

# 2. Create environment file
cp .env.example .env
# Edit .env with your real values (JWT secrets, SMTP, Cloudinary, etc.)

# 3. Start all services
docker compose up -d

# 4. Run database migrations
docker compose exec app node dist/data-source.js || true
docker compose exec app npx typeorm migration:run -d dist/data-source.js

# 5. Verify it's running
curl http://localhost:3000/api/v1
# → { "success": true, "message": "Hello World!" }
```

### Generate JWT Secrets

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Run this 3 times and paste the outputs into `ACCESS_SECRET`, `REFRESH_SECRET`, and `SET_PASSWORD_SECRET` in your `.env`.

---

## Commands Reference

| Command | Description |
|---|---|
| `docker compose up -d` | Start all services (API + MySQL + Redis) |
| `docker compose up -d --build` | Rebuild and start |
| `docker compose down` | Stop all services |
| `docker compose down -v` | Stop and remove volumes (⚠️ deletes data) |
| `docker compose logs -f app` | Follow API logs |
| `docker compose logs -f mysql` | Follow MySQL logs |
| `docker compose exec app sh` | Shell into the API container |
| `docker compose ps` | Show service status |

### Migrations

```bash
# Run all pending migrations (Docker)
docker compose exec app npx typeorm migration:run -d dist/data-source.j

# Revert last migration (Docker)
docker compose exec app npx typeorm migration:revert -d dist/data-source.js

# Run migrations (local dev)
npm run migration:run

# Generate a new migration (local dev)
npm run migration:generate -- src/db/migrations/MyMigrationName
```

---

## Local Development (without Docker)

```bash
# 1. Install dependencies
npm install

# 2. Create .env (use localhost for DB_HOST and redis://localhost:6379 for REDIS_URL)
cp .env.example .env

# 3. Start MySQL and Redis locally
# (ensure they're running on the ports specified in .env)

# 4. Run migrations
npm run migration:run

# 5. Start in development mode (hot-reload)
npm run start:dev
```

---

## API

- **Base URL**: `http://localhost:3000/api/v1`
- **Auth**: Bearer token in `Authorization` header
- **Rate Limiting**: 5 requests / 60 seconds per controller

### Key Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1` | Health check |
| `POST` | `/api/v1/auth/login` | Login |
| `POST` | `/api/v1/auth/signup-super-admin` | Initial super admin setup |
| `GET` | `/api/v1/users` | List users (admin) |
| `GET` | `/api/v1/courses` | List courses |

---

## Project Structure

```
src/
├── main.ts                    ← App bootstrap
├── app.module.ts              ← Root module
├── shared.module.ts           ← Shared providers (JWT, Auth, Cache)
├── data-source.ts             ← TypeORM CLI data source
├── config/                    ← Configuration factories
├── db/
│   ├── entities/              ← 14 TypeORM entities
│   └── migrations/            ← 14 ordered migrations
├── common/
│   ├── guard/                 ← Auth, Roles, RateLimit guards
│   ├── filters/               ← Global exception filter
│   ├── interceptors/          ← Response format interceptor
│   ├── decorator/             ← Custom decorators
│   ├── pipes/                 ← Validation pipes
│   └── utils/                 ← Email, Security, Upload, Cache services
└── modules/
    ├── auth/                  ← Authentication & authorization
    ├── users/                 ← User management
    ├── courses/               ← Course CRUD
    ├── course-instructors/    ← Instructor assignment
    ├── chapters/              ← Course chapters
    ├── materials/             ← Learning materials
    ├── assignments/           ← Assignments
    ├── enrollment/            ← Student enrollment
    ├── notifications/         ← Notifications
    ├── dashboard/             ← Dashboard stats
    └── student-profiles/      ← Student profiles
```

---

## Environment Variables

See [`.env.example`](./.env.example) for the complete list with descriptions.

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | API server port |
| `NODE_ENV` | No | `production` | Environment mode |
| `CORS_ORIGIN` | **Yes** | — | Allowed CORS origins (comma-separated) |
| `FRONTEND_DOMAIN` | **Yes** | — | Frontend URL for email links |
| `DB_HOST` | **Yes** | — | MySQL host |
| `DB_PORT` | No | `3306` | MySQL port |
| `DB_USER` | **Yes** | — | MySQL username |
| `DB_PASS` | No | — | MySQL password |
| `DB_NAME` | **Yes** | — | MySQL database name |
| `ACCESS_SECRET` | **Yes** | — | JWT access token secret |
| `REFRESH_SECRET` | **Yes** | — | JWT refresh token secret |
| `SET_PASSWORD_SECRET` | **Yes** | — | JWT set-password token secret |
| `SALT_ROUNDS` | No | `12` | bcrypt cost factor |
| `SMTP_HOST` | **Yes** | — | SMTP server host |
| `SMTP_PORT` | No | `587` | SMTP server port |
| `SMTP_USER` | **Yes** | — | SMTP username |
| `SMTP_PASS` | **Yes** | — | SMTP password |
| `CLOUDINARY_CLOUD_NAME` | **Yes** | — | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | **Yes** | — | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | **Yes** | — | Cloudinary API secret |
| `CLOUDINARY_CLOUD_FOLDER` | No | `HTI` | Cloudinary root folder |
| `REDIS_URL` | **Yes** | — | Redis connection URL |

---

## License

UNLICENSED — Private project.

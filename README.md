# PH Submission Portal — Server

Express 5 + TypeScript + Prisma + PostgreSQL backend for the Project Submission & Review Dashboard.

## Stack

- Express 5, TypeScript (strict)
- Prisma ORM v5 + PostgreSQL
- JWT auth with role-based access control (STUDENT / MENTOR)
- Zod request validation
- helmet, CORS allowlist, rate limiting, input sanitization

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Copy the environment file and fill in your values:
   ```
   cp .env.example .env
   ```

   | Variable | Description |
   |---|---|
   | `DATABASE_URL` | PostgreSQL connection string (e.g. from [Neon](https://neon.tech)) |
   | `JWT_ACCESS_SECRET` | Any long random string |
   | `JWT_ACCESS_EXPIRES_IN` | e.g. `1d` |
   | `BCRYPT_SALT_ROUND` | e.g. `12` |
   | `MENTOR_EMAIL` / `MENTOR_PASSWORD` | Credentials for the mentor account, seeded automatically on first boot |
   | `CLIENT_URL` | Your Next.js client URL, added to the CORS allowlist |

3. Run the Prisma migration to create tables:
   ```
   npx prisma migrate dev --name init
   ```

4. Start the dev server:
   ```
   npm run dev
   ```

   The server listens on `http://localhost:5000` by default. On first boot it seeds a mentor account from `MENTOR_EMAIL` / `MENTOR_PASSWORD`.

## Build

```
npm run build   # tsc -> dist/
npm start       # node dist/server.js
```

## API Reference

Base URL: `/api/v1`

### Auth

| Method | Path | Auth | Body |
|---|---|---|---|
| POST | `/auth/register` | None | `{ name, email, password }` — always creates a STUDENT |
| POST | `/auth/login` | None | `{ email, password }` → `{ accessToken, user }` |

### Submissions

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/submissions` | STUDENT | Create a submission. 409 if the repo URL was already submitted by this student. |
| GET | `/submissions` | MENTOR | `?status=PENDING\|APPROVED\|REJECTED&page=1&limit=10` |
| GET | `/submissions/stats` | MENTOR | `{ PENDING, APPROVED, REJECTED, total }` |
| PATCH | `/submissions/:id/status` | MENTOR | `{ status: "APPROVED" \| "REJECTED", feedback? }` |

All list responses use the envelope:
```json
{ "success": true, "statusCode": 200, "message": "...", "meta": { "page": 1, "limit": 10, "total": 5, "totalPages": 1 }, "data": [...] }
```

Auth header: `Authorization: <accessToken>` (no `Bearer` prefix).

## Project structure

```
src/
  app.ts, server.ts
  config/             # single source of truth for env vars
  db/seedMentor.ts    # seeds mentor on boot
  helpers/jwtHelpers.ts
  shared/             # catchAsync, sendResponse, pick, paginationHelper, prisma client
  app/
    errors/ApiError.ts
    middlewares/      # auth, validateRequest, rateLimiters, sanitizeInput, globalErrorHandler, notFound
    modules/
      auth/           # controller, service, routes, validation
      submission/     # controller, service, routes, validation, interface
    routes/index.ts   # mounts every module under /api/v1
```

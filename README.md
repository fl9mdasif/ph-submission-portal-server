# PH Submission Portal — Server

Backend API for the **Project Submission & Review Dashboard** (Programming Hero Associate Web Instructor hiring task). Students submit assignment work for review; mentors approve or reject it and track their own review activity.

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js, Express 5, TypeScript (strict) |
| Database | PostgreSQL via Prisma ORM v5 |
| Auth | JWT, bcrypt password hashing, role-based access control (`STUDENT`, `MENTOR`) |
| Validation | Zod |
| Security | helmet, explicit CORS allowlist, rate limiting, input sanitization |

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Mentor** | `mentor@phsubmission.com` | `Mentor@12345` |
| Student (demo) | `rafiul@example.com` | `Student@123` |

The mentor account is seeded automatically on server boot from `MENTOR_EMAIL` / `MENTOR_PASSWORD` in `.env` — it is never created through a public endpoint. Demo student accounts and sample submissions can be added with `node seed-demo.js` (see below).

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string used by the running app |
| `DIRECT_URL` | Non-pooled connection string, used only by `prisma migrate`/`db push` |
| `JWT_ACCESS_SECRET` | Long random string signing access tokens |
| `JWT_ACCESS_EXPIRES_IN` | Token lifetime, e.g. `1d` |
| `BCRYPT_SALT_ROUND` | Password hashing cost, e.g. `12` |
| `MENTOR_EMAIL` / `MENTOR_PASSWORD` / `MENTOR_NAME` | Mentor account seeded on first boot |
| `CLIENT_URL` | Deployed Next.js client origin, added to the CORS allowlist |

> **Using Supabase or any PgBouncer-fronted Postgres?** Point `DATABASE_URL` at the **Transaction pooler** (port `6543`, add `?pgbouncer=true`) for the running app, and `DIRECT_URL` at the **Session pooler** (port `5432`) for migrations. Transaction-mode pooling doesn't support the advisory locks Prisma Migrate needs, so schema changes must go through `DIRECT_URL`.

### 3. Create the database schema

```bash
npx prisma migrate dev --name init
```

### 4. (Optional) Seed demo data

Creates 4 demo students and 5 sample submissions spanning all statuses, useful for showcasing the dashboard without manual data entry:

```bash
node seed-demo.js
```

### 5. Run the dev server

```bash
npm run dev
```

The API listens on `http://localhost:5000` by default and seeds the mentor account on first boot.

### Production build

```bash
npm run build   # tsc -> dist/
npm start        # node dist/server.js
```

## API Reference

Base URL: `/api/v1` · Auth header: `Authorization: <accessToken>` (no `Bearer` prefix)

### Auth

| Method | Path | Auth | Body |
|---|---|---|---|
| `POST` | `/auth/register` | None | `{ name, email, password }` — always creates a `STUDENT`; a `role` field in the body is ignored |
| `POST` | `/auth/login` | None | `{ email, password }` → `{ accessToken, user }` |

### Submissions

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/submissions` | `STUDENT` | Create a submission. `409` if this student already has a submission for that `assignmentNumber`. |
| `PATCH` | `/submissions/:id` | `STUDENT` | Edit **your own** submission — allowed exactly **once**. Resets status to `PENDING` and clears feedback for re-review. `403` if already edited. |
| `GET` | `/submissions/my` | `STUDENT` | List your own submissions. |
| `GET` | `/submissions` | `MENTOR` | `?status=PENDING\|APPROVED\|REJECTED&assignmentNumber=1-15&searchTerm=&page=1&limit=10` — search matches project name or student name/email. |
| `GET` | `/submissions/stats` | `MENTOR` | `{ PENDING, APPROVED, REJECTED, total }` |
| `PATCH` | `/submissions/:id/status` | `MENTOR` | `{ status: "APPROVED" \| "REJECTED", feedback? }`. Logged to the activity trail. |
| `GET` | `/submissions/activity` | `MENTOR` | Paginated log of the mentor's own approve/reject actions. |

List endpoints return:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "...",
  "meta": { "page": 1, "limit": 10, "total": 5, "totalPages": 1 },
  "data": [...]
}
```

## Data Model

```prisma
User         { id, name, email, password, role: STUDENT|MENTOR }
Submission   { id, assignmentNumber (1-15), projectName, repoUrl, liveLink?,
               description, status: PENDING|APPROVED|REJECTED, feedback?,
               edited (bool), studentId }
ActivityLog  { id, mentorId, submissionId, action, detail, createdAt }
```

- `@@unique([studentId, assignmentNumber])` enforces one submission per student per assignment.
- `edited` flips to `true` on the student's first (and only permitted) edit.
- Every mentor approve/reject writes an `ActivityLog` row for auditability.

## Project Structure

```
src/
  app.ts, server.ts
  config/               # single source of truth for env vars
  db/seedMentor.ts      # seeds the mentor account on boot
  helpers/jwtHelpers.ts
  shared/               # catchAsync, sendResponse, pick, paginationHelper, prisma client
  app/
    errors/ApiError.ts
    middlewares/        # auth, validateRequest, rateLimiters, sanitizeInput, globalErrorHandler, notFound
    modules/
      auth/             # controller, service, routes, validation
      submission/       # controller, service, routes, validation, interface
    routes/index.ts     # mounts every module under /api/v1
```

## Security Notes

- CORS uses an explicit allowlist (`CLIENT_URL` + localhost) — never `origin: '*'`.
- Passwords are hashed with bcrypt; JWTs are signed with `HS256` and an explicit algorithm whitelist on verify.
- `globalErrorHandler` maps `ApiError`, `ZodError`, and known Prisma errors to correct status codes (never a blanket 500), and never leaks stack traces when `NODE_ENV=production`.
- Rate limiting is applied to `/auth/*` and `POST /submissions` to blunt spam/credential-stuffing.

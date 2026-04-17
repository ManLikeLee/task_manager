# Task Manager Backend

Express + Prisma backend for task/workspace management.

## Quick Start

1. Install dependencies:
   - `npm install`
2. Configure environment:
   - `cp .env.example .env`
3. Generate Prisma client / run migrations:
   - `npm run prisma:generate`
   - `npm run prisma:migrate`
4. Start dev server:
   - `npm run dev`

## Environment Variables

Required core vars (see `.env.example`):

- `PORT`: HTTP port (default `5000`)
- `NODE_ENV`: environment (`development`, `test`, `production`)
- `CLIENT_URL`: allowed CORS origin
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_ACCESS_SECRET`: access token signing secret
- `JWT_REFRESH_SECRET`: refresh token signing secret
- `JWT_ACCESS_EXPIRES_IN`: access token lifetime (default `15m`)
- `JWT_REFRESH_EXPIRES_IN`: refresh token lifetime (default `7d`)

Auth cookie vars:

- `COOKIE_SAMESITE`: `strict`, `lax`, or `none` (default `strict`)
- `COOKIE_SECURE`: boolean-like (`true/false`, `1/0`, `yes/no`, `on/off`)
  - defaults to `true` in `production`, else `false`
- `COOKIE_DOMAIN`: optional cookie domain

## Auth Cookie Behavior

Refresh token cookie (`refreshToken`) is:

- `httpOnly: true`
- `path: /api/auth`
- `maxAge: 7 days`
- `sameSite` / `secure` / `domain` from env settings above

Behavior:

- `POST /api/auth/login` sets refresh cookie and returns access token.
- `POST /api/auth/refresh` verifies refresh token, rotates it, stores the new token hash, sets a new refresh cookie, and returns a new access token.
- `POST /api/auth/logout` uses refresh cookie (no access token required), clears stored refresh token hash if found, and clears cookie.

## API Endpoints

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me` (requires Bearer access token)

Tasks:

- `POST /api/tasks`
- `GET /api/projects/:projectId/tasks` (current)
- `GET /api/tasks/:projectId` (deprecated, backward-compatible)
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`

Health:

- `GET /api/health`
- `GET /api/health/live`
- `GET /api/health/ready` (checks DB with `SELECT 1`)

## Task List Query Parameters

Supported on `GET /api/projects/:projectId/tasks` (and deprecated route):

- `status`: `TODO | IN_PROGRESS | IN_REVIEW | DONE | BLOCKED`
- `priority`: `LOW | MEDIUM | HIGH | URGENT`
- `assigneeId`: UUID
- `q`: search text (title/description)
- `dueBefore`: date
- `dueAfter`: date (must be `<= dueBefore` when both provided)
- `limit`: integer (default `50`, max `100`)
- `cursor`: UUID task id for cursor pagination
- `sortBy`: `createdAt | updatedAt | dueDate | priority | status | title`
- `sortOrder`: `asc | desc`

List response includes:

- `data.tasks`
- `data.nextCursor`
- `data.hasMore`

## Testing

- `npm test`: unit + integration
- `npm run test:unit`
- `npm run test:integration`

Integration tests are protected by a DB safety guard:

- Use `.env.test.example` to create `.env.test`.
- Set `TEST_DATABASE_URL` (or `DATABASE_URL`) to a dedicated test DB URL containing `test`.

## Deprecation and Migration Notes

Task list endpoint migration:

- New route: `GET /api/projects/:projectId/tasks`
- Deprecated route: `GET /api/tasks/:projectId`
- Deprecated route sends header:
  - `Warning: 299 - "Deprecated endpoint, use /api/projects/:projectId/tasks"`

Client migration recommendation:

1. Switch reads to `GET /api/projects/:projectId/tasks`.
2. Keep handling current response payload (`tasks`, `nextCursor`, `hasMore`).
3. Remove reliance on deprecated route before it is removed in a future release.

## More Developer Notes

See [docs/developer-guide.md](docs/developer-guide.md) for implementation-oriented backend notes.

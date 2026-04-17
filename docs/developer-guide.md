# Backend Developer Guide

This document summarizes backend behavior that changed recently and should be preserved in future work.

## Environment Configuration

Use `.env.example` for local/dev and `.env.test.example` for integration tests.

Important variables:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `COOKIE_SAMESITE`
- `COOKIE_SECURE`
- `COOKIE_DOMAIN` (optional)

Test isolation:

- Integration tests require a test DB URL containing `test`.
- `TEST_DATABASE_URL` (if set) overrides `DATABASE_URL` in test setup.

## Auth + Session Contract

- Refresh tokens are stored server-side as `sha256` hash (`User.refreshTokenHash`).
- Refresh rotation is enforced:
  1. verify refresh JWT
  2. verify hash matches stored value
  3. issue new refresh token + new access token
  4. overwrite stored refresh hash
- Reused/invalid/tampered/expired refresh tokens return `401`.
- Logout does not require a Bearer access token; it is refresh-cookie based.

Refresh cookie settings:

- name: `refreshToken`
- `httpOnly: true`
- `path: /api/auth`
- `maxAge: 7 days`
- `sameSite`, `secure`, `domain` from env config

## Task Listing Route and Deprecation

Current route:

- `GET /api/projects/:projectId/tasks`

Deprecated but still active:

- `GET /api/tasks/:projectId`
- response header on deprecated route:
  - `Warning: 299 - "Deprecated endpoint, use /api/projects/:projectId/tasks"`

Both routes use the same controller/service logic.

## Task List Filters, Sorting, Pagination

Accepted query params:

- `status`
- `priority`
- `assigneeId`
- `q`
- `dueBefore`
- `dueAfter`
- `limit` (default `50`, max `100`)
- `cursor`
- `sortBy`
- `sortOrder`

Implementation notes:

- Query inputs are schema-validated before service execution.
- Sorting is deterministic via tie-breaker by `id`.
- Pagination is cursor-based and returns:
  - `nextCursor`
  - `hasMore`

## Health Endpoints

- `GET /api/health` basic health
- `GET /api/health/live` process liveness
- `GET /api/health/ready` readiness with DB ping (`SELECT 1`)

## Graceful Shutdown

`server.js` handles `SIGINT` and `SIGTERM`:

1. log shutdown start
2. stop accepting new HTTP connections (`server.close`)
3. disconnect Prisma (`prisma.$disconnect()`)
4. exit process

## Authorization Policy Notes

Policy helpers are centralized in:

- `src/policies/authorizationPolicy.js`

Role behavior for tasks:

- Workspace access: OWNER / ADMIN / MEMBER
- Task create/update/delete: OWNER / ADMIN only
- Assignee must belong to the same workspace (or be workspace owner)

## Test Commands

- `npm run test:unit`
- `npm run test:integration`
- `npm test`

If integration tests fail with DB safety error, check `.env.test` and ensure URL includes `test`.

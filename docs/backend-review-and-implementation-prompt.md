# Backend Review, Critique, and Implementation Plan

## Executive Summary

This backend has a solid starting structure: clear layer separation (`routes -> controllers -> services -> db services`), Zod validation, JWT auth, Prisma ORM, and baseline security middleware (Helmet/CORS/rate-limiting). The main issues are around **operational resilience**, **auth/session hardening**, **API consistency**, and **test coverage**. Most of these are straightforward to improve without a full rewrite.

---

## What Is Good Already

- Layered design improves maintainability.
- Validation with Zod is consistently used in controllers.
- Password hashing with bcrypt and refresh token hashing is a good security baseline.
- Prisma schema includes useful relations and indexes.
- Middlewares are modular and thoughtfully ordered.

---

## Key Critique and Improvements

## 1) API Contract and Route Design

### Issues
- `GET /api/tasks/:projectId` is semantically confusing and collides with `PATCH/DELETE /api/tasks/:id` path shape.
- Error payloads are not fully consistent across all middleware branches.

### Improvements
- Change to `GET /api/projects/:projectId/tasks`.
- Adopt a single error envelope everywhere:
  - `success: false`
  - `message`
  - `code` (stable error code)
  - `errors` (validation list)
  - `requestId`

## 2) Authentication and Session Security

### Issues
- Refresh endpoint does not rotate refresh tokens.
- Logout requires access token but reads refresh token from cookie; expired access tokens can block logout.
- Cookie flags are static (`sameSite: strict`) and may not work for cross-site clients.

### Improvements
- Implement refresh token rotation on `/api/auth/refresh` with replay detection semantics.
- Allow logout by refresh cookie alone, or support both modes.
- Make cookie policy env-driven:
  - `COOKIE_SAMESITE` (`lax|strict|none`)
  - `COOKIE_SECURE` (boolean)

## 3) Authorization Model

### Issues
- Access checks are scattered in `taskService` and tied to workspace membership checks only.
- Role (`OWNER/ADMIN/MEMBER`) exists in schema but is not enforced for privileged operations.

### Improvements
- Introduce reusable authorization primitives:
  - `canReadProject`, `canWriteTask`, `canDeleteTask`
- Enforce role-based permissions for mutating operations.
- Keep policy decisions in one module (`src/policies/*`).

## 4) Data Access and Performance

### Issues
- Some DB service methods use broad `include` selections and can over-fetch.
- No pagination/filtering/sorting contract for task list endpoint.

### Improvements
- Use explicit `select` consistently (especially for user/workspace relations).
- Add query params:
  - `status`, `priority`, `assigneeId`, `q`, `dueBefore`, `dueAfter`
  - `cursor`, `limit`, `sortBy`, `sortOrder`
- Default limit (e.g. 50), max limit (e.g. 100).

## 5) Observability and Ops

### Issues
- Logger is console-based without standard JSON schema for production ingestion.
- No health/readiness split and no dependency checks.
- No graceful shutdown logic for DB connections/signals.

### Improvements
- Emit structured JSON logs with stable fields: `level`, `timestamp`, `msg`, `requestId`, `path`, `latencyMs`.
- Add:
  - `GET /health/live`
  - `GET /health/ready` (checks DB connectivity)
- Add SIGTERM/SIGINT graceful shutdown with `server.close()` and `prisma.$disconnect()`.

## 6) Validation and Domain Rules

### Issues
- `dueDate` accepts past dates without policy.
- Update schema checks only non-empty object, but not no-op updates after sanitization.

### Improvements
- Add domain constraints:
  - `dueDate >= today` (or explicit allow policy)
  - Status transitions (e.g., cannot move from `DONE` to `IN_PROGRESS` unless override).
- Add custom error codes for domain rule failures.

## 7) Testing Strategy (Highest Priority Gap)

### Current gap
- No actual tests configured.

### Improvements
- Add test stack:
  - **Unit**: Vitest/Jest for services and validators
  - **Integration**: Supertest for HTTP routes
  - **DB integration**: isolated PostgreSQL test database (or Testcontainers)
- Add CI checks:
  - lint
  - test
  - prisma validate/migrate status

---

## Suggested Test Cases

## Auth
1. Register succeeds with valid payload.
2. Register fails for duplicate email (`409`).
3. Login fails with wrong password (`401`).
4. Login sets refresh cookie with expected flags.
5. Refresh succeeds with valid cookie and rotates token.
6. Refresh fails for missing cookie (`401`).
7. Refresh fails for tampered/expired token (`401`).
8. Logout clears cookie even when access token is expired (if refresh-based logout adopted).
9. `/auth/me` returns safe user fields only.

## Task Authorization
1. Workspace owner can create/read/update/delete task.
2. Workspace member can operate based on role policy.
3. Non-member cannot access tasks in workspace (`403`).
4. Assignee must be workspace member (`400`).

## Task Validation
1. Create fails for missing title.
2. Create fails for invalid `projectId` UUID.
3. Update fails for empty payload.
4. Update allows `assigneeId: null` for unassign.
5. Invalid enum values return `400` with validation details.

## Task Query/Pagination (after implementation)
1. Filters by `status`, `priority`, `assigneeId`.
2. Cursor pagination returns deterministic pages.
3. Limit caps at max allowed.
4. Sorts by `createdAt`/`dueDate` ascending/descending.

## Error/Operational
1. Unknown route returns standardized 404 envelope.
2. Prisma unique violation maps to standardized `409` envelope.
3. Request log includes `requestId` and latency.
4. Readiness endpoint fails when DB unavailable.

---

## Recommended Implementation Sequence

1. Add tests and harness first (integration skeleton + fixtures).
2. Normalize API error contract.
3. Refactor task routes to resource-oriented URI.
4. Add task list filtering/pagination/sorting.
5. Harden auth refresh rotation + logout behavior.
6. Add authorization policy module and role checks.
7. Add readiness/liveness + graceful shutdown.
8. Add CI workflow and quality gates.

---

## Comprehensive Codex Prompt (for VS Code)

Use the following prompt in Codex for implementation:

```text
You are working in a Node.js + Express + Prisma backend repository.
Your goal is to implement production-grade improvements in small, reviewable commits.

Context:
- Existing structure: routes/controllers/services/database services.
- Existing tech: express, zod, prisma, jwt auth with refresh cookie.
- Existing domains: user, workspace, workspace members, project, task.

High-level goals:
1) Add automated tests (unit + integration) and wire them into npm scripts.
2) Standardize API error responses across middleware and controllers.
3) Improve route design: replace GET /api/tasks/:projectId with GET /api/projects/:projectId/tasks.
4) Add filtering, pagination, and sorting for task listing.
5) Implement refresh-token rotation and improve logout semantics.
6) Introduce centralized authorization policy helpers (role-aware).
7) Add health endpoints (live/ready) and graceful shutdown.
8) Keep backward compatibility where feasible, with deprecation notes.

Detailed requirements:

A. Testing
- Install and configure vitest (or jest) + supertest.
- Add test scripts:
  - "test": run all tests
  - "test:unit"
  - "test:integration"
- Add integration tests for auth and task flows, including unauthorized/forbidden cases.
- Add fixtures/factories and teardown logic.

B. Error Contract
- Create a shared error formatter utility returning:
  {
    success: false,
    message: string,
    code: string,
    errors?: string[],
    requestId?: string
  }
- Update notFound, token handlers, and global error handler to use same envelope.
- Preserve correct HTTP status codes.

C. Routes/API
- Add new endpoint: GET /api/projects/:projectId/tasks.
- Keep old endpoint temporarily with deprecation response header:
  Warning: 299 - "Deprecated endpoint, use /api/projects/:projectId/tasks"
- Update controllers/services accordingly.

D. Task Listing Enhancements
- Extend validator schema for query params:
  - status, priority, assigneeId, q, dueBefore, dueAfter, limit, cursor, sortBy, sortOrder
- Implement Prisma query builder with safe defaults:
  - limit default 50, max 100
  - deterministic sort with tie-breaker by id
- Return pagination metadata:
  - nextCursor, hasMore

E. Auth Security
- On refresh:
  - Verify refresh token
  - Rotate refresh token (issue new one, store new hash)
  - Reject reused/invalid token with 401
- Adjust logout to support refresh-cookie based logout without requiring valid access token.
- Make cookie flags configurable via env:
  - COOKIE_SAMESITE
  - COOKIE_SECURE
  - COOKIE_DOMAIN (optional)

F. Authorization Policies
- Add src/policies/authorizationPolicy.js with helpers:
  - canAccessWorkspace(userId, workspace)
  - canManageTask(userId, workspace, role)
- Use WorkspaceRole (OWNER/ADMIN/MEMBER) for write/delete constraints.
- Ensure behavior covered by tests.

G. Operations
- Add endpoints:
  - GET /api/health/live => process up
  - GET /api/health/ready => DB check via prisma.$queryRaw`SELECT 1`
- Add graceful shutdown in server bootstrap:
  - handle SIGINT/SIGTERM
  - stop accepting connections
  - prisma disconnect

H. Documentation
- Update README with:
  - env vars
  - API endpoints
  - auth cookie behavior
  - testing instructions
  - deprecations and migration notes

Implementation constraints:
- Do not introduce TypeScript; keep current JS style.
- Keep functions small and composable.
- Do not break existing response shape for success payloads unless necessary.
- Add comments only where logic is non-obvious.

Output format expected from you (Codex):
1) Plan
2) File-by-file changes
3) Tests added/updated
4) Commands run and results
5) Follow-up recommendations

Now start by:
- auditing existing files,
- proposing a concrete step-by-step plan,
- then implementing in iterative commits.
```

---

## Nice-to-Have Next Steps (Post-MVP)

- Add OpenAPI spec generation and contract tests.
- Add idempotency keys for mutation endpoints.
- Add outbox/eventing for task activity timeline.
- Add soft deletes and audit logs for compliance.

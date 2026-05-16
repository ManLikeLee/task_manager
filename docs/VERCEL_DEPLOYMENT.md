# Vercel Deployment Guide (Frontend Only)

This repo should be deployed to Vercel as a **static Vite frontend**.

## Why

Vercel is ideal for static assets and serverless functions. This project's backend is a traditional long-running Express server (`server.js`) with app-level middleware and runtime expectations that are not directly compatible with static `outputDirectory` hosting.

The previous mixed setup (static output + `routes` to `server.js`) caused deployment and routing issues, including `No entrypoint found in output directory: client/dist`.

## Current Vercel Configuration

`vercel.json`:

```json
{
  "version": 2,
  "framework": "vite",
  "buildCommand": "npm run build:client",
  "outputDirectory": "client/dist"
}
```

This deploys only the built frontend in `client/dist`.

In Vercel Project Settings, ensure **Framework Preset** is `Vite` (or `Other` for static), not `Node.js`.

## Backend Strategy

Use one of these approaches:

1. Recommended now: host backend separately (Render, Railway, Fly.io, etc.).
2. Alternative future work: migrate backend routes to Vercel serverless functions under `/api/*`.

The current Express app cannot be run directly as a persistent process on Vercel static output mode without adaptation.

## Frontend API Base URL

Frontend requests use `VITE_API_BASE_URL` from `client/src/lib/api.ts`.

Set in Vercel project env vars:

- `VITE_API_BASE_URL=https://api.yourdomain.com`

Request shape remains:

- `${VITE_API_BASE_URL}/api/auth/login`
- `${VITE_API_BASE_URL}/api/health`

In production builds, `VITE_API_BASE_URL` is required by the frontend. If it is missing, the app throws a clear configuration error instead of silently calling same-origin `/api/*` paths.

## Backend Environment (Separate Host)

Deploy the Express/Prisma backend to Render, Railway, Fly.io, or similar and set at minimum:

```env
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
CLIENT_URL=https://task-force-beta.vercel.app
NODE_ENV=production
COOKIE_SECURE=true
COOKIE_SAMESITE=none
```

## Local Development (Unchanged)

- Backend: `npm run dev:api`
- Frontend: `npm run dev:client`

You can keep local `.env`/`client/.env` values for localhost API.

## Verification Checklist

1. `npm run build:client` succeeds.
2. `client/dist` is generated.
3. Vercel deployment succeeds without `No entrypoint found`.
4. App loads and renders the dark Vite UI.
5. Network requests target `VITE_API_BASE_URL` backend and succeed.

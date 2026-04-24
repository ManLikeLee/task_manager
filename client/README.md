# Client (React + Vite)

Modern frontend for TaskForce.

## Run Locally

1. Install dependencies:
   - `npm install`
2. Configure env:
   - `cp .env.example .env`
3. Start dev server:
   - `npm run dev`
4. Ensure backend API is running (default expected target: `http://127.0.0.1:4050`)

## Environment

- `VITE_API_BASE_URL`
  - Optional explicit API base URL. Keep empty for relative `/api` requests.
- `VITE_API_PROXY_TARGET`
  - Vite proxy target for `/api` in development.

## Architecture

- `src/app`: app wiring and theme provider
- `src/components/ui`: reusable design system primitives
- `src/features/auth`: auth APIs and page
- `src/features/projects`: projects API and project switcher
- `src/features/tasks`: board/list/task editor features
- `src/layouts`: shell, sidebar, topbar
- `src/lib`: API client, query client, utilities
- `src/types`: shared frontend domain types

## Notes

This client is now the intended frontend. The legacy static frontend in the repo root `public/` is deprecated.

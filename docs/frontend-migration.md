# Frontend Migration Note

## Status

The legacy static frontend (`public/index.html`, `public/app.js`, `public/styles.css`) is now deprecated.

The active frontend is the React + TypeScript + Vite application in `client/`.

## Why

The old static single-file pattern is difficult to scale for:

- reusable UI components
- state management
- task board interactions
- responsive feature growth

## New Frontend

Use:

- `npm run dev:client` for local frontend development
- `npm run build:client` for client production build

The new client integrates with the existing backend API contracts and keeps backend task enums and query params intact.

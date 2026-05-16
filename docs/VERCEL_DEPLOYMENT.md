# Vercel Production Deployment Guide

This guide explains how to deploy TaskForce (frontend + backend) to Vercel.

## Overview

TaskForce is a full-stack application:
- **Backend**: Express.js API (Node.js)
- **Frontend**: React + Vite SPA

The `vercel.json` configuration automates the deployment setup.

## Prerequisites

1. **Git repository**: Push your code to GitHub, GitLab, or Bitbucket
2. **Vercel account**: Sign up at https://vercel.com
3. **PostgreSQL database**: Hosted PostgreSQL instance (e.g., Supabase, Railway, Azure Database for PostgreSQL, Neon, or AWS RDS)
4. **Environment variables**: Prepare all required secrets

## Step 1: Connect Git Repository to Vercel

1. Go to https://vercel.com/new
2. Import your Git repository (GitHub, GitLab, or Bitbucket)
3. Vercel automatically detects the project and applies `vercel.json` settings

## Step 2: Configure Environment Variables

Set these environment variables in **Vercel Dashboard** → **Settings** → **Environment Variables**:

### Required Variables

| Variable | Example | Notes |
|----------|---------|-------|
| `NODE_ENV` | `production` | **Required** for production error handling |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` | **CRITICAL** - PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | (random 32+ char string) | **REQUIRED** - Use a strong, random secret |
| `JWT_REFRESH_SECRET` | (random 32+ char string) | **REQUIRED** - Use a different random secret |
| `CLIENT_URL` | `https://yourdomain.com` | **REQUIRED** - Your production frontend domain |
| `COOKIE_SECURE` | `true` | **REQUIRED** for production |
| `COOKIE_SAMESITE` | `none` | **REQUIRED** for production |

### Optional Variables

| Variable | Example | Default | Notes |
|----------|---------|---------|-------|
| `PORT` | `4050` | `4050` | Express server port |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | `7d` | Refresh token TTL |
| `EMAIL_PROVIDER` | `smtp` | `smtp` | `smtp` or `resend` |
| `EMAIL_FROM` | `no-reply@yourdomain.com` | - | Sender email |
| `SMTP_HOST` | `smtp.gmail.com` | - | SMTP server hostname |
| `SMTP_PORT` | `587` | - | SMTP server port |
| `SMTP_USER` | - | - | SMTP authentication user |
| `SMTP_PASS` | - | - | SMTP authentication password |
| `RESEND_API_KEY` | - | - | Resend API key (if using Resend) |

### To Add Variables in Vercel Dashboard:

1. Go to **Dashboard** → **Project Settings** → **Environment Variables**
2. Click **Add new variable**
3. Enter each variable name and value
4. Select which environments it applies to (Production, Preview, Development)
5. Click **Save**

Or use Vercel CLI:

```bash
vercel env add NODE_ENV production
vercel env add DATABASE_URL postgresql://...
# ... continue for all variables
```

## Step 3: Configure Database

### Option A: Supabase (Recommended)

1. Go to https://supabase.com
2. Create a new project
3. Copy the connection string: **Settings** → **Database** → **Connection string**
4. Use the "URI" format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?schema=public`
5. Add to Vercel as `DATABASE_URL`

### Option B: Railway

1. Go to https://railway.app
2. Create a PostgreSQL plugin
3. Copy the connection string from the plugin variables
4. Add to Vercel as `DATABASE_URL`

### Option C: Neon

1. Go to https://neon.tech
2. Create a database project
3. Copy the connection string from **Connection string** tab
4. Add to Vercel as `DATABASE_URL`

### Option D: AWS RDS

1. Create a PostgreSQL RDS instance
2. Copy the endpoint and credentials
3. Format: `postgresql://username:password@endpoint:5432/database?schema=public`
4. Add to Vercel as `DATABASE_URL`

## Step 4: Deployment

### Automatic Deployment (Recommended)

Every push to your main branch (or selected branch) triggers automatic deployment:

1. Make changes to your code
2. Commit and push to GitHub/GitLab/Bitbucket
3. Vercel automatically builds and deploys
4. View deployment status in Vercel Dashboard

### Manual Deployment

Using Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# View logs
vercel logs --tail
```

## Step 5: Verify Deployment

### Health Check

1. Visit: `https://yourdomain.com/api/health`
2. Should return `{ success: true }`

### Login Test

1. Visit frontend: `https://yourdomain.com`
2. Try registering a new account
3. Verify email confirmation works
4. Test login

### API Check

```bash
# Test API directly
curl https://yourdomain.com/api/health

# Test database connectivity
curl https://yourdomain.com/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### Error: "DATABASE_URL not found"

**Cause**: Environment variable not set in Vercel.

**Fix**:
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Verify `DATABASE_URL` is set
3. Redeploy: Go to Deployments and click "Redeploy"

```bash
# Or redeploy via CLI
vercel --prod
```

### Error: "Cannot find module"

**Cause**: Dependencies not installed during build.

**Fix**: Clear Vercel cache and redeploy:
```bash
vercel env list  # Verify env vars are set
vercel --prod --force  # Force rebuild without cache
```

### Frontend shows white UI instead of dark UI

**Cause**: Still serving old `/public` directory.

**Fix**:
1. Verify `vercel.json` routes are correct
2. Check that `npm run build:client` builds to `client/dist/`
3. Redeploy with cache cleared:
   ```bash
   vercel --prod --force
   ```

### Login fails in production

**Cause**: Cookies not sent correctly due to CORS/SameSite settings.

**Fix**:
1. Verify `COOKIE_SECURE=true` and `COOKIE_SAMESITE=none` in Vercel env vars
2. Verify `CLIENT_URL` matches your frontend domain exactly
3. Ensure backend is on same domain or set up proper CORS
4. Check browser DevTools → Application → Cookies for `accessToken` cookie

### Prisma "Client initialization error"

**Cause**: Database connection string invalid or database unreachable.

**Fix**:
1. Test connection string locally:
   ```bash
   # Add to .env temporarily
   DATABASE_URL="..." npm run prisma:migrate
   ```
2. Verify database is not behind a firewall
3. Check credentials in DATABASE_URL
4. Ensure Vercel deployment region can reach database

### "503 Database service unavailable"

**Cause**: Database connection lost during request.

**Fix**:
1. Check database status (is it running?)
2. Check PostgreSQL logs
3. Verify connection pool limits not exceeded
4. Consider using connection pooling (PgBouncer or Vercel Postgres)

## Production Best Practices

### 1. **Secrets Management**

- **Never** commit `.env` files to Git
- Use Vercel Environment Variables for all secrets
- Rotate JWT secrets periodically
- Use different secrets for staging vs. production

### 2. **Database Backups**

- Enable automatic backups in your database provider
- Test backup restore procedures
- Keep backups for at least 30 days

### 3. **Monitoring**

```bash
# View real-time Vercel logs
vercel logs --tail

# Filter specific errors
vercel logs --tail --scope=error
```

### 4. **Error Tracking**

Add Sentry or similar error tracking:

```bash
vercel env add SENTRY_DSN https://...
```

Then initialize in your `server.js`:

```javascript
const Sentry = require("@sentry/node");
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

### 5. **Performance**

- Enable Vercel's automatic caching headers
- Use CDN for static assets
- Monitor function execution time in Vercel Dashboard

### 6. **Security**

- Enable Vercel's DDoS protection
- Use HTTPS everywhere (automatic with Vercel)
- Enable authentication for preview deployments
- Review CORS settings in `src/app.js`

## Rollback Procedure

To revert to a previous deployment:

1. Go to Vercel Dashboard → Deployments
2. Find the previous stable deployment
3. Click **⋯** (more) → **Promote to Production**

## Local Development

The deployment setup doesn't affect local development:

```bash
# Install dependencies
npm install
npm --prefix client install

# Start backend
npm run dev:api

# In another terminal, start frontend
npm run dev:client

# Visit http://localhost:3000
```

## CI/CD Pipeline

Vercel automatically:
1. Installs root dependencies: `npm install`
2. Builds client: `npm run build:client`
3. Deploys `server.js` as serverless function
4. Serves `client/dist` as static files
5. Routes `/api/*` to backend, everything else to `client/dist/index.html`

To customize, edit `vercel.json`.

## Environment-Specific Configuration

### Production

- `NODE_ENV=production`
- `COOKIE_SECURE=true`
- `COOKIE_SAMESITE=none`
- Real database
- Real email provider

### Preview/Staging

- `NODE_ENV=production` (for real testing)
- `COOKIE_SECURE=true`
- `COOKIE_SAMESITE=none`
- Staging database
- Optional: staging email provider

### Development (Local)

- `NODE_ENV=development`
- `COOKIE_SECURE=false`
- `COOKIE_SAMESITE=strict`
- Local/test database
- Mock or test email

## Support

For Vercel-specific questions: https://vercel.com/docs
For TaskForce issues: Check [docs/developer-guide.md](developer-guide.md)

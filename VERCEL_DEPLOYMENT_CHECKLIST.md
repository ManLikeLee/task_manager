# Vercel Deployment Checklist

Complete this checklist before deploying to production.

## Pre-Deployment (Local Testing)

- [ ] Clone and install dependencies:
  ```bash
  npm install
  npm --prefix client install
  ```

- [ ] Local development works:
  ```bash
  npm run dev:api      # Terminal 1: http://localhost:4050
  npm run dev:client   # Terminal 2: http://localhost:3000
  ```
  - [ ] Frontend shows dark Vite UI
  - [ ] Can register and login
  - [ ] API health check works: `curl http://localhost:4050/api/health`

- [ ] Production build locally:
  ```bash
  NODE_ENV=production npm run build:client
  NODE_ENV=production npm start
  ```
  - [ ] Client built to `client/dist/`
  - [ ] Server starts without DATABASE_URL errors (fails with env validation)
  - [ ] Static files served from `client/dist/`

- [ ] Tests pass:
  ```bash
  npm run test:unit
  npm run test:integration
  ```

- [ ] All changes committed:
  ```bash
  git add .
  git commit -m "Fix: Configure Vercel deployment for client/dist"
  git push origin main
  ```

## Vercel Setup

- [ ] Vercel account created: https://vercel.com
- [ ] Git repository connected to Vercel
- [ ] Project imported and detected

## Environment Variables in Vercel Dashboard

Set these in **Settings** → **Environment Variables**:

### Required (ALL MUST BE SET)

- [ ] `NODE_ENV`
  - Value: `production`
  - Environments: Production, Preview, Development

- [ ] `DATABASE_URL`
  - Value: `postgresql://user:password@host:5432/database?schema=public`
  - Environments: Production (at minimum)
  - **Test**: Database must be accessible from Vercel region

- [ ] `JWT_ACCESS_SECRET`
  - Value: (32+ character random string)
  - Generate: `openssl rand -hex 32`
  - Environments: Production, Preview

- [ ] `JWT_REFRESH_SECRET`
  - Value: (32+ character random string, DIFFERENT from access secret)
  - Generate: `openssl rand -hex 32`
  - Environments: Production, Preview

- [ ] `CLIENT_URL`
  - Value: `https://yourdomain.com` (your production domain)
  - Environments: Production
  - Examples:
    - `https://taskforce.example.com`
    - `https://app.example.com`

- [ ] `COOKIE_SECURE`
  - Value: `true`
  - Environments: Production, Preview

- [ ] `COOKIE_SAMESITE`
  - Value: `none`
  - Environments: Production, Preview

### Optional

- [ ] `PORT` (default: 4050)
- [ ] `JWT_ACCESS_EXPIRES_IN` (default: 15m)
- [ ] `JWT_REFRESH_EXPIRES_IN` (default: 7d)
- [ ] Email configuration (see VERCEL_DEPLOYMENT.md)

## Database Preparation

Choose ONE provider:

### Option A: Supabase (Recommended)

- [ ] Account created: https://supabase.com
- [ ] New project created
- [ ] PostgreSQL database initialized
- [ ] Connection string copied: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?schema=public`
- [ ] Network access enabled (or Vercel IP whitelisted)
- [ ] Connection tested locally:
  ```bash
  psql "postgresql://..."
  ```

### Option B: Railway

- [ ] Account created: https://railway.app
- [ ] PostgreSQL plugin added
- [ ] Connection string copied from plugin variables
- [ ] Test connection

### Option C: Neon

- [ ] Account created: https://neon.tech
- [ ] Database project created
- [ ] Connection string copied
- [ ] Test connection

### Option D: AWS RDS

- [ ] RDS instance created (PostgreSQL)
- [ ] Security group allows inbound from Vercel IPs (or 0.0.0.0/0)
- [ ] Connection string formatted: `postgresql://user:pass@endpoint:5432/database`
- [ ] Test connection

## Pre-Deployment Database Setup

- [ ] Database is populated with schema:
  ```bash
  # Download and apply Prisma migrations
  npm run prisma:generate
  npm run prisma:migrate
  ```

- [ ] Migrations run successfully (no pending migrations)

## Deployment

- [ ] All environment variables set in Vercel Dashboard
- [ ] Push to main branch:
  ```bash
  git push origin main
  ```
- [ ] Deployment starts automatically in Vercel Dashboard
- [ ] Build completes successfully (check logs)
  - [ ] npm install succeeds
  - [ ] npm run build:client succeeds (creates client/dist/)
  - [ ] No environment variable errors

## Post-Deployment Verification

### Health & Status

- [ ] API health check returns success:
  ```bash
  curl https://yourdomain.com/api/health
  ```
  Expected response: `{"success":true,"message":"TaskForce API is running","docs":"/api/health"}`

- [ ] Frontend loads (dark Vite UI):
  ```bash
  open https://yourdomain.com
  ```
  - [ ] Dark theme visible
  - [ ] No white UI (deprecated /public)
  - [ ] Page doesn't show raw errors

- [ ] Browser DevTools check:
  - [ ] Go to Application → Cookies
  - [ ] Look for `accessToken` cookie after login
  - [ ] Verify `Secure` flag is set
  - [ ] Verify `SameSite=None`

### Authentication

- [ ] Register new user:
  - [ ] Form accepts input
  - [ ] Email verification sent
  - [ ] Can access verification email or code
  - [ ] Email verification works
  - [ ] User created in database

- [ ] Login works:
  - [ ] Can log in with credentials
  - [ ] Access token received
  - [ ] Dashboard loads
  - [ ] User menu shows current user

- [ ] Logout works:
  - [ ] Click logout
  - [ ] Redirects to login page
  - [ ] Cookies cleared

- [ ] Session persistence:
  - [ ] Refresh page while logged in
  - [ ] Session persists (not logged out)
  - [ ] Refresh token rotation works

### API Requests

- [ ] List workspaces:
  ```bash
  curl https://yourdomain.com/api/workspaces \
    -H "Authorization: Bearer YOUR_TOKEN"
  ```

- [ ] Create workspace:
  ```bash
  curl https://yourdomain.com/api/workspaces \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test"}'
  ```

### Error Scenarios

- [ ] Invalid token returns 401 (not raw error)
- [ ] Missing required field returns validation error
- [ ] Database error returns generic message (not raw error)
- [ ] Non-existent endpoint returns 404

### Logs

- [ ] Check Vercel logs:
  ```bash
  vercel logs --tail
  ```
  - [ ] No persistent errors
  - [ ] Environment variables logged as loaded
  - [ ] Database connection successful

- [ ] Errors are logged but not exposed:
  ```bash
  vercel logs --tail | grep error
  ```

## Rollback Plan

If something goes wrong:

1. Check Vercel Dashboard → Deployments
2. Find last known good deployment
3. Click **⋯** (more) → **Promote to Production**
4. Or via CLI:
   ```bash
   vercel rollback
   ```

## Post-Deployment Maintenance

- [ ] Set up monitoring:
  - [ ] Vercel analytics enabled
  - [ ] Error tracking (Sentry) configured
  - [ ] Log aggregation set up

- [ ] Backup procedures:
  - [ ] Database backups enabled
  - [ ] Backup retention verified (minimum 30 days)
  - [ ] Test restore procedure

- [ ] Security:
  - [ ] HTTPS enabled (automatic with Vercel)
  - [ ] CORS settings reviewed
  - [ ] API rate limiting active
  - [ ] Secrets rotated periodically

- [ ] Performance:
  - [ ] Frontend load time acceptable
  - [ ] API response times normal
  - [ ] No memory leaks in logs

## Troubleshooting

### Issue: "DATABASE_URL not found" or "Environment variable not found"

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Verify `DATABASE_URL` is set
3. Check that it's set for the correct environment (Production)
4. Redeploy: Deployments → click latest → **Redeploy**
5. Or via CLI: `vercel --prod --force`

### Issue: White UI instead of dark UI

1. Verify `vercel.json` exists in repo root
2. Check routes in `vercel.json` are correct
3. Verify `npm run build:client` creates `client/dist/`
4. Redeploy: `vercel --prod --force`
5. Check build logs for TypeScript or Vite errors

### Issue: Login fails

1. Verify all JWT_* secrets are set
2. Check `CLIENT_URL` matches your domain exactly
3. Verify `COOKIE_SECURE=true` and `COOKIE_SAMESITE=none`
4. Check browser DevTools → Network tab for API errors
5. Check Vercel logs for backend errors

### Issue: Database connection fails

1. Verify `DATABASE_URL` is correct
2. Test connection locally: `psql "postgresql://..."`
3. Check database is running and accepting connections
4. Verify Vercel IP can reach database (firewall rules)
5. Check database logs for errors

See [docs/VERCEL_DEPLOYMENT.md](../docs/VERCEL_DEPLOYMENT.md) for more troubleshooting.

## Sign-Off

- [ ] All checks passed
- [ ] Deployment verified in production
- [ ] Team notified of deployment
- [ ] Monitoring in place
- [ ] Documentation updated

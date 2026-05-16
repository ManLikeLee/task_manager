# Quick Reference: Deployment Commands & Configuration

## Local Development

```bash
# Install dependencies
npm install
npm --prefix client install

# Configure environment
cp .env.example .env
cp client/.env.example client/.env

# Initialize database
npm run prisma:generate
npm run prisma:migrate

# Start development
npm run dev:api          # Backend: http://localhost:4050
npm run dev:client       # Frontend: http://localhost:3000 (with hot reload)

# Run tests
npm run test             # All tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests
```

## Production Build (Local Testing)

```bash
# Build client
npm run build:client     # Outputs to client/dist/

# Test production build
NODE_ENV=production npm start

# Visit http://localhost:4050
# Should serve SPA at /
# Should serve API at /api/*
```

## Environment Variables

### Development (.env)
```
NODE_ENV=development
CLIENT_URL=http://localhost:3000
DATABASE_URL=postgresql://localhost/task_manager
JWT_ACCESS_SECRET=dev-secret
JWT_REFRESH_SECRET=dev-secret
COOKIE_SECURE=false
COOKIE_SAMESITE=strict
```

### Production (.env on server)
See `.env.production.example` - copy and fill in real values:
```bash
cp .env.production.example .env.production
# Edit .env.production with real values
```

## Vercel CLI Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to staging
vercel

# Deploy to production
vercel --prod

# Deploy with cache cleared (force rebuild)
vercel --prod --force

# View deployment logs
vercel logs --tail

# View function logs
vercel logs --tail --scope=function

# Rollback to previous deployment
vercel rollback

# Add environment variable
vercel env add DATABASE_URL

# List environment variables
vercel env list

# Pull environment variables
vercel env pull
```

## Database Management

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Validate schema
npm run prisma:validate

# Use Prisma Studio (GUI)
npx prisma studio
```

## Debugging

```bash
# Check if backend is running
curl http://localhost:4050/api/health

# Check if database is connected
curl http://localhost:4050/api/auth/me

# View server logs
npm run dev:api 2>&1 | grep -i error

# Test API with curl
curl -H "Authorization: Bearer TOKEN" http://localhost:4050/api/workspaces

# Database connection test
psql "postgresql://user:pass@host:5432/database"
```

## Common Issues & Fixes

### Issue: "DATABASE_URL not found"
```bash
# Check env vars are set
echo $DATABASE_URL

# Or in Vercel Dashboard
vercel env list

# Redeploy after setting vars
vercel --prod
```

### Issue: "Cannot find module"
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules
npm install
npm --prefix client install

# Rebuild on Vercel
vercel --prod --force
```

### Issue: Port already in use
```bash
# Find process using port 4050
lsof -i :4050

# Kill process (replace PID with actual)
kill -9 PID

# Or use different port
PORT=5050 npm run dev:api
```

### Issue: Prisma client out of sync
```bash
# Regenerate Prisma client
npm run prisma:generate

# If migrations pending
npm run prisma:migrate
```

## Monitoring

```bash
# Watch build output during deployment
vercel logs --tail --follow

# View error logs only
vercel logs --tail --scope=error

# Check function runtime in dashboard
# Settings → Deployments → View logs
```

## Secrets Management

### Generate secure random strings
```bash
# For JWT secrets (hex, 32 bytes = 64 hex chars)
openssl rand -hex 32

# For API keys (base64)
openssl rand -base64 32
```

### Rotating secrets in production
1. Generate new secret: `openssl rand -hex 32`
2. Add to Vercel with new name: e.g., `JWT_ACCESS_SECRET_V2`
3. Deploy and verify works
4. Update code to use new var if needed
5. Remove old secret after verification

## File Structure Reference

```
task_manager/
├── server.js                 # Express server entry point
├── vercel.json              # Vercel deployment config
├── package.json             # Root dependencies & scripts
├── .env.example             # Dev environment template
├── .env.production.example  # Production env template
├── src/
│   ├── app.js              # Express app setup
│   ├── controllers/        # Route handlers
│   ├── routes/             # API routes
│   ├── middlewares/        # Express middleware
│   ├── services/           # Business logic
│   ├── utils/              # Utilities & helpers
│   └── prisma/
│       └── client.js       # Prisma client
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Migration files
├── client/                 # Vite React frontend
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── main.tsx       # React entry point
│   │   ├── app/           # App shell
│   │   ├── features/      # Feature modules
│   │   ├── components/    # Reusable components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # API client, utilities
│   │   └── types/         # TypeScript types
│   └── dist/              # Build output (generated)
├── docs/
│   ├── VERCEL_DEPLOYMENT.md         # Full deployment guide
│   └── developer-guide.md           # Backend guide
├── DEPLOYMENT_FIX_SUMMARY.md        # What was fixed
└── VERCEL_DEPLOYMENT_CHECKLIST.md   # Pre-deployment checklist
```

## Performance Optimization

```bash
# Check bundle size
npm --prefix client run build
du -sh client/dist/

# Profile server startup time
time npm start

# Monitor memory usage during tests
node --max-old-space-size=2048 node_modules/.bin/jest
```

## Documentation

- **Full Deployment Guide**: [docs/VERCEL_DEPLOYMENT.md](docs/VERCEL_DEPLOYMENT.md)
- **Deployment Checklist**: [VERCEL_DEPLOYMENT_CHECKLIST.md](VERCEL_DEPLOYMENT_CHECKLIST.md)
- **What Was Fixed**: [DEPLOYMENT_FIX_SUMMARY.md](DEPLOYMENT_FIX_SUMMARY.md)
- **Developer Guide**: [docs/developer-guide.md](docs/developer-guide.md)
- **Frontend Migration**: [docs/frontend-migration.md](docs/frontend-migration.md)

## Support

For Vercel issues: https://vercel.com/docs
For PostgreSQL help: https://www.postgresql.org/docs/
For Prisma ORM: https://www.prisma.io/docs/
For Express.js: https://expressjs.com/

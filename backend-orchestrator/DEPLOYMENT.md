# 🚀 Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Configuration

Create a `.env` file with production values:

```bash
# Generate secure keys
node setup.js

# Required environment variables
NODE_ENV=production
PORT=3000

# Database (use managed PostgreSQL in production)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Security keys (from setup.js)
MASTER_ENCRYPTION_KEY=your-generated-key
SESSION_SECRET=your-generated-secret

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# MCP Server
EXPENSE_MCP_URL=https://your-mcp-server.fastmcp.app/mcp

# LLM API Keys
DEFAULT_LLM_PROVIDER=gemini
DEFAULT_GEMINI_API_KEY=your-gemini-key
DEFAULT_OPENAI_API_KEY=your-openai-key


# CORS (add your production domains)
ALLOWED_ORIGINS=https://yourdomain.com,chrome-extension://your-extension-id
```

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs
6. Copy Client ID and Secret to `.env`

### 3. Database Setup

#### Option A: Heroku Postgres

```bash
heroku addons:create heroku-postgresql:hobby-dev
heroku config:get DATABASE_URL
```

#### Option B: AWS RDS

1. Create PostgreSQL instance in RDS
2. Configure security groups
3. Get connection string
4. Update `DATABASE_URL` in `.env`

#### Option C: Self-Managed

```bash
# Install PostgreSQL
sudo apt-get install postgresql

# Create database
sudo -u postgres createdb backend_orchestrator

# Update DATABASE_URL
DATABASE_URL=postgresql://localhost:5432/backend_orchestrator
```

### 4. Security Hardening

#### Generate Strong Keys

```bash
node setup.js
```

#### Enable HTTPS

Use a reverse proxy (nginx or Caddy):

```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Rate Limiting

Already configured in `server.js`:
- 100 requests per 15 minutes per IP
- Adjust in production based on traffic

### 5. Monitoring Setup

#### Add Logging

Install Winston:

```bash
npm install winston
```

Create `logger.js`:

```javascript
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
```

#### Health Monitoring

Use PM2 for process management:

```bash
npm install -g pm2

# Start server
pm2 start server.js --name backend-orchestrator

# Monitor
pm2 monit

# View logs
pm2 logs backend-orchestrator
```

---

## Deployment Options

### Option 1: Heroku (Easiest)

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create your-app-name

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MASTER_ENCRYPTION_KEY=$(node -e "console.log(require('./crypto.js').generateMasterKey())")
heroku config:set GOOGLE_CLIENT_ID=your-client-id
# ... set all other env vars

# Deploy
git push heroku main

# Check logs
heroku logs --tail
```

### Option 2: Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add PostgreSQL
railway add postgresql

# Deploy
railway up

# Set environment variables in Railway dashboard
```

### Option 3: AWS EC2 (More Control)

```bash
# Launch EC2 instance (Ubuntu 22.04)
# SSH into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Clone repository
git clone your-repo-url
cd backend-orchestrator

# Install dependencies
npm install --production

# Set up environment
cp .env.example .env
nano .env  # Edit with production values

# Install PM2
sudo npm install -g pm2

# Start application
pm2 start server.js --name backend-orchestrator

# Set up PM2 to start on boot
pm2 startup
pm2 save

# Configure nginx reverse proxy (see above)
sudo apt-get install nginx
sudo nano /etc/nginx/sites-available/backend-orchestrator
sudo ln -s /etc/nginx/sites-available/backend-orchestrator /etc/nginx/sites-enabled/
sudo systemctl restart nginx

# Get SSL certificate (Let's Encrypt)
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

### Option 4: Docker (Portable)

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/backend_orchestrator
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=backend_orchestrator
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Deploy:

```bash
docker-compose up -d
```

---

## Post-Deployment

### 1. Test Endpoints

```bash
# Health check
curl https://api.yourdomain.com/health

# Test authentication (with real Google token)
curl -X POST https://api.yourdomain.com/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken":"real-google-token"}'
```

### 2. Monitor Logs

```bash
# PM2
pm2 logs backend-orchestrator

# Heroku
heroku logs --tail

# Docker
docker-compose logs -f
```

### 3. Set Up Alerts

Use services like:
- **UptimeRobot**: Monitor endpoint availability
- **Sentry**: Error tracking
- **DataDog**: Full observability

### 4. Backup Strategy

#### Database Backups

```bash
# Manual backup
pg_dump -U user -d backend_orchestrator > backup.sql

# Automated (cron)
0 2 * * * pg_dump -U user -d backend_orchestrator > /backups/backup-$(date +\%Y\%m\%d).sql
```

#### Heroku Auto Backups

```bash
heroku pg:backups:schedule DATABASE_URL --at '02:00 America/Los_Angeles'
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Test database connection
psql $DATABASE_URL

# Check if tables exist
\dt

# Manually run schema
psql $DATABASE_URL -f schema.sql
```

### SSL/Certificate Issues

```bash
# Check certificate
openssl s_client -connect api.yourdomain.com:443

# Renew Let's Encrypt
sudo certbot renew
```

### Memory Issues

```bash
# Check memory usage
pm2 status

# Increase Node memory limit
pm2 start server.js --node-args="--max-old-space-size=4096"
```

### Rate Limit Tuning

Edit `server.js`:

```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increase for production
});
```

---

## Scaling Considerations

### Horizontal Scaling

1. **Session Store**: Move from in-memory to Redis

```bash
npm install redis ioredis
```

Update `auth.js`:

```javascript
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

export async function createSession(userId) {
  const token = generateSessionToken();
  await redis.setex(`session:${token}`, 86400, JSON.stringify({ userId }));
  return token;
}
```

2. **Load Balancer**: Use nginx or AWS ALB

3. **Multiple Instances**: Run multiple Node processes

```bash
pm2 start server.js -i max  # Use all CPU cores
```

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_user_llm_keys_provider ON user_llm_keys(provider);

-- Connection pooling (already configured in db.js)
max: 20  -- Adjust based on load
```

---

## Security Best Practices

- [x] HTTPS enabled
- [x] Rate limiting configured
- [x] Helmet security headers
- [x] CORS properly configured
- [x] Secrets in environment variables
- [x] Database connections use SSL
- [x] Session tokens expire
- [x] API keys encrypted at rest
- [x] Input validation on all endpoints
- [x] SQL injection prevention (parameterized queries)

---

## Performance Optimization

### 1. Enable Compression

```bash
npm install compression
```

```javascript
import compression from 'compression';
app.use(compression());
```

### 2. Cache LLM Responses

```javascript
const llmCache = new Map();

export async function parseIntent(userId, text) {
  const cacheKey = `${userId}:${text}`;
  if (llmCache.has(cacheKey)) {
    return llmCache.get(cacheKey);
  }
  
  const result = await callLLM(userId, text);
  llmCache.set(cacheKey, result);
  
  return result;
}
```

### 3. Database Connection Pooling

Already configured in `db.js` with optimal settings.

---

## Maintenance

### Regular Tasks

- [ ] Monitor error rates
- [ ] Review and rotate logs
- [ ] Check database size
- [ ] Update dependencies
- [ ] Review security advisories
- [ ] Test backup restoration
- [ ] Monitor MCP server health
- [ ] Review rate limits

### Monthly Tasks

- [ ] Security audit
- [ ] Performance review
- [ ] Cost optimization
- [ ] Update documentation

---

## Rollback Plan

If deployment fails:

### Heroku

```bash
heroku releases
heroku rollback v123
```

### PM2

```bash
pm2 stop backend-orchestrator
git checkout previous-stable-commit
npm install
pm2 restart backend-orchestrator
```

### Database Migration Rollback

Keep migration scripts:

```sql
-- migrations/001_initial.up.sql
-- migrations/001_initial.down.sql
```

---

## Support & Documentation

- API Docs: See `API_TESTING.md`
- Architecture: See `README.md`
- Issues: Check logs and error messages
- Updates: Follow semantic versioning

---

**Deployment Checklist**

- [ ] Environment variables configured
- [ ] Database created and migrated
- [ ] Google OAuth configured
- [ ] MCP server URL verified
- [ ] HTTPS enabled
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Rate limits tuned
- [ ] Load testing completed
- [ ] Documentation updated
- [ ] Team trained on ops procedures

---

**Status**: ✅ Production-ready with proper configuration

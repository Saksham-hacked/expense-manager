# ✅ Backend Orchestrator - Complete Setup Checklist

Use this checklist to ensure your backend is properly configured and ready for production.

---

## 📦 Pre-Setup

- [ ] Node.js 18+ installed
- [ ] npm or yarn installed
- [ ] Git installed (for version control)
- [ ] Code editor ready (VS Code recommended)

---

## 🗄️ Supabase Setup

### Account & Project
- [ ] Created Supabase account at https://app.supabase.com
- [ ] Created new project
- [ ] Saved database password securely
- [ ] Waited for project provisioning (2-3 minutes)

### Database Schema
- [ ] Opened SQL Editor in Supabase
- [ ] Copied entire `schema.sql` file
- [ ] Pasted and ran in SQL Editor
- [ ] Verified "Success. No rows returned" message
- [ ] Checked Table Editor shows `users` and `user_llm_keys` tables

### API Credentials
- [ ] Navigated to Settings → API
- [ ] Copied Project URL (starts with `https://`)
- [ ] Copied **Service Role Key** (not anon key!)
- [ ] Saved both securely

**Reference:** [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

---

## 🔑 Google OAuth Setup

### Google Cloud Console
- [ ] Went to https://console.cloud.google.com
- [ ] Created or selected a project
- [ ] Enabled "Google+ API"
- [ ] Created OAuth 2.0 credentials
- [ ] Added authorized redirect URIs:
  - [ ] `http://localhost:3000/auth/callback` (dev)
  - [ ] `https://yourdomain.com/auth/callback` (prod)
- [ ] Copied Client ID
- [ ] Copied Client Secret

### OAuth Consent Screen
- [ ] Configured OAuth consent screen
- [ ] Added app name and logo
- [ ] Added test users (for development)
- [ ] Set scopes: `email`, `profile`, `openid`

---

## 🔐 Security Configuration

### Encryption Keys
- [ ] Generated `MASTER_ENCRYPTION_KEY` (32 bytes):
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```
- [ ] Generated `SESSION_SECRET` (32 bytes):
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```
- [ ] Saved both securely (password manager recommended)

### .env File
- [ ] Copied `.env.example` to `.env`
- [ ] Filled in all required values
- [ ] Verified no placeholder text remains
- [ ] Added `.env` to `.gitignore`
- [ ] Never committed `.env` to Git

---

## 🤖 LLM Configuration

### Choose Provider
- [ ] Decided on default provider (Gemini or OpenAI)
- [ ] Obtained API key from chosen provider:
  - Gemini: https://makersuite.google.com/app/apikey
  - OpenAI: https://platform.openai.com/api-keys

### BYOK Support
- [ ] Understood users can provide their own keys
- [ ] Tested key storage endpoint
- [ ] Verified encryption works

---

## 🔧 MCP Server Configuration

### Expense MCP Server
- [ ] Deployed expense MCP server (separate project)
- [ ] Got MCP server URL (FastMCP Cloud)
- [ ] Added URL to `.env` as `EXPENSE_MCP_URL`
- [ ] Tested MCP server is reachable
- [ ] Verified MCP tools are working

**Note:** If you don't have MCP server yet, you can set this up later.

---

## 📦 Installation

### Dependencies
- [ ] Ran `npm install`
- [ ] Verified `@supabase/supabase-js` installed
- [ ] No installation errors
- [ ] Checked `node_modules` exists

### File Structure
- [ ] Verified all required files present:
  - [ ] `server.js`
  - [ ] `db.js`
  - [ ] `auth.js`
  - [ ] `crypto.js`
  - [ ] `llm.js`
  - [ ] `mcpClient.js`
  - [ ] `middleware.js`
  - [ ] `routes/auth.js`
  - [ ] `routes/llm.js`
  - [ ] `routes/execute.js`
  - [ ] `package.json`
  - [ ] `.env`

---

## ✅ Testing & Verification

### Database Connection
- [ ] Ran `npm run dev`
- [ ] Saw "✅ Connected to Supabase database"
- [ ] Saw "✅ Database schema verified"
- [ ] No database errors in console

### Server Started
- [ ] Saw "🚀 Backend Orchestrator running on port 3000"
- [ ] Server is accessible at `http://localhost:3000`
- [ ] No port conflicts

### Health Check
- [ ] Tested health endpoint:
  ```bash
  curl http://localhost:3000/execute/health
  ```
- [ ] Received successful response

### Google OAuth (Manual Test)
- [ ] Got Google ID token (use Google OAuth Playground)
- [ ] Called `/auth/google` endpoint
- [ ] Received session token
- [ ] Verified user created in Supabase Table Editor

### LLM Intent Parsing
- [ ] Called `/llm/intent` with test message:
  ```bash
  curl -X POST http://localhost:3000/llm/intent \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"text":"add 50 rupees burger"}'
  ```
- [ ] Received valid JSON tool call
- [ ] Tool name and arguments correct

### MCP Execution (if MCP server available)
- [ ] Called `/execute/combined` endpoint
- [ ] Received successful execution result
- [ ] Verified data in MCP server database

---

## 🛡️ Security Checklist

### Environment Variables
- [ ] No secrets in code
- [ ] All secrets in `.env` only
- [ ] `.env` in `.gitignore`
- [ ] Never logged environment variables

### Encryption
- [ ] MASTER_ENCRYPTION_KEY is 32 bytes
- [ ] All stored keys are encrypted
- [ ] Decryption only in memory
- [ ] No plaintext keys in logs

### Authentication
- [ ] Google OAuth properly configured
- [ ] Session tokens expire
- [ ] Authorization middleware on protected routes
- [ ] User isolation enforced

### CORS
- [ ] ALLOWED_ORIGINS properly configured
- [ ] No wildcard `*` in production
- [ ] Chrome extension ID added

---

## 📊 Production Readiness (Optional)

### Infrastructure
- [ ] Deployed to hosting service (Vercel, Heroku, etc.)
- [ ] HTTPS enabled
- [ ] Environment variables configured on host
- [ ] Database connection pooling verified

### Monitoring
- [ ] Logging configured
- [ ] Error tracking set up (Sentry, etc.)
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring configured

### Backups
- [ ] Supabase automatic backups enabled
- [ ] Point-in-Time Recovery (PITR) configured
- [ ] Manual backup tested

### Rate Limiting
- [ ] Rate limiting configured per user
- [ ] DDoS protection considered
- [ ] API usage monitoring set up

---

## 📚 Documentation

- [ ] Read entire README.md
- [ ] Understood architecture diagram
- [ ] Read SUPABASE_SETUP.md
- [ ] Reviewed API documentation
- [ ] Understood MCP philosophy

---

## 🎯 Final Verification

### Comprehensive Test
- [ ] End-to-end flow works:
  1. [ ] Authenticate with Google
  2. [ ] Parse natural language intent
  3. [ ] Execute MCP tool
  4. [ ] Verify result
- [ ] No errors in console
- [ ] All responses return expected format

### Chrome Extension Integration (if ready)
- [ ] Extension can authenticate
- [ ] Extension can send commands
- [ ] Backend processes commands correctly
- [ ] Results return to extension

---

## 🚨 Common Issues Resolved

- [ ] Supabase connection works
- [ ] Google OAuth flow complete
- [ ] LLM API key valid
- [ ] MCP server reachable
- [ ] No CORS errors
- [ ] Encryption/decryption works

---

## ✨ Optional Enhancements

- [ ] Added comprehensive tests
- [ ] Set up CI/CD pipeline
- [ ] Added OpenAPI/Swagger docs
- [ ] Implemented webhooks
- [ ] Added Redis for sessions
- [ ] Set up staging environment

---

## 📝 Notes & Issues

Use this space to track any issues or notes:

```
Date: _________
Issue: _________
Resolution: _________
```

---

## 🎉 Completion

Once all items are checked:

✅ **Backend is ready for development!**
✅ **Ready to integrate with Chrome extension**
✅ **Resume-grade architecture achieved**

---

## 📞 Need Help?

- Check [README.md](./README.md) for detailed docs
- See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for DB setup
- Review [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) if migrating

---

**Last Updated:** January 2026

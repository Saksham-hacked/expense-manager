# 🚀 Quick Start Guide

**Get your Backend Orchestrator running in 5 minutes!**

---

## ⚡ Super Quick Setup (TL;DR)

```bash
# 1. Install dependencies
npm install

# 2. Run interactive setup
node setup.js

3. Create Supabase project and run schema
(Go to https://app.supabase.com and run schema.sql in SQL Editor)

# 4. Start server
npm run dev
```

---

## 📋 Essential Commands

### Development
```bash
# Start with auto-reload
npm run dev

# Start normally
npm start

# Run setup wizard
node setup.js
```

### Testing
```bash
# Health check
curl http://localhost:3000/execute/health

# Test Google auth (replace with real token)
curl -X POST http://localhost:3000/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken":"your-token-here"}'

# Parse natural language
curl -X POST http://localhost:3000/llm/intent \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"text":"add 50 rupees burger"}'
```

---

## 🔧 Environment Variables (Quick Reference)

```env
# Supabase (Required)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...

# Security (Required - generate with crypto.randomBytes)
MASTER_ENCRYPTION_KEY=base64-encoded-32-byte-key
SESSION_SECRET=your-session-secret

# Google OAuth (Required)
GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret

# MCP Server (Required for execution)
EXPENSE_MCP_URL=https://your-mcp.fastmcp.app/mcp

# LLM (At least one required)
DEFAULT_LLM_PROVIDER=gemini
DEFAULT_GEMINI_API_KEY=your-gemini-key
DEFAULT_OPENAI_API_KEY=your-openai-key
```

---

## 📍 Where to Get Credentials

| Credential | Where to Get It |
|------------|----------------|
| **Supabase URL & Key** | https://app.supabase.com/project/_/settings/api |
| **Google OAuth** | https://console.cloud.google.com/apis/credentials |
| **Gemini API Key** | https://makersuite.google.com/app/apikey |
| **OpenAI API Key** | https://platform.openai.com/api-keys |
| **MCP Server URL** | Deploy expense MCP separately (FastMCP Cloud) |

---

## 🗄️ Supabase Quick Setup

```bash
# 1. Create project at https://app.supabase.com
# 2. Go to SQL Editor
# 3. Copy/paste schema.sql
# 4. Click "Run"
# 5. Done!
```

**Verify tables:**
- Go to Table Editor
- Should see: `users`, `user_llm_keys`

---

## 🔑 Generate Security Keys

```bash
# MASTER_ENCRYPTION_KEY (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# SESSION_SECRET (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Paste results into `.env` file.

---

## 🎯 API Endpoints Cheat Sheet

### Authentication
```
POST   /auth/google        # Login with Google
POST   /auth/logout        # Logout
GET    /auth/session       # Get session info
```

### LLM & Intent
```
POST   /llm/intent         # Parse natural language (no execution)
POST   /llm/keys           # Store user's LLM API key (BYOK)
GET    /llm/keys           # Check if user has key
DELETE /llm/keys           # Remove stored key
GET    /llm/tools          # List available tools
```

### Execution
```
POST   /execute            # Execute MCP tool with params
POST   /execute/combined   # Parse + execute in one call
GET    /execute/health     # Check MCP server health
GET    /execute/tools      # List MCP tools
```

---

## 🚨 Troubleshooting Quick Fixes

### "Cannot connect to Supabase"
```bash
# Check environment variables
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_KEY

# Verify in .env file
cat .env | grep SUPABASE
```

### "Google token verification failed"
- Token expired (valid for 1 hour)
- Wrong `GOOGLE_CLIENT_ID` in `.env`
- Token from different Google Cloud project

### "LLM API error"
- Check API key is valid
- Verify provider matches key (gemini vs openai)
- Check API quota/billing

### "MCP server unreachable"
- Verify `EXPENSE_MCP_URL` is correct
- Check MCP server is running
- Test: `curl <EXPENSE_MCP_URL>/health`

---

## 📊 Log Messages Reference

```bash
✅ Connected to Supabase database      # DB connection OK
✅ Database schema verified            # Tables exist
🚀 Backend Orchestrator running...     # Server started

❌ Missing required environment...     # Check .env
❌ Supabase connection failed         # Check credentials
❌ Google token verification failed   # Check OAuth setup
```

---

## 🔍 Quick Diagnostics

```bash
# Check Node version (need 18+)
node --version

# Check if dependencies installed
ls node_modules/@supabase/supabase-js

# Check if .env exists and has content
cat .env

# Check server is running
curl http://localhost:3000/execute/health

# Check Supabase tables
# Go to https://app.supabase.com → Table Editor
```

---

## 📚 Documentation Quick Links

- **Full Setup:** [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- **Complete Docs:** [README.md](./README.md)
- **Migration Guide:** [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
- **Checklist:** [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)

---

## 💡 Pro Tips

```bash
# Use setup wizard for easy config
node setup.js

# Watch logs in development
npm run dev | tee server.log

# Test with fake Google token (will fail auth but tests endpoint)
curl -X POST http://localhost:3000/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken":"test"}'

# Check if port is already in use
lsof -ti:3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows
```

---

## 🎯 Next Steps After Setup

1. **Test Authentication**
   - Get real Google OAuth token
   - Test `/auth/google` endpoint
   - Verify user in Supabase

2. **Test LLM Parsing**
   - Send natural language to `/llm/intent`
   - Verify JSON output format

3. **Integrate Chrome Extension**
   - Update extension with backend URL
   - Test end-to-end flow

4. **Deploy (Optional)**
   - Choose hosting (Vercel, Railway, etc.)
   - Set up environment variables
   - Enable HTTPS

---

## ⚡ One-Liner Installation

```bash
npm install && node setup.js && npm run dev
```

(You'll still need to run schema.sql in Supabase!)

---

**Need more help?** See the full [README.md](./README.md) or [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

---

**Last Updated:** January 2026

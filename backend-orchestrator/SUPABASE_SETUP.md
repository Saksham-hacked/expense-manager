# 🚀 Supabase Setup Guide

This guide walks you through setting up Supabase as the database for the Backend Orchestrator.

---

## 📋 Prerequisites

- A Supabase account (free tier works!)
- Node.js 18+ installed

---

## 🔧 Step 1: Create Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click **"New Project"**
3. Fill in:
   - **Name**: `backend-orchestrator` (or any name)
   - **Database Password**: Save this securely!
   - **Region**: Choose closest to you
4. Click **"Create new project"**
5. Wait 2-3 minutes for provisioning

---

## 🗄️ Step 2: Run Database Schema

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Copy the entire contents of `schema.sql`
4. Paste into the SQL Editor
5. Click **"Run"** or press `Ctrl/Cmd + Enter`
6. Verify success: You should see "Success. No rows returned"

---

## 🔑 Step 3: Get API Credentials

1. Go to **Settings** (gear icon in left sidebar)
2. Click **API** in the settings menu
3. Copy the following:

   **Project URL:**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```

   **Service Role Key** (⚠️ Keep this secret!):
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   **Important:** Use the **service_role** key, NOT the **anon** key!

---

## 🔐 Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:

   ```env
   # Supabase Configuration
   SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   
   # Generate a secure encryption key:
   MASTER_ENCRYPTION_KEY=<generate-32-byte-key>
   SESSION_SECRET=<generate-random-secret>
   ```

3. Generate secure keys:
   ```bash
   # In Node.js REPL or browser console:
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

---

## 📦 Step 5: Install Dependencies

```bash
npm install
```

This will install `@supabase/supabase-js` and other required packages.

---

## ✅ Step 6: Verify Setup

Run the server in development mode:

```bash
npm run dev
```

You should see:
```
✅ Connected to Supabase database
✅ Database schema verified
🚀 Backend Orchestrator running on port 3000
```

---

## 🎯 Step 7: Test Database Connection

You can test the database by running:

```bash
curl -X POST http://localhost:3000/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken": "test-token"}'
```

(This will fail auth but confirms DB is reachable)

---

## 🔍 Verify Tables in Supabase

1. Go to **Table Editor** in Supabase
2. You should see:
   - `users` table
   - `user_llm_keys` table

---

## 🛡️ Security Notes

### ✅ DO:
- Use **service_role** key on backend
- Keep service key in `.env` (never commit!)
- Enable RLS policies (already in schema.sql)
- Use HTTPS in production

### ❌ DON'T:
- Never use **anon** key for backend
- Never commit `.env` to Git
- Never expose service_role key to frontend
- Never log decrypted API keys

---

## 🐛 Troubleshooting

### Error: "PGRST116 - table not found"
**Solution:** Run `schema.sql` in Supabase SQL Editor

### Error: "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY"
**Solution:** Check your `.env` file has correct values

### Error: "Invalid API key"
**Solution:** Make sure you're using the **service_role** key, not anon key

### Connection timeout
**Solution:** Check your Supabase project is active and not paused (free tier)

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## 🎉 Next Steps

Once setup is complete:

1. Configure Google OAuth (see main README.md)
2. Add LLM API keys (Gemini/OpenAI)
3. Configure MCP server URL
4. Test with Chrome extension

---

## 💡 Free Tier Limits

Supabase free tier includes:
- 500 MB database space
- 2 GB bandwidth
- 50 MB file storage
- Unlimited API requests

This is more than enough for development and small production use!

---

Need help? Check the main [README.md](./README.md) or Supabase support.

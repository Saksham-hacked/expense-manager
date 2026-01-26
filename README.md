# Floating AI Expense Assistant - Chrome Extension

A Chrome Extension with a floating UI that helps users manage expenses using AI-powered natural language commands.

## 🏗️ Architecture

This is a **thin client** that:
- Provides UI for user interaction
- Handles Google authentication
- Sends user input to backend orchestrator
- Shows confirmation before executing actions
- Implements BYOK (Bring Your Own Key) for Gemini API

**What this does NOT do:**
- ❌ Does NOT call LLM APIs directly
- ❌ Does NOT parse intent or choose tools
- ❌ Does NOT store API keys locally
- ❌ Does NOT auto-execute actions

All AI processing and MCP server communication happens in the backend.

---

## 📁 Project Structure

```
floating-ai-expense-extension/
│
├── manifest.json              # Chrome Extension manifest (MV3)
├── package.json               # Node.js dependencies
├── webpack.config.js          # Build configuration
│
├── public/
│   └── styles.css            # Main stylesheet (loaded via manifest)
│
├── src/
│   ├── contentScript.jsx     # Entry point (injected into pages)
│   ├── FloatingWidget.jsx    # Main container component
│   ├── Auth.jsx              # Google Sign-In component
│   ├── Settings.jsx          # Settings & BYOK component
│   ├── ConfirmAction.jsx     # Action confirmation component
│   └── api.js                # Backend API client
│
└── dist/
    └── contentScript.js      # Compiled bundle (generated)
```

---

## 🚀 Setup Guide

### Prerequisites

1. **Node.js** (v16 or higher)
2. **npm** (comes with Node.js)
3. **Chrome Browser**
4. **Backend server** running on `http://localhost:3000`

### Step 1: Install Dependencies

Open terminal in the project folder and run:

```bash
npm install
```

This installs:
- React and React DOM
- Webpack (for bundling)
- Babel (for JSX compilation)

### Step 2: Build the Extension

```bash
npm run build
```

This creates `dist/contentScript.js` which is the compiled bundle.

For development with auto-rebuild:

```bash
npm run dev
```

### Step 3: Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable **Chrome Identity API**
4. Create **OAuth 2.0 Client ID**:
   - Application type: **Chrome Extension**
   - Copy the Client ID
5. Open `manifest.json` and replace:
   ```json
   "client_id": "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
   ```

### Step 4: Load Extension in Chrome

1. Open Chrome and go to:
   ```
   chrome://extensions
   ```

2. Enable **Developer mode** (toggle in top-right)

3. Click **Load unpacked**

4. Select this folder:
   ```
   C:\Users\saksh\Desktop\floating-ai-expense-extension
   ```

5. The extension should now appear in your extensions list

---

## 🧪 Local Testing Guide

### Test 1: Extension Loads

1. Open any webpage (e.g., `google.com`)
2. Look for a **💰 icon** in the bottom-right corner
3. If visible → CSS and content script loaded correctly ✅

**If not visible:**
- Open Chrome DevTools → Console
- Look for errors
- Check if `[Floating Expense Widget] Initialized` appears

### Test 2: CSS Verification

1. Click the 💰 icon to expand the widget
2. Check if:
   - Widget has proper styling (purple gradient header)
   - Text is readable
   - Buttons look correct

**If CSS is broken:**
- Verify `public/styles.css` exists
- Check `manifest.json` → `content_scripts` → `css` array
- Rebuild: `npm run build`

### Test 3: Authentication Flow

1. Click **Sign in with Google**
2. Chrome should show Google sign-in popup
3. After signing in, widget should show input view

**If sign-in fails:**
- Check `manifest.json` has correct `client_id`
- Verify Chrome Identity API is enabled
- Check browser console for errors

### Test 4: Backend Connection

**Prerequisites:**
- Backend server must be running on `http://localhost:3000`
- Backend must have these endpoints:
  - `POST /auth/google`
  - `POST /llm/intent`
  - `POST /execute`
  - `POST /user/llm-key`
  - `DELETE /user/llm-key`

**Test flow:**
1. After signing in, type: `add 50 rupees burger to my expenses`
2. Click **Process Request**
3. Should show confirmation screen with parsed action

**If backend connection fails:**
- Check backend is running: `curl http://localhost:3000`
- Open Chrome DevTools → Network tab
- Look for failed requests to `localhost:3000`

### Test 5: Confirmation & Execution

1. On confirmation screen, click **Confirm & Execute**
2. Should execute action via backend
3. Should show success message

### Test 6: Settings & BYOK

1. Click ⚙️ icon in header
2. Should show settings view with:
   - User account info
   - API key input
   - Sign out button
3. Test saving API key (it should NOT be stored locally)

---

## 🔧 Troubleshooting

### CSS Not Loading

**Symptoms:** Widget has no styling, looks broken

**Solution:**
1. Check `manifest.json`:
   ```json
   "content_scripts": [{
     "css": ["public/styles.css"]
   }]
   ```
2. Verify `public/styles.css` exists
3. Reload extension in `chrome://extensions`

### Content Script Not Injecting

**Symptoms:** No 💰 icon appears on webpages

**Solution:**
1. Check if `dist/contentScript.js` exists
2. Run `npm run build` to regenerate
3. Check manifest:
   ```json
   "content_scripts": [{
     "js": ["dist/contentScript.js"]
   }]
   ```
4. Check browser console for errors

### React/JSX Errors

**Symptoms:** Extension loads but crashes immediately

**Solution:**
1. Rebuild: `npm run build`
2. Check webpack compiled successfully
3. Look for syntax errors in `.jsx` files

### Backend Connection Errors

**Symptoms:** "Failed to fetch" or CORS errors

**Solution:**
1. Verify backend is running
2. Check `manifest.json` → `host_permissions`:
   ```json
   "host_permissions": ["http://localhost:3000/*"]
   ```
3. Backend must send CORS headers:
   ```
   Access-Control-Allow-Origin: chrome-extension://[YOUR_EXTENSION_ID]
   ```

### Google Sign-In Fails

**Symptoms:** "OAuth error" or blank popup

**Solution:**
1. Verify `client_id` in `manifest.json`
2. Ensure OAuth consent screen is configured
3. Check Chrome Identity API is enabled
4. Try removing and re-adding extension

---

## 🔐 Security Notes

### ✅ What's Secure

- API keys sent to backend only (NEVER stored locally)
- Session tokens stored in `chrome.storage.local`
- All actions require user confirmation
- Google authentication via Chrome Identity API

### ⚠️ What to Verify

- Backend validates session tokens
- Backend stores API keys securely (encrypted)
- HTTPS used in production (not localhost)

---

## 🛠️ Development Workflow

### Making Changes

1. Edit source files in `src/`
2. Run `npm run dev` for auto-rebuild
3. Reload extension:
   - Go to `chrome://extensions`
   - Click reload icon on your extension
   - Refresh webpage to see changes

### Adding New Components

1. Create `.jsx` file in `src/`
2. Import in relevant parent component
3. Rebuild with `npm run build`

### Updating Styles

1. Edit `public/styles.css`
2. Reload extension in Chrome
3. CSS changes are immediate (no build needed)

---

## 📋 API Contracts

### Backend Endpoints Required

```
POST /auth/google
Body: { idToken: string }
Response: { sessionToken: string, user: object }

POST /llm/intent
Headers: Authorization: Bearer <token>
Body: { input: string }
Response: { tool: string, arguments: object }

POST /execute
Headers: Authorization: Bearer <token>
Body: { tool: string, arguments: object }
Response: { success: boolean, result: any }

POST /user/llm-key
Headers: Authorization: Bearer <token>
Body: { apiKey: string }
Response: { success: boolean }

DELETE /user/llm-key
Headers: Authorization: Bearer <token>
Response: { success: boolean }
```

---

## 🎯 Design Philosophy

This extension follows a **human-in-the-loop AI** approach:

1. User gives natural language command
2. Backend parses intent using LLM
3. **User confirms** before execution
4. Backend executes via MCP server
5. User sees result

**Key Principles:**
- Never auto-execute
- Always show what will happen
- Keep UI simple and focused
- Let backend handle complexity

---

## 📝 Common Issues

### "Uncaught ReferenceError: React is not defined"

**Cause:** Webpack not bundling React correctly

**Fix:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Extension not appearing in extension list

**Cause:** Invalid `manifest.json`

**Fix:**
- Validate JSON syntax
- Ensure all required fields present
- Check for typos in field names

### "Service worker registration failed"

**Cause:** Manifest V3 requires service workers for background scripts

**Fix:** This extension doesn't use background scripts, so ignore this warning

---

## 🔄 Update Instructions

### To Update Extension

1. Make changes to source files
2. Run `npm run build`
3. Go to `chrome://extensions`
4. Click reload button on your extension
5. Refresh any open webpages

### To Publish

1. Create production build: `npm run build`
2. Create `.zip` of entire folder (excluding `node_modules`)
3. Upload to Chrome Web Store
4. Update backend URLs from localhost to production

---

## 📞 Support

If you encounter issues:

1. Check browser console for errors
2. Verify backend is running and accessible
3. Ensure all dependencies installed: `npm install`
4. Try clean rebuild: `npm run build`
5. Check manifest.json syntax

---

## ✅ Verification Checklist

Before deployment, verify:

- [ ] `npm install` completes without errors
- [ ] `npm run build` creates `dist/contentScript.js`
- [ ] Extension loads in `chrome://extensions`
- [ ] 💰 icon appears on webpages
- [ ] CSS styles are applied correctly
- [ ] Google sign-in works
- [ ] Backend connection successful
- [ ] Confirmation screen shows correctly
- [ ] Actions execute successfully
- [ ] Settings panel accessible
- [ ] BYOK flow works

---

**Version:** 0.1.0  
**Last Updated:** January 2026  
**License:** MIT





# Backend Orchestrator

**AI-Driven MCP Orchestrator with Multi-User Support and BYOK**

A sophisticated backend service that acts as an intelligent orchestration layer between users and MCP (Model Context Protocol) servers. This is NOT a traditional REST API—it's an AI-powered decision layer that uses LLMs to translate natural language into structured tool calls.

---

## 🎯 Purpose & Philosophy

### What This Backend Does

1. **Authenticates users** via Google OAuth 2.0
2. **Translates natural language** into structured MCP tool calls using LLMs
3. **Validates and executes** MCP tools with strict security controls
4. **Enforces multi-user isolation** by injecting `user_id` into all operations
5. **Stores encrypted API keys** (BYOK - Bring Your Own Key)

### What This Backend Is NOT

- ❌ A traditional CRUD API
- ❌ A chatbot or conversational AI
- ❌ A database for domain data (expenses live in MCP server)
- ❌ A monolithic backend with business logic

### Core Architectural Principles

```
┌─────────────────────────────────────────────────────────┐
│  THIS BACKEND IS:                                       │
│  • An AI decision layer                                 │
│  • A security boundary                                  │
│  • A tool execution gate                                │
│                                                          │
│  IT DOES NOT:                                           │
│  • Choose MCP tools manually in code                    │
│  • Contain expense business logic                       │
│  • Access expense data directly                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🏗️ System Architecture

```
Chrome Extension
   │
   │ Natural-language intent: "add 50 rupees burger"
   ▼
Backend Orchestrator  ← (THIS PROJECT)
├── Google OAuth (identity)
├── Supabase DB (users + encrypted LLM keys)
├── LLM (intent → tool selection)
├── Safety & validation layer
└── MCP client
        │
        │ Validated tool call + user_id
        ▼
FastMCP Cloud
┌───────────────────────────────┐
│ Expense MCP Server            │
│ (Postgres + Tools only)       │
│ • add_expense                 │
│ • get_expenses                │
│ • update_expense              │
│ • delete_expense              │
│ • get_expense_stats           │
│ • search_expenses             │
└───────────────────────────────┘
```

---

## 🧠 Why LLM Lives in Backend (NOT MCP Server)

This is a critical design decision:

### ✅ Correct Architecture (Current)

```javascript
User: "add burger 50 rupees"
  ↓
Backend: [LLM translates to JSON]
  → { tool: "add_expense", arguments: { amount: 50, ... }}
  ↓
MCP Server: [Pure execution]
  → INSERT INTO expenses VALUES (...)
```

### ❌ Wrong Architecture (Avoided)

```javascript
User: "add burger 50 rupees"
  ↓
MCP Server: [Has LLM + business logic]  ← VIOLATES MCP PHILOSOPHY
  → Tightly coupled, not reusable
```

### Why This Matters

1. **MCP Philosophy**: MCP servers should be pure capability executors
2. **Reusability**: Same MCP server can serve multiple frontends
3. **Security**: Backend validates before execution
4. **Modularity**: Can swap MCP servers without changing LLM logic

---

## 🔐 Security Model

### Google OAuth Flow

```
1. Client sends Google ID token
2. Backend verifies with Google
3. Extracts user_id (Google sub) + email
4. Creates/fetches user record in Supabase
5. Issues backend session token
6. Client uses session token for all requests
```

### BYOK (Bring Your Own Key)

Users can optionally provide their own LLM API keys:

```javascript
POST /llm/keys
{
  "provider": "gemini",
  "apiKey": "your-gemini-key"
}
```

Keys are:
- ✅ Encrypted with AES-256-GCM
- ✅ Stored encrypted in Supabase
- ✅ Decrypted only in memory
- ✅ Never logged or exposed

### Multi-User Isolation

Every MCP call includes `user_id`:

```javascript
// User makes request
POST /execute/combined
{ "text": "show my expenses" }

// Backend injects user_id
→ MCP call: { tool: "get_expenses", arguments: { user_id: "user_123" }}

// MCP server filters by user_id
→ SELECT * FROM expenses WHERE user_id = 'user_123'
```

---

## 📦 Backend Database (Supabase)

The backend uses **Supabase** (PostgreSQL) for ONLY:

### Schema

```sql
-- User identity (from Google OAuth)
CREATE TABLE users (
    user_id TEXT PRIMARY KEY,          -- Google OAuth "sub"
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Encrypted LLM API keys (BYOK)
CREATE TABLE user_llm_keys (
    user_id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,             -- "gemini" | "openai"
    encrypted_key TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### What This Database Does NOT Store

- ❌ Expense data (lives in MCP server)
- ❌ Transaction history
- ❌ Business domain data
- ❌ Plaintext secrets

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- **Supabase account** (free tier works!)
- Google Cloud project (for OAuth)
- LLM API key (Gemini or OpenAI)
- MCP server URL (FastMCP Cloud)

### Installation

```bash
# Clone repository
cd backend-orchestrator

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### Supabase Setup

**📖 See detailed guide: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**

Quick steps:
1. Create Supabase project
2. Run `schema.sql` in SQL Editor
3. Copy Project URL and Service Role Key
4. Add to `.env`

### Environment Setup

```env
# Server
PORT=3000
NODE_ENV=development

# Supabase (from https://app.supabase.com/project/_/settings/api)
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Security (IMPORTANT: Generate new keys!)
MASTER_ENCRYPTION_KEY=your-32-byte-base64-key
SESSION_SECRET=your-session-secret

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# MCP Server
EXPENSE_MCP_URL=https://your-expense-mcp.fastmcp.app/mcp

# LLM (Default - users can override with BYOK)
DEFAULT_LLM_PROVIDER=gemini
DEFAULT_GEMINI_API_KEY=your-gemini-key
DEFAULT_OPENAI_API_KEY=your-openai-key

# CORS
ALLOWED_ORIGINS=http://localhost:3000,chrome-extension://your-extension-id
```

### Generate Encryption Key

```bash
# Run this once to generate MASTER_ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Run Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

You should see:
```
✅ Connected to Supabase database
✅ Database schema verified
🚀 Backend Orchestrator running on port 3000
```

---

## 📡 API Documentation

### Authentication

#### `POST /auth/google`
Authenticate with Google ID token

**Request:**
```json
{
  "idToken": "google-id-token-here"
}
```

**Response:**
```json
{
  "sessionToken": "session-token",
  "user": {
    "userId": "google-sub-123",
    "email": "user@example.com",
    "createdAt": "2026-01-14T..."
  }
}
```

#### `POST /auth/logout`
Invalidate session

**Headers:**
```
Authorization: Bearer <session-token>
```

#### `GET /auth/session`
Get current session info

---

### LLM Intent Processing

#### `POST /llm/intent`
Parse natural language into tool call (NO execution)

**Request:**
```json
{
  "text": "add 50 rupees burger to my expenses"
}
```

**Response:**
```json
{
  "tool": "add_expense",
  "arguments": {
    "date": "2026-01-14",
    "amount": 50,
    "category": "Food",
    "merchant": "Burger"
  }
}
```

#### `POST /llm/keys`
Store user's LLM API key (BYOK)

**Request:**
```json
{
  "provider": "gemini",
  "apiKey": "your-api-key"
}
```

#### `GET /llm/keys`
Check if user has stored key

#### `DELETE /llm/keys`
Remove stored key

#### `GET /llm/tools`
List available tools and schemas

---

### Tool Execution

#### `POST /execute`
Execute MCP tool with validated parameters

**Request:**
```json
{
  "tool": "add_expense",
  "arguments": {
    "date": "2026-01-14",
    "amount": 50,
    "category": "Food"
  }
}
```

**Response:**
```json
{
  "success": true,
  "tool": "add_expense",
  "result": {
    "expense_id": "exp_123",
    "created_at": "2026-01-14T..."
  }
}
```

#### `POST /execute/combined`
Parse intent + execute in one call (convenience)

**Request:**
```json
{
  "text": "add 50 rupees burger"
}
```

**Response:**
```json
{
  "intent": {
    "tool": "add_expense",
    "arguments": { ... }
  },
  "execution": {
    "success": true,
    "result": { ... }
  }
}
```

#### `GET /execute/health`
Check MCP server health

#### `GET /execute/tools`
List available MCP tools

---

## 🔧 Adding New MCP Servers

This backend is designed to work with multiple MCP servers:

### Step 1: Add Tool Schemas

Edit `llm.js`:

```javascript
const TOOL_SCHEMAS = {
  ...existing_tools,
  
  // New tool from different MCP server
  create_calendar_event: {
    description: 'Create a calendar event',
    parameters: {
      title: { type: 'string', required: true },
      date: { type: 'string', required: true },
      time: { type: 'string', required: true },
    },
  },
};
```

### Step 2: Add MCP Server URL

Edit `.env`:

```env
CALENDAR_MCP_URL=https://your-calendar-mcp.fastmcp.app/mcp
```

### Step 3: Update Routing Logic

Edit `mcpClient.js`:

```javascript
export async function executeMCPTool(toolName, toolArguments, userId) {
  let mcpUrl;
  
  if (toolName.startsWith('expense_')) {
    mcpUrl = process.env.EXPENSE_MCP_URL;
  } else if (toolName.startsWith('calendar_')) {
    mcpUrl = process.env.CALENDAR_MCP_URL;
  }
  
  // ... rest of execution
}
```

**That's it!** The LLM will automatically learn the new tools.

---

## 🧪 Testing

### Manual Testing with cURL

```bash
# 1. Authenticate (replace with real Google token)
curl -X POST http://localhost:3000/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken":"your-google-id-token"}'

# Save the sessionToken from response

# 2. Parse intent
curl -X POST http://localhost:3000/llm/intent \
  -H "Authorization: Bearer <session-token>" \
  -H "Content-Type: application/json" \
  -d '{"text":"add 50 rupees burger"}'

# 3. Execute combined
curl -X POST http://localhost:3000/execute/combined \
  -H "Authorization: Bearer <session-token>" \
  -H "Content-Type: application/json" \
  -d '{"text":"show my expenses this month"}'
```

### Integration Tests

```bash
# TODO: Add test suite
npm test
```

---

## 🚨 Common Issues

### "Google token verification failed"

- Check `GOOGLE_CLIENT_ID` matches your app
- Ensure token is from correct Google Cloud project
- Token may be expired (valid for 1 hour)

### "MCP server error"

- Verify `EXPENSE_MCP_URL` is correct
- Check MCP server is running: `GET /execute/health`
- Check network connectivity

### "Failed to decrypt key"

- `MASTER_ENCRYPTION_KEY` may have changed
- Database may contain keys encrypted with old key
- Delete and re-add keys

### "LLM returned invalid JSON"

- LLM may be hallucinating
- Add more examples to `SYSTEM_PROMPT`
- Use stricter temperature (currently 0.1)

### "Supabase connection failed"

- Check `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in `.env`
- Ensure using **service_role** key, not anon key
- Verify Supabase project is active (not paused)
- See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

---

## 📊 Monitoring

### Supabase Dashboard

Monitor your database in Supabase:
- **Table Editor**: View data
- **SQL Editor**: Run queries
- **Database**: Connection pooling stats
- **API**: Request logs

### Session Stats

```bash
# Add to server.js
import { getSessionStats } from './auth.js';

app.get('/admin/sessions', (req, res) => {
  res.json(getSessionStats());
});
```

### Logs

All requests are logged with timing:

```
POST /execute/combined 200 342ms
```

---

## 🔒 Production Checklist

Before deploying:

- [ ] Change all secrets in `.env`
- [ ] Generate new `MASTER_ENCRYPTION_KEY`
- [ ] Enable HTTPS
- [ ] Use Redis for session store (not in-memory)
- [ ] Set up log aggregation
- [ ] Enable Supabase database backups
- [ ] Configure CORS for production domain
- [ ] Set `NODE_ENV=production`
- [ ] Add rate limiting per user
- [ ] Set up monitoring/alerts
- [ ] Review security headers
- [ ] Add request validation middleware
- [ ] Test Google OAuth flow end-to-end
- [ ] Review Supabase RLS policies
- [ ] Set up Supabase Point-in-Time Recovery (PITR)

---

## 🎓 Interview Explanation

**Q: What is this backend?**

> "It's an AI-powered orchestration layer that sits between a Chrome extension and MCP servers. Instead of hardcoding which tools to call, it uses an LLM to translate natural language into structured MCP tool calls. This keeps the MCP servers pure and reusable while giving users a natural language interface."

**Q: Why not put the LLM in the MCP server?**

> "That would violate MCP philosophy. MCP servers should be pure capability executors—just tools with well-defined inputs and outputs. By keeping the LLM in the backend, we maintain modularity. The same expense MCP server could serve a CLI tool, a web app, or any other frontend without knowing about natural language processing."

**Q: How do you handle security?**

> "Three layers: First, Google OAuth for user identity. Second, encrypted storage of user API keys using AES-256-GCM in Supabase. Third, user_id injection into every MCP call to enforce multi-user isolation at the data layer. The backend validates everything before execution."

**Q: Why Supabase instead of raw PostgreSQL?**

> "Supabase gives us PostgreSQL with a great developer experience—instant API, built-in auth, real-time subscriptions, and an excellent dashboard. Plus, it's production-ready out of the box with automatic backups, connection pooling, and easy scaling. Perfect for a resume project that demonstrates modern stack choices."

**Q: What if the LLM hallucinates?**

> "We have strict validation. The LLM's output is parsed as JSON and checked against an allow-list of tools. Required parameters are verified. If anything is invalid, the request is rejected before reaching the MCP server. The LLM is constrained to translation only—it doesn't have execution privileges."

---

## 📝 License

MIT

---

## 🤝 Contributing

This is a reference implementation. For production use, consider:

- Adding comprehensive tests
- Implementing Redis-based sessions
- Adding request/response logging
- Setting up CI/CD
- Adding OpenAPI/Swagger docs
- Implementing webhooks for async operations
- Using Supabase Edge Functions for serverless deployment

---

## 📚 Additional Resources

- [Supabase Setup Guide](./SUPABASE_SETUP.md)
- [Supabase Documentation](https://supabase.com/docs)
- [MCP Protocol Spec](https://modelcontextprotocol.io)
- [Google OAuth Guide](https://developers.google.com/identity/protocols/oauth2)

---

**Built with ❤️ as a resume-grade architecture demo**

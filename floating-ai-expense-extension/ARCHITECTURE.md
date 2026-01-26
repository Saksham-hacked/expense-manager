# 🏗️ ARCHITECTURE DIAGRAM

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                          │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                       ANY WEBPAGE                         │ │
│  │                                                           │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │          FLOATING EXPENSE WIDGET                    │ │ │
│  │  │         (Injected via Content Script)               │ │ │
│  │  │                                                     │ │ │
│  │  │  ┌──────────────────────────────────────────────┐  │ │ │
│  │  │  │  💰 Collapsed Button (Always Visible)       │  │ │ │
│  │  │  └──────────────────────────────────────────────┘  │ │ │
│  │  │                      OR                            │ │ │
│  │  │  ┌──────────────────────────────────────────────┐  │ │ │
│  │  │  │  📋 Expanded Widget                          │  │ │ │
│  │  │  │  ┌────────────────────────────────────────┐  │  │ │ │
│  │  │  │  │  Auth / Input / Confirm / Settings   │  │  │ │ │
│  │  │  │  └────────────────────────────────────────┘  │  │ │ │
│  │  │  └──────────────────────────────────────────────┘  │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND ORCHESTRATOR                        │
│                    (http://localhost:3000)                      │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Auth API   │  │   LLM API    │  │  User API    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│         │                 │                  │                  │
│         ▼                 ▼                  ▼                  │
│  ┌──────────────────────────────────────────────────┐         │
│  │           Database / Session Store               │         │
│  └──────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ API Calls
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        LLM SERVICE                              │
│                  (Gemini API / User's BYOK)                     │
│                                                                 │
│  Intent Parsing: "add 50 rupees burger" →                      │
│  { tool: "add_expense", args: {...} }                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Tool Call
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        MCP SERVER                               │
│                  (Expense Management Tools)                     │
│                                                                 │
│  Available Tools:                                               │
│  - add_expense(amount, description, category)                   │
│  - list_expenses(date_range)                                    │
│  - update_expense(id, data)                                     │
│  - delete_expense(id)                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Flow

```
USER ACTION
    │
    ├─ Types: "add 50 rupees burger"
    │
    ▼
FloatingWidget.jsx
    │
    ├─ Captures input
    │
    ▼
api.js → llmAPI.parseIntent()
    │
    ├─ POST /llm/intent
    │
    ▼
Backend Orchestrator
    │
    ├─ Calls LLM (Gemini)
    │
    ▼
LLM Response
    │
    ├─ { tool: "add_expense", arguments: {...} }
    │
    ▼
ConfirmAction.jsx
    │
    ├─ Shows confirmation UI
    ├─ User reviews
    │
    ▼
USER CONFIRMS
    │
    ├─ Clicks "Confirm & Execute"
    │
    ▼
api.js → llmAPI.executeAction()
    │
    ├─ POST /execute
    │
    ▼
Backend Orchestrator
    │
    ├─ Calls MCP Server
    │
    ▼
MCP Server
    │
    ├─ Executes add_expense()
    ├─ Saves to database
    │
    ▼
Success Response
    │
    ├─ Returns to FloatingWidget
    │
    ▼
FloatingWidget.jsx
    │
    ├─ Shows success message
    └─ Resets to input view
```

---

## File Injection Flow

```
WEBPAGE LOADS
    │
    ▼
Chrome reads manifest.json
    │
    ├─ Sees content_scripts array
    │
    ▼
Chrome injects CSS
    │
    ├─ Loads public/styles.css
    ├─ Inserts into <head>
    │
    ▼
Chrome injects JavaScript
    │
    ├─ Loads dist/contentScript.js
    ├─ Executes in page context
    │
    ▼
contentScript.jsx runs
    │
    ├─ Creates root element
    ├─ Mounts React app
    │
    ▼
FloatingWidget.jsx renders
    │
    ├─ Shows 💰 button
    └─ CSS applies automatically
```

---

## CSS Loading Mechanism

```
manifest.json
    │
    └─ "content_scripts": [
         {
           "css": ["public/styles.css"]  ← Declares CSS
         }
       ]
            │
            ▼
Chrome Extension Loader
            │
            ├─ Reads CSS path
            ├─ Loads file content
            │
            ▼
Page <head>
            │
            ├─ <style data-extension-id="...">
            │      /* Contents of styles.css */
            │  </style>
            │
            ▼
Widget renders
            │
            └─ Classes match CSS rules
                   ↓
              Styling applied ✅
```

---

## Authentication Flow

```
USER CLICKS "SIGN IN WITH GOOGLE"
    │
    ▼
Auth.jsx
    │
    ├─ Calls chrome.identity.getAuthToken()
    │
    ▼
Chrome Identity API
    │
    ├─ Shows OAuth consent screen
    ├─ User approves
    │
    ▼
Google returns ID Token
    │
    ▼
Auth.jsx → authAPI.googleSignIn(idToken)
    │
    ├─ POST /auth/google
    │
    ▼
Backend Orchestrator
    │
    ├─ Verifies ID Token with Google
    ├─ Creates session
    ├─ Returns session token
    │
    ▼
api.js → saveSessionToken()
    │
    ├─ Stores in chrome.storage.local
    │
    ▼
All future requests
    │
    └─ Include: Authorization: Bearer <session_token>
```

---

## BYOK (Bring Your Own Key) Flow

```
USER OPENS SETTINGS
    │
    ▼
Settings.jsx
    │
    ├─ User enters Gemini API key
    │
    ▼
settingsAPI.saveApiKey(key)
    │
    ├─ POST /user/llm-key
    ├─ Body: { apiKey: "AIza..." }
    │
    ▼
Backend Orchestrator
    │
    ├─ Encrypts API key
    ├─ Stores in database
    ├─ Associates with user session
    │
    ▼
Future LLM Calls
    │
    ├─ Backend uses user's API key
    └─ NOT default/shared key

⚠️ IMPORTANT:
API key is NEVER stored in extension
API key is NEVER sent to browser again
API key is ONLY stored encrypted on backend
```

---

## Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                    CHROME EXTENSION                         │
│                     (THIN CLIENT)                           │
│                                                             │
│  Stores:                                                    │
│  ✅ Session token (from backend)                           │
│  ❌ API keys (NEVER)                                        │
│  ❌ User data (NEVER)                                       │
│  ❌ Expense data (NEVER)                                    │
│                                                             │
│  Can Do:                                                    │
│  ✅ Send user input to backend                             │
│  ✅ Show confirmation UI                                   │
│  ✅ Display results from backend                           │
│                                                             │
│  Cannot Do:                                                 │
│  ❌ Call LLM APIs directly                                 │
│  ❌ Parse intent locally                                   │
│  ❌ Execute actions without confirmation                   │
│  ❌ Auto-submit forms on behalf of user                    │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ HTTPS Only
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND ORCHESTRATOR                       │
│                  (SECURE SERVER)                            │
│                                                             │
│  Stores:                                                    │
│  ✅ User sessions (encrypted)                              │
│  ✅ API keys (encrypted)                                   │
│  ✅ Expense data (encrypted)                               │
│  ✅ Audit logs                                             │
│                                                             │
│  Validates:                                                 │
│  ✅ Session tokens on every request                        │
│  ✅ User permissions                                       │
│  ✅ Input sanitization                                     │
│                                                             │
│  Protects:                                                  │
│  ✅ API keys never leave server                            │
│  ✅ Rate limiting on API calls                             │
│  ✅ CORS properly configured                               │
└─────────────────────────────────────────────────────────────┘
```

---

## State Management

```
FloatingWidget.jsx (Root Component)
    │
    ├─ State:
    │   - isExpanded: boolean
    │   - isAuthenticated: boolean
    │   - currentView: 'input' | 'confirm' | 'settings'
    │   - user: object | null
    │   - userInput: string
    │   - pendingAction: object | null
    │   - message: object | null
    │
    ├─ Renders:
    │   │
    │   ├─ Auth.jsx (if !isAuthenticated)
    │   │   └─ Handles: Google Sign-In
    │   │
    │   ├─ Settings.jsx (if currentView === 'settings')
    │   │   └─ Handles: BYOK, Account, Sign-Out
    │   │
    │   ├─ ConfirmAction.jsx (if currentView === 'confirm')
    │   │   └─ Handles: Action confirmation, Execution
    │   │
    │   └─ Input View (if currentView === 'input')
    │       └─ Handles: User input, Intent parsing
    │
    └─ Manages:
        - View transitions
        - Session state
        - Error handling
        - Success messaging
```

---

## Build Process

```
SOURCE CODE
    │
    ├─ src/contentScript.jsx
    ├─ src/FloatingWidget.jsx
    ├─ src/Auth.jsx
    ├─ src/Settings.jsx
    ├─ src/ConfirmAction.jsx
    └─ src/api.js
        │
        ▼
    npm run build
        │
        ├─ Webpack reads webpack.config.js
        ├─ Entry: src/contentScript.jsx
        │
        ▼
    Babel Transpiler
        │
        ├─ JSX → JavaScript
        ├─ ES6+ → ES5
        │
        ▼
    Webpack Bundler
        │
        ├─ Combines all files
        ├─ Resolves imports
        ├─ Minifies code
        │
        ▼
    OUTPUT
        │
        └─ dist/contentScript.js
               │
               └─ Single bundled file
                  Ready for Chrome Extension
```

---

## Error Handling Flow

```
ERROR OCCURS
    │
    ├─ Network error
    ├─ Backend error
    ├─ Session expired
    ├─ Invalid input
    │
    ▼
Try-Catch Block
    │
    ├─ Captures error
    │
    ▼
Error Handler
    │
    ├─ Logs to console
    ├─ Extracts user-friendly message
    │
    ▼
Update UI State
    │
    ├─ setMessage({ type: 'error', text: '...' })
    │
    ▼
Show Error UI
    │
    ├─ Red background
    ├─ Clear message
    ├─ Suggest action
    │
    ▼
User can:
    │
    ├─ Retry action
    ├─ Return to input
    └─ Sign in again (if session expired)
```

---

This architecture ensures:
- ✅ Clear separation of concerns
- ✅ Security by design
- ✅ Easy to test
- ✅ Easy to extend
- ✅ User always in control

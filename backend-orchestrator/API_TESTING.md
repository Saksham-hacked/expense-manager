# API Testing Guide

This file contains example API calls for testing the Backend Orchestrator.

## Prerequisites

1. Server running: `npm start`
2. Have a Google ID token (get from Google Sign-In)
3. MCP server configured and running

---

## 1️⃣ Authentication

### Get Google ID Token (Frontend)

```javascript
// In your Chrome extension or web app
const response = await gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse();
const idToken = response.id_token;
```

### Authenticate with Backend

```bash
curl -X POST http://localhost:3000/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "YOUR_GOOGLE_ID_TOKEN_HERE"
  }'
```

**Response:**
```json
{
  "sessionToken": "abc123...",
  "user": {
    "userId": "google_sub_id",
    "email": "user@example.com",
    "createdAt": "2026-01-14T..."
  }
}
```

**Save this sessionToken for all subsequent requests!**

---

## 2️⃣ LLM Intent Parsing

### Parse Natural Language (No Execution)

```bash
curl -X POST http://localhost:3000/llm/intent \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "add 50 rupees burger to my expenses"
  }'
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

### More Examples

```bash
# Get expenses
curl -X POST http://localhost:3000/llm/intent \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "show me my food expenses from last month"}'

# Stats query
curl -X POST http://localhost:3000/llm/intent \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "how much did I spend on transport this week?"}'

# Search
curl -X POST http://localhost:3000/llm/intent \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "find all uber expenses"}'
```

---

## 3️⃣ Tool Execution

### Execute Parsed Tool

```bash
curl -X POST http://localhost:3000/execute \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "add_expense",
    "arguments": {
      "date": "2026-01-14",
      "amount": 50,
      "category": "Food",
      "merchant": "Burger King"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "tool": "add_expense",
  "result": {
    "expense_id": "exp_abc123",
    "created_at": "2026-01-14T10:30:00Z"
  }
}
```

### Combined Intent + Execution

```bash
curl -X POST http://localhost:3000/execute/combined \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "add 100 rupees coffee at Starbucks"
  }'
```

**Response:**
```json
{
  "intent": {
    "tool": "add_expense",
    "arguments": {
      "date": "2026-01-14",
      "amount": 100,
      "category": "Food",
      "merchant": "Starbucks",
      "note": "coffee"
    }
  },
  "execution": {
    "success": true,
    "tool": "add_expense",
    "result": {
      "expense_id": "exp_xyz789"
    }
  }
}
```

---

## 4️⃣ BYOK (Bring Your Own Key)

### Store Your LLM API Key

```bash
curl -X POST http://localhost:3000/llm/keys \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "gemini",
    "apiKey": "YOUR_GEMINI_API_KEY"
  }'
```

**Response:**
```json
{
  "success": true,
  "provider": "gemini",
  "storedAt": "2026-01-14T...",
  "message": "API key stored securely"
}
```

### Check Stored Key

```bash
curl -X GET http://localhost:3000/llm/keys \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

**Response:**
```json
{
  "hasKey": true,
  "provider": "gemini",
  "storedAt": "2026-01-14T..."
}
```

### Delete Stored Key

```bash
curl -X DELETE http://localhost:3000/llm/keys \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

---

## 5️⃣ System Information

### Health Check

```bash
curl http://localhost:3000/health
```

### MCP Server Health

```bash
curl -X GET http://localhost:3000/execute/health \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

### List Available Tools

```bash
curl -X GET http://localhost:3000/llm/tools \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

### List MCP Tools

```bash
curl -X GET http://localhost:3000/execute/tools \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

---

## 6️⃣ Full Workflow Example

```bash
# Step 1: Authenticate
SESSION_TOKEN=$(curl -s -X POST http://localhost:3000/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken":"YOUR_GOOGLE_TOKEN"}' \
  | jq -r '.sessionToken')

echo "Session: $SESSION_TOKEN"

# Step 2: Add expense via natural language
curl -X POST http://localhost:3000/execute/combined \
  -H "Authorization: Bearer $SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"add 250 rupees taxi ride from home to office"}' \
  | jq

# Step 3: Query expenses
curl -X POST http://localhost:3000/execute/combined \
  -H "Authorization: Bearer $SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"show me all my transport expenses this month"}' \
  | jq

# Step 4: Get statistics
curl -X POST http://localhost:3000/execute/combined \
  -H "Authorization: Bearer $SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"how much total did I spend this week?"}' \
  | jq

# Step 5: Logout
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer $SESSION_TOKEN"
```

---

## 7️⃣ Error Cases

### Invalid Session Token

```bash
curl -X POST http://localhost:3000/llm/intent \
  -H "Authorization: Bearer INVALID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"test"}'
```

**Response (401):**
```json
{
  "error": "Invalid or expired session",
  "message": "Please authenticate again"
}
```

### Missing Required Fields

```bash
curl -X POST http://localhost:3000/execute \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "add_expense"
  }'
```

**Response (400):**
```json
{
  "error": "Missing required fields",
  "missing": ["arguments"]
}
```

### Unknown Tool

```bash
curl -X POST http://localhost:3000/execute \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "unknown_tool",
    "arguments": {}
  }'
```

**Response (500):**
```json
{
  "error": "Tool execution failed",
  "message": "Unknown or disallowed tool: unknown_tool"
}
```

---

## 8️⃣ Integration Testing Script

Save this as `test.sh`:

```bash
#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# Configuration
BASE_URL="http://localhost:3000"
GOOGLE_TOKEN="YOUR_GOOGLE_ID_TOKEN_HERE"

echo "🧪 Backend Orchestrator Integration Tests"
echo ""

# Test 1: Health Check
echo "Test 1: Health Check"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/health)
if [ $STATUS -eq 200 ]; then
    echo -e "${GREEN}✓ Passed${NC}"
else
    echo -e "${RED}✗ Failed (Status: $STATUS)${NC}"
fi

# Test 2: Authentication
echo "Test 2: Authentication"
RESPONSE=$(curl -s -X POST $BASE_URL/auth/google \
    -H "Content-Type: application/json" \
    -d "{\"idToken\":\"$GOOGLE_TOKEN\"}")
SESSION_TOKEN=$(echo $RESPONSE | jq -r '.sessionToken')

if [ "$SESSION_TOKEN" != "null" ] && [ -n "$SESSION_TOKEN" ]; then
    echo -e "${GREEN}✓ Passed${NC}"
    echo "  Session: ${SESSION_TOKEN:0:20}..."
else
    echo -e "${RED}✗ Failed${NC}"
    exit 1
fi

# Test 3: Intent Parsing
echo "Test 3: Intent Parsing"
INTENT=$(curl -s -X POST $BASE_URL/llm/intent \
    -H "Authorization: Bearer $SESSION_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"text":"add 50 rupees burger"}')
TOOL=$(echo $INTENT | jq -r '.tool')

if [ "$TOOL" == "add_expense" ]; then
    echo -e "${GREEN}✓ Passed${NC}"
else
    echo -e "${RED}✗ Failed${NC}"
fi

# Test 4: Combined Execution
echo "Test 4: Combined Execution"
EXEC=$(curl -s -X POST $BASE_URL/execute/combined \
    -H "Authorization: Bearer $SESSION_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"text":"add 75 rupees coffee"}')
SUCCESS=$(echo $EXEC | jq -r '.execution.success')

if [ "$SUCCESS" == "true" ]; then
    echo -e "${GREEN}✓ Passed${NC}"
else
    echo -e "${RED}✗ Failed${NC}"
fi

echo ""
echo "✅ Tests complete"
```

Make executable and run:

```bash
chmod +x test.sh
./test.sh
```

---

## 📝 Notes

- Replace `YOUR_SESSION_TOKEN` with actual token from auth response
- Replace `YOUR_GOOGLE_ID_TOKEN` with real Google token
- All requests require `Authorization: Bearer` header except `/auth/google`
- Session tokens expire after 24 hours
- Dates must be in `YYYY-MM-DD` format
- Amounts must be numbers (not strings)

---

## 🐛 Debugging

Enable detailed logs:

```bash
NODE_ENV=development npm start
```

Check logs for:
- LLM responses (JSON parsing)
- MCP tool executions
- Database queries
- Authentication flows

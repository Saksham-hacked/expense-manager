# 🧪 COMPLETE LOCAL TESTING GUIDE

## Before You Start

This guide assumes:
- ✅ You've run `npm install`
- ✅ You've run `npm run build`
- ✅ Extension is loaded in Chrome
- ✅ Backend server is available (or mocked)

---

## 🎯 Test Plan Overview

We'll test in this order:
1. **Basic Load Test** - Extension appears on page
2. **CSS Test** - Styling works correctly
3. **Component Test** - All UI components render
4. **Auth Test** - Google sign-in flow
5. **API Test** - Backend communication
6. **Flow Test** - End-to-end user journey
7. **Error Handling** - Edge cases and failures

---

## TEST 1: Basic Load ✅

### What We're Testing
- Content script injects correctly
- Widget appears on every page

### Steps

1. **Load extension** in Chrome:
   ```
   chrome://extensions → Load unpacked → Select folder
   ```

2. **Open any webpage**:
   - Try: `https://google.com`
   - Try: `https://github.com`
   - Try: `https://youtube.com`

3. **Look for the widget**:
   - Bottom-right corner
   - 💰 icon visible
   - Fixed positioning (doesn't scroll with page)

### Expected Result
✅ Purple circular button with 💰 icon in bottom-right on ALL pages

### If It Fails

**Check 1:** Does `dist/contentScript.js` exist?
```bash
ls dist/contentScript.js
```

**Check 2:** Build the project
```bash
npm run build
```

**Check 3:** Reload extension
- Go to `chrome://extensions`
- Click reload icon on your extension

**Check 4:** Check console for errors
- Right-click on page → Inspect → Console
- Look for red errors mentioning "floating-expense-widget"

**Check 5:** Verify manifest.json
```json
"content_scripts": [
  {
    "matches": ["<all_urls>"],
    "js": ["dist/contentScript.js"],
    "css": ["public/styles.css"]
  }
]
```

---

## TEST 2: CSS Verification ✅

### What We're Testing
- External CSS file loads correctly
- Styling applies to all elements
- No inline styles needed

### Steps

1. **Click the 💰 icon** to expand widget

2. **Verify these styles**:
   - Header: Purple gradient background
   - Text: Readable, proper font
   - Buttons: Styled (not default browser buttons)
   - Border radius: Rounded corners
   - Shadow: Drop shadow visible

3. **Inspect the widget**:
   - Right-click on widget → Inspect
   - Check if classes are applied: `.floating-expense-widget`, `.widget-header`, etc.

4. **Check CSS loading**:
   - In DevTools → Network tab
   - Reload page
   - Look for `styles.css` in requests

### Expected Result
✅ Widget has full styling, looks polished, purple gradient header

### If CSS is Broken

**Symptom:** Widget looks plain/unstyled

**Fix 1:** Verify file exists
```bash
ls public/styles.css
```

**Fix 2:** Check manifest.json
```json
"content_scripts": [{
  "css": ["public/styles.css"]  // ← MUST be here
}]
```

**Fix 3:** Check web_accessible_resources
```json
"web_accessible_resources": [
  {
    "resources": ["public/styles.css"],
    "matches": ["<all_urls>"]
  }
]
```

**Fix 4:** Reload extension completely
- `chrome://extensions`
- Toggle OFF, then ON
- Refresh webpage

---

## TEST 3: Component Rendering ✅

### What We're Testing
- All React components mount correctly
- No console errors
- State management works

### Steps

1. **Open widget** (click 💰)

2. **Verify initial view**:
   - Should show "Sign in with Google" (if not authenticated)
   - OR should show input field (if authenticated)

3. **Check browser console**:
   - Open DevTools → Console
   - Should see: `[Floating Expense Widget] Initialized successfully`
   - Should NOT see React errors

4. **Test collapse/expand**:
   - Click minimize button (─) in header
   - Widget should collapse back to 💰 icon
   - Click 💰 again → should expand

5. **Test view switching** (after auth):
   - Click ⚙️ icon → Should show Settings
   - Click ⚙️ again → Should return to Input view

### Expected Result
✅ All components render without errors
✅ Navigation between views works smoothly

### If Components Break

**Symptom:** White screen or error messages

**Check console for:**
- "React is not defined" → Rebuild: `npm run build`
- "Unexpected token" → JSX syntax error in source files
- Import errors → Check file paths in imports

**Fix:**
```bash
npm install
npm run build
```

Reload extension and page.

---

## TEST 4: Authentication Flow ✅

### What We're Testing
- Google sign-in via Chrome Identity API
- Session token storage
- Authenticated state management

### Steps

#### Part A: Sign-In

1. **Click "Sign in with Google"**

2. **Chrome should show**:
   - OAuth consent popup
   - List of scopes requested
   - Account selection

3. **After signing in**:
   - Widget should update to show input view
   - Header should have ⚙️ settings icon

4. **Check storage**:
   - DevTools → Application → Storage → chrome.storage → local
   - Should see `sessionToken` key

#### Part B: Persistence

1. **Close and reopen widget**
   - Click minimize, then reopen
   - Should still be authenticated (no sign-in screen)

2. **Refresh page**
   - Widget should remember authentication

3. **Restart browser**
   - Extension should remember session

#### Part C: Sign-Out

1. **Open Settings** (⚙️ icon)
2. **Click "Sign Out"**
3. **Widget should**:
   - Clear session token
   - Show sign-in screen again

### Expected Result
✅ Sign-in works smoothly
✅ Session persists across reloads
✅ Sign-out clears session

### If Authentication Fails

**Symptom:** OAuth error or blank popup

**Fix 1:** Check `manifest.json`
```json
"oauth2": {
  "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
  "scopes": ["openid", "email", "profile"]
}
```

**Fix 2:** Verify Google Cloud Console
- Project exists
- OAuth consent screen configured
- Chrome Identity API enabled
- Client ID is correct

**Fix 3:** Check permissions in manifest
```json
"permissions": ["storage", "identity"]
```

**Fix 4:** Try removing and re-adding extension

---

## TEST 5: Backend API Communication ✅

### What We're Testing
- HTTP requests to localhost:3000
- Request/response handling
- Error handling

### Pre-requisites

**Option A: Real Backend**
- Backend server running on `http://localhost:3000`
- All endpoints implemented

**Option B: Mock Backend**
- Use a tool like `json-server` or create mock responses

### Steps

#### Part A: Intent Parsing

1. **After signing in**, type in input:
   ```
   add 50 rupees burger to my expenses
   ```

2. **Click "Process Request"**

3. **Check Network tab**:
   - Should see POST to `/llm/intent`
   - Headers should include `Authorization: Bearer <token>`
   - Request body: `{ "input": "add 50 rupees..." }`

4. **Expected response**:
   ```json
   {
     "tool": "add_expense",
     "arguments": {
       "amount": 50,
       "description": "burger",
       "currency": "INR"
     }
   }
   ```

5. **Widget should show**:
   - Confirmation screen
   - Action details displayed

#### Part B: Action Execution

1. **On confirmation screen**, click "Confirm & Execute"

2. **Check Network tab**:
   - Should see POST to `/execute`
   - Request body includes tool and arguments

3. **Expected response**:
   ```json
   {
     "success": true,
     "result": {
       "message": "Expense added successfully"
     }
   }
   ```

4. **Widget should show**:
   - Success message
   - Return to input view
   - Input cleared

#### Part C: BYOK (API Key)

1. **Open Settings** (⚙️)

2. **Enter fake API key**:
   ```
   AIzaSyDemoKey123456789
   ```

3. **Click "Save API Key"**

4. **Check Network tab**:
   - POST to `/user/llm-key`
   - Request body: `{ "apiKey": "AIza..." }`

5. **Expected response**:
   ```json
   { "success": true }
   ```

6. **Widget should show**:
   - Success message
   - "API key is configured" status

7. **Test removal**:
   - Click "Remove API Key"
   - DELETE request to `/user/llm-key`
   - Status should update

### Expected Result
✅ All API calls succeed
✅ Responses handled correctly
✅ Errors displayed appropriately

### If API Calls Fail

**Symptom:** Network errors or CORS issues

**Fix 1:** Verify backend is running
```bash
curl http://localhost:3000
```

**Fix 2:** Check `host_permissions` in manifest
```json
"host_permissions": ["http://localhost:3000/*"]
```

**Fix 3:** Backend must send CORS headers
```
Access-Control-Allow-Origin: chrome-extension://[EXTENSION_ID]
Access-Control-Allow-Methods: GET, POST, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
```

**Fix 4:** Check backend endpoints exist
```bash
curl -X POST http://localhost:3000/auth/google
curl -X POST http://localhost:3000/llm/intent
```

---

## TEST 6: End-to-End User Flow ✅

### Complete Journey Test

**Scenario:** User adds an expense from scratch

1. **Install extension** → See 💰 icon
2. **Click 💰** → Expand widget
3. **See sign-in screen** → Click "Sign in with Google"
4. **Complete OAuth** → See input view
5. **Type command**: "add 100 rupees lunch to expenses"
6. **Click Process** → See confirmation screen
7. **Review details** → Confirm execution
8. **See success** → Input cleared, ready for next command
9. **Open settings** → Add API key (optional)
10. **Close widget** → Click minimize
11. **Reopen** → Still authenticated, can add more expenses

### Expected Result
✅ Smooth flow from start to finish
✅ No errors or confusing states
✅ User always knows what's happening

---

## TEST 7: Error Handling ✅

### What We're Testing
- Network failures
- Invalid inputs
- Session expiration
- Backend errors

### Test Cases

#### Test A: Network Offline

1. **Disconnect internet**
2. **Try to process request**
3. **Expected**: Error message "Failed to connect"

#### Test B: Backend Down

1. **Stop backend server**
2. **Try to process request**
3. **Expected**: Error message displayed
4. **Should NOT** crash or show white screen

#### Test C: Session Expired

1. **Manually delete session token**:
   - DevTools → Application → chrome.storage → local
   - Delete `sessionToken`
2. **Try to process request**
3. **Expected**: Redirect to sign-in screen

#### Test D: Invalid Input

1. **Type gibberish**: "asdfghjkl"
2. **Click Process**
3. **Expected**: Backend may return error or confusion message
4. **Widget should**: Display error gracefully

#### Test E: API Key Validation

1. **Enter invalid API key**: "invalid123"
2. **Try to save**
3. **Expected**: Error from backend (if validated)
4. **Widget should**: Show error message

### Expected Result
✅ All errors handled gracefully
✅ User sees helpful error messages
✅ Widget never crashes

---

## 🎯 Success Criteria

Extension passes testing if:

- [ ] Loads on all webpages
- [ ] CSS applies correctly (no inline styles needed)
- [ ] Sign-in works with Google
- [ ] Session persists across reloads
- [ ] User can enter natural language commands
- [ ] Confirmation screen shows correct details
- [ ] Actions execute successfully
- [ ] Settings panel accessible
- [ ] API key can be saved/removed
- [ ] Errors are handled gracefully
- [ ] No console errors in normal flow
- [ ] Widget can be collapsed/expanded
- [ ] All network requests include proper headers

---

## 🔧 Quick Debugging Commands

### Rebuild extension
```bash
npm run build
```

### Watch for changes
```bash
npm run dev
```

### Clean reinstall
```bash
rm -rf node_modules package-lock.json dist
npm install
npm run build
```

### Check if backend is running
```bash
curl http://localhost:3000
```

### View extension errors
```
chrome://extensions → Click "Errors" button on your extension
```

### Inspect content script
```
Right-click page → Inspect → Console → Check for initialization message
```

---

## 📊 Test Results Template

Use this to track your testing:

```
TEST 1 - Basic Load: [ ] PASS [ ] FAIL
TEST 2 - CSS: [ ] PASS [ ] FAIL
TEST 3 - Components: [ ] PASS [ ] FAIL
TEST 4 - Auth: [ ] PASS [ ] FAIL
TEST 5 - API: [ ] PASS [ ] FAIL
TEST 6 - Flow: [ ] PASS [ ] FAIL
TEST 7 - Errors: [ ] PASS [ ] FAIL

Notes:
_________________________________________________
_________________________________________________
```

---

## 🚨 Common Issues Quick Reference

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| No 💰 icon | Content script not loading | Rebuild, reload extension |
| No styling | CSS not declared in manifest | Check manifest.json |
| White screen | React error | Check console, rebuild |
| Sign-in fails | Wrong client_id | Update manifest.json |
| Network errors | Backend down or CORS | Check backend, CORS headers |
| Storage errors | Missing permissions | Check manifest permissions |

---

**Testing Completed By:** _________________  
**Date:** _________________  
**All Tests Passed:** [ ] YES [ ] NO

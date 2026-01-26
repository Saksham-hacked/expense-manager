# 🚀 QUICK START - 5 MINUTE SETUP

Follow these steps in order. Do NOT skip any step.

---

## ✅ STEP 1: Verify Prerequisites

Open terminal and check:

```bash
node --version
# Should show v16 or higher

npm --version
# Should show 8 or higher
```

If either command fails, install Node.js from: https://nodejs.org

---

## ✅ STEP 2: Install Dependencies

In the extension folder, run:

```bash
npm install
```

**Wait for it to complete.** You should see:
```
added XXX packages in XXs
```

---

## ✅ STEP 3: Build the Extension

```bash
npm run build
```

**Wait for it to complete.** You should see:
```
asset contentScript.js XXX bytes [emitted]
webpack compiled successfully
```

**Verify the build:**
```bash
ls dist/contentScript.js
```

This file MUST exist. If not, something went wrong.

---

## ✅ STEP 4: Configure Google OAuth

1. Go to: https://console.cloud.google.com/

2. Create project or select existing

3. Enable **Chrome Identity API**

4. Create OAuth 2.0 Client ID:
   - Type: Chrome Extension
   - Copy the Client ID

5. Open `manifest.json` in this folder

6. Find this line:
   ```json
   "client_id": "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
   ```

7. Replace with YOUR actual Client ID

8. Save the file

---

## ✅ STEP 5: Load Extension in Chrome

1. Open Chrome

2. Go to: `chrome://extensions`

3. Toggle ON "Developer mode" (top-right)

4. Click "Load unpacked"

5. Select THIS folder:
   ```
   C:\Users\saksh\Desktop\floating-ai-expense-extension
   ```

6. Extension should appear in the list

---

## ✅ STEP 6: Test Basic Functionality

1. Open any webpage (e.g., google.com)

2. Look for **💰 icon** in bottom-right corner

3. Click it to expand

4. Should see "Sign in with Google" button

**If you see the 💰 icon and the widget expands, CSS is loaded correctly! ✅**

---

## ✅ STEP 7: Verify CSS Loading

After expanding widget, check:

- [ ] Purple gradient header
- [ ] Rounded corners
- [ ] Drop shadow visible
- [ ] "Sign in with Google" button styled (not plain)

**If all checked, CSS is working! ✅**

---

## 🎉 SUCCESS!

Your extension is now:
- ✅ Built correctly
- ✅ Loaded in Chrome
- ✅ Injecting on pages
- ✅ CSS loading properly

---

## 🔧 What's Next?

### To test with backend:

1. Start your backend server on `http://localhost:3000`

2. Ensure these endpoints exist:
   - POST /auth/google
   - POST /llm/intent
   - POST /execute
   - POST /user/llm-key
   - DELETE /user/llm-key

3. Sign in through the widget

4. Try: "add 50 rupees burger to expenses"

### To make changes:

1. Edit files in `src/` folder

2. Run: `npm run build`

3. Go to `chrome://extensions` and click reload icon

4. Refresh webpage to see changes

---

## ❌ If Something Went Wrong

### No 💰 icon appears

**Fix:**
```bash
npm run build
# Then reload extension in chrome://extensions
```

### CSS not loading (widget looks broken)

**Fix:**
1. Check `public/styles.css` exists
2. Check `manifest.json` has CSS in content_scripts
3. Reload extension completely (toggle OFF then ON)

### Build errors

**Fix:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### React errors in console

**Fix:**
```bash
npm install react react-dom
npm run build
```

---

## 📞 Need Help?

1. Check `TESTING_GUIDE.md` for detailed tests
2. Check `README.md` for full documentation
3. Check browser console for error messages
4. Verify all files exist in correct locations

---

**Setup Time:** ~5 minutes  
**Difficulty:** Easy  
**Required Knowledge:** Basic terminal commands

/**
 * Background Service Worker (MV3) - BRAVE BROWSER COMPATIBLE
 *
 * CRITICAL CHANGES FOR BRAVE COMPATIBILITY:
 * - Removed chrome.identity.getAuthToken() (Chrome-only)
 * - Implemented chrome.identity.launchWebAuthFlow() (Works in Chrome, Brave, Edge)
 * - Uses standard OAuth 2.0 authorization code flow
 * - No longer relies on manifest's oauth2 block
 */



const API_BASE_URL = "https://expense-manager-61j9.onrender.com";

// OAuth Configuration
const OAUTH_CONFIG = {
  clientId: "411523715379-irras3nean8r3isf8nvcnngd77ab2jod.apps.googleusercontent.com",
  redirectUri: `https://${chrome.runtime.id}.chromiumapp.org/`,
  authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  scope: "openid email profile"
};


console.log('[Extension] Background service worker started');
console.log('[Extension] Extension ID:', chrome.runtime.id);
console.log('[Extension] API Base URL:', API_BASE_URL);
console.log('[Extension] OAuth Redirect URI:', OAUTH_CONFIG.redirectUri);

// Update the redirect URI dynamically
OAUTH_CONFIG.redirectUri = `https://${chrome.runtime.id}.chromiumapp.org/`;

console.log('[Extension] Updated redirect URI to:', OAUTH_CONFIG.redirectUri);




/**
 * Helper: get JWT
 */
function getJWT() {
  return new Promise((resolve) => {
    chrome.storage.local.get("jwt", (res) => {
      resolve(res.jwt || null);
    });
  });
}

/**
 * Helper: save JWT
 */
async function saveJWT(token, user) {
  await chrome.storage.local.set({
    jwt: token,
    user,
  });
}

/**
 * Helper: clear JWT
 */
async function clearJWT() {
  await chrome.storage.local.remove(["jwt", "user"]);
}

/**
 * Helper: backend request
 */
async function backendRequest(endpoint, options = {}) {
  const token = await getJWT();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    await clearJWT();
    throw new Error("Authentication expired. Please sign in again.");
  }

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

/**
 * NEW: Browser-agnostic OAuth flow using launchWebAuthFlow
 * Works in Chrome, Brave, Edge, and other Chromium browsers
 */
async function performOAuthFlow() {
  // Step 1: Build authorization URL
  const authUrl = new URL(OAUTH_CONFIG.authUrl);
  authUrl.searchParams.append("client_id", OAUTH_CONFIG.clientId);
  authUrl.searchParams.append("redirect_uri", OAUTH_CONFIG.redirectUri);
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("scope", OAUTH_CONFIG.scope);
  authUrl.searchParams.append("access_type", "online");
  authUrl.searchParams.append("prompt", "consent");

  console.log("[OAuth] Launching web auth flow...");

  // Step 2: Launch OAuth flow (opens Google's consent screen)
  const redirectUrl = await new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl.toString(),
        interactive: true,
      },
      (responseUrl) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(responseUrl);
        }
      }
    );
  });

  console.log("[OAuth] Received redirect:", redirectUrl);

  // Step 3: Extract authorization code from redirect URL
  const urlParams = new URL(redirectUrl).searchParams;
  const authCode = urlParams.get("code");

  if (!authCode) {
    throw new Error("No authorization code received");
  }

  console.log("[OAuth] Got authorization code");

  // Step 4: Exchange code for access token
  // const tokenResponse = await fetch(OAUTH_CONFIG.tokenUrl, {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/x-www-form-urlencoded",
  //   },
  //   body: new URLSearchParams({
  //     code: authCode,
  //     client_id: OAUTH_CONFIG.clientId,
  //     client_secret: process.env.GOOGLE_CLIENT_SECRET,
  //     redirect_uri: OAUTH_CONFIG.redirectUri,
  //     grant_type: "authorization_code",
  //   }),
  // });

  // if (!tokenResponse.ok) {
  //   const error = await tokenResponse.text();
  //   throw new Error(`Token exchange failed: ${error}`);
  // }

  // const tokens = await tokenResponse.json();
  // console.log("[OAuth] Got access token");

  // return tokens.access_token;
  console.log("[OAuth] Got authorization code");

// Step 4: Send auth code to backend for secure token exchange
const tokenResponse = await fetch(`${API_BASE_URL}/auth/google/exchange`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    code: authCode,
    redirectUri: OAUTH_CONFIG.redirectUri,
  }),
});

if (!tokenResponse.ok) {
  const error = await tokenResponse.text();
  throw new Error(`Token exchange failed: ${error}`);
}

const result = await tokenResponse.json();
console.log("[OAuth] Got access token from backend");

return result.access_token;
}

/**
 * MAIN MESSAGE HANDLER
 */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      switch (msg.type) {
        /**
         * =========================
         * AUTH - BRAVE COMPATIBLE
         * =========================
         */
        case "GOOGLE_SIGN_IN": {
          console.log("[AUTH] Starting browser-agnostic OAuth flow...");

          // Use launchWebAuthFlow instead of getAuthToken
          const accessToken = await performOAuthFlow();

          console.log("[AUTH] Authenticating with backend...");

          // Authenticate with backend
          const result = await backendRequest("/auth/google", {
            method: "POST",
            body: JSON.stringify({ accessToken }),
          });

          await saveJWT(result.token, result.user);
          console.log("[AUTH] Sign-in successful!");

          sendResponse(result);
          break;
        }

        /**
         * =========================
         * DEBUG
         * =========================
         */
        case "Debug_Log": {
          console.log("debug_log", msg.payload);
          break;
        }

        /**
         * =========================
         * LLM
         * =========================
         */
        case "LLM_PARSE_INTENT": {
          const rawText =
            typeof msg.payload?.text === "string"
              ? msg.payload.text
              : typeof msg.payload?.input === "string"
              ? msg.payload.input
              : "";

          const text = rawText.trim();

          console.log("[BG] INTENT TEXT:", JSON.stringify(text));

          if (!text) {
            sendResponse({ error: "Empty intent text (background guard)" });
            break;
          }

          const data = await backendRequest("/llm/intent", {
            method: "POST",
            body: JSON.stringify({ text }),
          });

          sendResponse(data);
          break;
        }

        case "LLM_EXECUTE_ACTION": {
          const data = await backendRequest("/execute", {
            method: "POST",
            body: JSON.stringify({
              tool: msg.payload.tool,
              arguments: msg.payload.arguments,
            }),
          });
          sendResponse(data);
          break;
        }

        /**
         * =========================
         * USER SETTINGS (BYOK)
         * =========================
         */
        case "SAVE_LLM_KEY": {
          const data = await backendRequest("/llm/keys", {
            method: "POST",
            body: JSON.stringify(msg.payload),
          });
          sendResponse(data);
          break;
        }

        case "REMOVE_LLM_KEY": {
          const data = await backendRequest("/llm/keys", {
            method: "DELETE",
          });
          sendResponse(data);
          break;
        }

        case "CHECK_LLM_KEY": {
          const data = await backendRequest("/llm/keys");
          sendResponse(data);
          break;
        }

        /**
         * =========================
         * FALLBACK
         * =========================
         */
        default:
          sendResponse({ error: "Unknown message type" });
      }
    } catch (err) {
      console.error("[Background Error]:", err);
      sendResponse({ error: err.message });
    }
  })();

  return true; // REQUIRED for async
});

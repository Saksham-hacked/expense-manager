// chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
//   if (msg.type !== "GOOGLE_SIGN_IN") return;

//   chrome.identity.getAuthToken({ interactive: true }, async accessToken => {
//     if (chrome.runtime.lastError) {
//       sendResponse({ error: chrome.runtime.lastError.message });
//       return;
//     }

//     try {
//       // Convert access token → ID token
//       const res = await fetch(
//         "https://oauth2.googleapis.com/tokeninfo?access_token=" + accessToken
//       );

//       const tokenInfo = await res.json();

//       if (!tokenInfo.sub) {
//         throw new Error("Invalid Google token");
//       }

//       sendResponse(await backendRes.json());
//  // or tokenInfo
//     } catch (e) {
//       sendResponse({ error: e.message });
//     }
//   });

//   return true; // REQUIRED (async)
// });
/**
 * Background Service Worker (MV3)
 *
 * RESPONSIBILITIES:
 * - Google authentication
 * - All backend communication
 * - Session management
 *
 * NOTE:
 * - Content scripts NEVER call backend directly
 * - All fetch() happens here
 */

const API_BASE_URL = "http://localhost:3000";

/**
 * Helper: get session token
 */
// function getSessionToken() {
//   return new Promise((resolve) => {
//     chrome.storage.local.get("sessionToken", (res) => {
//       resolve(res.sessionToken || null);
//     });
//   });
// }

// /**
//  * Helper: save session
//  */
// async function saveSession(session) {
//   await chrome.storage.local.set({
//     sessionToken: session.sessionToken,
//     user: session.user,
//   });
// }

// /**
//  * Helper: clear session
//  */
// async function clearSession() {
//   await chrome.storage.local.remove(["sessionToken", "user"]);
// }

/**
 * Helper: backend request
 */



function getJWT() {
  return new Promise((resolve) => {
    chrome.storage.local.get("jwt", (res) => {
      resolve(res.jwt || null);
    });
  });
}

async function saveJWT(token, user) {
  await chrome.storage.local.set({
    jwt: token,
    user,
  });
}

async function clearJWT() {
  await chrome.storage.local.remove(["jwt", "user"]);
}

// async function backendRequest(endpoint, options = {}) {
//   const token = await getSessionToken();
// //   if (token) {
// //   headers.Authorization = `Bearer ${token}`;
// // }


//   const headers = {
//     "Content-Type": "application/json",
//     ...(options.headers || {}),
//   };

//   if (token) {
//     headers.Authorization = `Bearer ${token}`;
//   }

//   const res = await fetch(`${API_BASE_URL}${endpoint}`, {
//     ...options,
//     headers,
//   });

//   if (res.status === 401) {
//     await clearSession();
//     throw new Error("Session expired. Please sign in again.");
//   }

//   if (!res.ok) {
//     const text = await res.text();
//     throw new Error(text || `API error ${res.status}`);
//   }

//   return res.json();
// }
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
 * MAIN MESSAGE HANDLER
 */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      switch (msg.type) {
        /**
         * =========================
         * AUTH
         * =========================
         */
        // case "GOOGLE_SIGN_IN": {
        //   const accessToken = await new Promise((resolve, reject) => {
        //     chrome.identity.getAuthToken(
        //       { interactive: true },
        //       (token) => {
        //         if (chrome.runtime.lastError) {
        //           reject(new Error(chrome.runtime.lastError.message));
        //         } else {
        //           resolve(token);
        //         }
        //       }
        //     );
        //   });

        //   // Validate token
        //   const tokenInfoRes = await fetch(
        //     "https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=" +
        //       accessToken
        //   );
        //   const tokenInfo = await tokenInfoRes.json();

        //   if (!tokenInfo.sub) {
        //     throw new Error("Invalid Google token");
        //   }

        //   // Authenticate with backend
        //   const session = await backendRequest("/auth/google", {
        //     method: "POST",
        //     body: JSON.stringify({ idToken: accessToken }),
        //   });

        //   await saveSession(session);
        //   sendResponse(session);
        //   break;
        // }
        case "Debug_Log": {
          console.log("debug_log",msg.payload);
          break;
        }
        case "GOOGLE_SIGN_IN": {
  const accessToken = await new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(token);
      }
    });
  });

  // Authenticate with backend
  const result = await backendRequest("/auth/google", {
    method: "POST",
    body: JSON.stringify({ accessToken }),
  });

  await saveJWT(result.token, result.user);
  sendResponse(result);
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
      arguments: msg.payload.arguments
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
      sendResponse({ error: err.message });
    }
  })();

  return true; // REQUIRED for async
});

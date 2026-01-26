// // // /**
// // //  * API Configuration and HTTP Client
// // //  * 
// // //  * This module handles ALL communication with the backend orchestrator.
// // //  * 
// // //  * RULES:
// // //  * - Only talks to backend (http://localhost:3000)
// // //  * - Never calls LLM APIs directly
// // //  * - Never stores API keys locally
// // //  * - Always includes session token in headers
// // //  */

// // // const API_BASE_URL = 'http://localhost:3000';

// // // /**
// // //  * Get session token from chrome storage
// // //  */
// // // async function getSessionToken() {
// // //   return new Promise((resolve) => {
// // //     chrome.storage.local.get(['sessionToken'], (result) => {
// // //       resolve(result.sessionToken || null);
// // //     });
// // //   });
// // // }

// // // /**
// // //  * Save session token to chrome storage
// // //  */
// // // async function saveSessionToken(token) {
// // //   return new Promise((resolve) => {
// // //     chrome.storage.local.set({ sessionToken: token }, resolve);
// // //   });
// // // }

// // // /**
// // //  * Clear session token
// // //  */
// // // async function clearSessionToken() {
// // //   return new Promise((resolve) => {
// // //     chrome.storage.local.remove(['sessionToken'], resolve);
// // //   });
// // // }

// // // /**
// // //  * Generic API request handler
// // //  */
// // // async function apiRequest(endpoint, options = {}) {
// // //   const token = await getSessionToken();
  
// // //   const headers = {
// // //     'Content-Type': 'application/json',
// // //     ...options.headers,
// // //   };

// // //   if (token) {
// // //     headers['Authorization'] = `Bearer ${token}`;
// // //   }

// // //   const response = await fetch(`${API_BASE_URL}${endpoint}`, {
// // //     ...options,
// // //     headers,
// // //   });

// // //   if (response.status === 401) {
// // //     // Session expired
// // //     await clearSessionToken();
// // //     throw new Error('Session expired. Please sign in again.');
// // //   }

// // //   if (!response.ok) {
// // //     const errorData = await response.json().catch(() => ({}));
// // //     throw new Error(errorData.message || `API Error: ${response.status}`);
// // //   }

// // //   return response.json();
// // // }

// // // /**
// // //  * Authentication APIs
// // //  */
// // // export const authAPI = {
// // //   /**
// // //    * Authenticate with Google ID token
// // //    * @param {string} idToken - Google ID token from Chrome Identity API
// // //    * @returns {Promise<{sessionToken: string, user: object}>}
// // //    */
// // //   async googleSignIn(idToken) {
// // //     const data = await apiRequest('/auth/google', {
// // //       method: 'POST',
// // //       body: JSON.stringify({ idToken }),
// // //     });

// // //     // Save session token
// // //     await saveSessionToken(data.sessionToken);
    
// // //     return data;
// // //   },

// // //   /**
// // //    * Sign out - clear local session
// // //    */
// // //   async signOut() {
// // //     await clearSessionToken();
// // //   },

// // //   /**
// // //    * Check if user is authenticated
// // //    */
// // //   async isAuthenticated() {
// // //     const token = await getSessionToken();
// // //     return !!token;
// // //   },

// // //   /**
// // //    * Get current user info
// // //    */
// // //   async getCurrentUser() {
// // //     return apiRequest('/auth/me');
// // //   },
// // // };

// // // /**
// // //  * LLM Intent APIs
// // //  */
// // // export const llmAPI = {
// // //   /**
// // //    * Parse user intent and get tool + arguments
// // //    * @param {string} userInput - Natural language input
// // //    * @returns {Promise<{tool: string, arguments: object}>}
// // //    */
// // //   async parseIntent(userInput) {
// // //     return apiRequest('/llm/intent', {
// // //       method: 'POST',
// // //       body: JSON.stringify({ input: userInput }),
// // //     });
// // //   },

// // //   /**
// // //    * Execute the confirmed action
// // //    * @param {string} tool - Tool name from parseIntent
// // //    * @param {object} args - Arguments from parseIntent
// // //    * @returns {Promise<{success: boolean, result: any}>}
// // //    */
// // //   async executeAction(tool, args) {
// // //     return apiRequest('/execute', {
// // //       method: 'POST',
// // //       body: JSON.stringify({ tool, arguments: args }),
// // //     });
// // //   },
// // // };

// // // /**
// // //  * User Settings APIs (BYOK)
// // //  */
// // // export const settingsAPI = {
// // //   /**
// // //    * Save user's Gemini API key (BYOK)
// // //    * @param {string} apiKey - Gemini API key
// // //    * @returns {Promise<{success: boolean}>}
// // //    */
// // //   async saveApiKey(apiKey) {
// // //     return apiRequest('/user/llm-key', {
// // //       method: 'POST',
// // //       body: JSON.stringify({ apiKey }),
// // //     });
// // //   },

// // //   /**
// // //    * Remove user's API key
// // //    * @returns {Promise<{success: boolean}>}
// // //    */
// // //   async removeApiKey() {
// // //     return apiRequest('/user/llm-key', {
// // //       method: 'DELETE',
// // //     });
// // //   },

// // //   /**
// // //    * Check if user has API key set
// // //    * @returns {Promise<{hasKey: boolean}>}
// // //    */
// // //   async checkApiKey() {
// // //     return apiRequest('/user/llm-key');
// // //   },
// // // };

// // // export { getSessionToken, clearSessionToken };
// // /**
// //  * API Configuration (Chrome Extension Safe)
// //  *
// //  * IMPORTANT:
// //  * - Content scripts MUST NOT call backend directly
// //  * - All backend calls go via background.js
// //  * - This file is only a message-based API wrapper
// //  */

// // /**
// //  * Send request to background script
// //  */
// // function callBackground(type, payload = {}) {
// //   return new Promise((resolve, reject) => {
// //     chrome.runtime.sendMessage(
// //       { type, payload },
// //       (response) => {
// //         if (chrome.runtime.lastError) {
// //           reject(new Error(chrome.runtime.lastError.message));
// //           return;
// //         }

// //         if (!response) {
// //           reject(new Error("No response from background"));
// //           return;
// //         }

// //         if (response.error) {
// //           reject(new Error(response.error));
// //           return;
// //         }

// //         resolve(response);
// //       }
// //     );
// //   });
// // }

// // /**
// //  * =========================
// //  * AUTH APIs
// //  * =========================
// //  */
// // export const authAPI = {
// //   async isAuthenticated() {
// //     return new Promise((resolve) => {
// //       chrome.storage.local.get("sessionToken", (res) => {
// //         resolve(!!res.sessionToken);
// //       });
// //     });
// //   },

// //   async getCurrentUser() {
// //     return new Promise((resolve, reject) => {
// //       chrome.storage.local.get("user", (res) => {
// //         if (!res.user) {
// //           reject(new Error("Not authenticated"));
// //         } else {
// //           resolve({ user: res.user });
// //         }
// //       });
// //     });
// //   },

// //   async signOut() {
// //     await chrome.storage.local.remove(["sessionToken", "user"]);
// //   },
// // };

// // /**
// //  * =========================
// //  * LLM APIs
// //  * =========================
// //  */
// // export const llmAPI = {
// //   async parseIntent(userInput) {
// //     return callBackground("LLM_PARSE_INTENT", {
// //       input: userInput,
// //     });
// //   },

// //   async executeAction(tool, args) {
// //     return callBackground("LLM_EXECUTE_ACTION", {
// //       tool,
// //       arguments: args,
// //     });
// //   },
// // };

// // /**
// //  * =========================
// //  * SETTINGS APIs (BYOK)
// //  * =========================
// //  */
// // export const settingsAPI = {
// //   async saveApiKey(apiKey) {
// //     return callBackground("SAVE_LLM_KEY", { apiKey });
// //   },

// //   async removeApiKey() {
// //     return callBackground("REMOVE_LLM_KEY");
// //   },

// //   async checkApiKey() {
// //     return callBackground("CHECK_LLM_KEY");
// //   },
// // };
// /**
//  * API Configuration (Chrome Extension Safe)
//  *
//  * RULES (STRICT):
//  * - Content scripts NEVER call backend directly
//  * - ALL backend communication goes through background.js
//  * - This file ONLY sends messages to background
//  */

// /**
//  * Generic helper to talk to background.js
//  */
// function callBackground(type, payload = {}) {
//   return new Promise((resolve, reject) => {
//     chrome.runtime.sendMessage({ type, payload }, (response) => {
//       if (chrome.runtime.lastError) {
//         reject(new Error(chrome.runtime.lastError.message));
//         return;
//       }

//       if (!response) {
//         reject(new Error("No response from background"));
//         return;
//       }

//       if (response.error) {
//         reject(new Error(response.error));
//         return;
//       }

//       resolve(response);
//     });
//   });
// }

// /**
//  * =========================
//  * AUTH APIs
//  * =========================
//  */
// export const authAPI = {
//   async isAuthenticated() {
//     return new Promise((resolve) => {
//       chrome.storage.local.get("sessionToken", (res) => {
//         resolve(!!res.sessionToken);
//       });
//     });
//   },

//   async getCurrentUser() {
//     return new Promise((resolve, reject) => {
//       chrome.storage.local.get("user", (res) => {
//         if (!res.user) {
//           reject(new Error("Not authenticated"));
//         } else {
//           resolve({ user: res.user });
//         }
//       });
//     });
//   },

//   async signOut() {
//     await chrome.storage.local.remove(["sessionToken", "user"]);
//   },
// };

// /**
//  * =========================
//  * LLM APIs
//  * =========================
//  */
// export const llmAPI = {
//   /**
//    * Parse natural language into tool + arguments
//    */
//   async parseIntent(userInput) {
//     if (typeof userInput !== "string" || !userInput.trim()) {
//       throw new Error("Invalid or empty user input");
//     }

//     return callBackground("LLM_PARSE_INTENT", {
//       input: userInput,
//     });
//   },

//   /**
//    * Execute confirmed tool call
//    */
//   async executeAction(tool, args) {
//     if (!tool || typeof tool !== "string") {
//       throw new Error("Invalid tool name");
//     }

//     return callBackground("LLM_EXECUTE_ACTION", {
//       tool,
//       arguments: args,
//     });
//   },
// };

// /**
//  * =========================
//  * SETTINGS APIs (BYOK)
//  * =========================
//  */
// export const settingsAPI = {
//   async saveApiKey(apiKey) {
//     if (!apiKey || typeof apiKey !== "string") {
//       throw new Error("Invalid API key");
//     }

//     return callBackground("SAVE_LLM_KEY", {apiKey });
//   },

//   async removeApiKey() {
//     return callBackground("REMOVE_LLM_KEY");
//   },

//   async checkApiKey() {
//     return callBackground("CHECK_LLM_KEY");
//   },
// };


/**
 * API Configuration (Chrome Extension Safe)
 *
 * RULES (STRICT):
 * - Content scripts NEVER call backend directly
 * - ALL backend communication goes through background.js
 * - This file ONLY sends messages to background.js
 */

/**
 * Generic helper to talk to background.js
 */
function callBackground(type, payload = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, payload }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (!response) {
        reject(new Error("No response from background"));
        return;
      }

      if (response.error) {
        reject(new Error(response.error));
        return;
      }

      resolve(response);
    });
  });
}

/**
 * =========================
 * AUTH APIs (JWT)
 * =========================
 */
export const authAPI = {
  /**
   * Check authentication using JWT
   */
  async isAuthenticated() {
    return new Promise((resolve) => {
      chrome.storage.local.get("jwt", (res) => {
        resolve(!!res.jwt);
      });
    });
  },

  /**
   * Get current user from storage
   */
  async getCurrentUser() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(["jwt", "user"], (res) => {
        if (!res.jwt || !res.user) {
          reject(new Error("Not authenticated"));
        } else {
          resolve({ user: res.user });
        }
      });
    });
  },

  /**
   * Sign out (client-side JWT removal)
   */
  async signOut() {
    await chrome.storage.local.remove(["jwt", "user"]);
  },
};

/**
 * =========================
 * LLM APIs
 * =========================
 */
export const llmAPI = {
  /**
   * Parse natural language into tool + arguments
   */
  async parseIntent(userInput) {
    if (typeof userInput !== "string" || !userInput.trim()) {
      throw new Error("Invalid or empty user input");
    }

    return callBackground("LLM_PARSE_INTENT", {
      input: userInput.trim(),
    });
  },

  /**
   * Execute confirmed tool call
   */
  async executeAction(tool, args) {
    if (!tool || typeof tool !== "string") {
      throw new Error("Invalid tool name");
    }

    return callBackground("LLM_EXECUTE_ACTION", {
      tool,
      arguments: args,
    });
  },
};

/**
 * =========================
 * SETTINGS APIs (BYOK)
 * =========================
 */
export const settingsAPI = {
  async saveApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== "string") {
      throw new Error("Invalid API key");
    }

    return callBackground("SAVE_LLM_KEY", { apiKey });
  },

  async removeApiKey() {
    return callBackground("REMOVE_LLM_KEY");
  },

  async checkApiKey() {
    return callBackground("CHECK_LLM_KEY");
  },
};

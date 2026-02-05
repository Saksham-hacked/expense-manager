
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

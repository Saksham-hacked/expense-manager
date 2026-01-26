/**
 * LLM Intent Processing Module
 * 
 * CRITICAL: LLM is used ONLY for natural language → MCP tool translation
 * 
 * The LLM:
 * ✅ Translates user intent into structured tool calls
 * ✅ Extracts parameters from natural language
 * ✅ Outputs JSON with tool name + arguments
 * 
 * The LLM DOES NOT:
 * ❌ Choose which MCP server to use (we tell it)
 * ❌ Execute tools directly
 * ❌ Access databases
 * ❌ Make business logic decisions
 * 
 * Backend responsibilities:
 * - Provide LLM with allowed tools + schemas
 * - Validate LLM output strictly
 * - Reject unknown tools
 * - Inject user_id before execution
 */

import axios from 'axios';
import dotenv from 'dotenv';
import { decryptKey } from './crypto.js';
import { getUserLLMKey } from './db.js';

dotenv.config();

// Allowed MCP tools (strict allow-list)
const ALLOWED_TOOLS = [
  "add_expense",
  "list_expenses",
  "summarize_expenses",
  "monthly_report",
];
function getTodayISO() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function getCurrentMonthISO() {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

const todayISO = getTodayISO();
const currentMonthISO = getCurrentMonthISO();



// Tool schemas (provided to LLM for accurate parameter extraction)
const TOOL_SCHEMAS = {
  add_expense: {
    description: "Add a new expense entry",
    parameters: {
      date: { type: "string", format: "YYYY-MM-DD", required: true },
      amount: { type: "number", required: true },
      category: { type: "string", required: true },
      merchant: { type: "string", required: false },
      note: { type: "string", required: false },
    },
  },

  list_expenses: {
    description: "List expenses within a date range",
    parameters: {
      start_date: { type: "string", format: "YYYY-MM-DD", required: true },
      end_date: { type: "string", format: "YYYY-MM-DD", required: true },
    },
  },

  summarize_expenses: {
    description: "Summarize expenses by category within a date range",
    parameters: {
      start_date: { type: "string", format: "YYYY-MM-DD", required: true },
      end_date: { type: "string", format: "YYYY-MM-DD", required: true },
    },
  },

  monthly_report: {
    description: "Generate a monthly expense report",
    parameters: {
      month: { type: "string", format: "YYYY-MM", required: true },
    },
  },
};


/**
 * System prompt for LLM
 * Instructs LLM to ONLY translate intent → tool call
 */
const FINAL_PROMPT_TEMPLATE= `You are an intent parser for an expense tracking system.
Your ONLY task is to convert natural language into a structured MCP tool call.

This is a deterministic system. Creativity is NOT allowed.

------------------------------------
AUTHORITATIVE TIME CONTEXT
------------------------------------
TODAY'S DATE (YYYY-MM-DD): {{TODAY}}
CURRENT MONTH (YYYY-MM): {{CURRENT_MONTH}}

You MUST use these values exactly whenever the user refers to:
- today
- now
- this month
- current month

You MUST NOT guess, infer, or invent dates.

------------------------------------
AVAILABLE TOOLS
------------------------------------
{{TOOL_SCHEMAS_JSON}}

------------------------------------
OUTPUT FORMAT (STRICT)
------------------------------------

SUCCESS:
{
  "tool": "<tool_name>",
  "arguments": { ... }
}

FAILURE:
{
  "error": "Cannot do this task"
}

You MUST output EXACTLY ONE of the above.
Do NOT mix success and failure formats.

------------------------------------
GLOBAL RULES (STRICT)
------------------------------------

1. Output ONLY a single valid JSON object.
2. Do NOT include:
   - explanations
   - reasoning
   - markdown
   - comments
   - extra fields
   - confidence scores
   - null values
3. Use ONLY tools listed above.
4. Use ONLY parameters defined in the tool schema.
5. Include ALL required parameters.
6. NEVER invent parameters or tools.
7. If the intent does not clearly match a tool, output:
   { "error": "Cannot do this task" }

------------------------------------
DATE & TIME RULES
------------------------------------

- Dates MUST be in YYYY-MM-DD format.
- Month MUST be in YYYY-MM format.
- NEVER generate future dates.
- "today" → use TODAY'S DATE exactly.
- "this month" → use CURRENT MONTH exactly.
- "last month" → use the full previous calendar month.
- If no date range is specified for list or summarize:
  → use first day of CURRENT MONTH to TODAY'S DATE.

------------------------------------
CURRENCY RULES
------------------------------------

- All amounts are in Indian Rupees (INR).
- Amount MUST be a number (not a string).
- Do NOT convert currencies.

------------------------------------
CATEGORY NORMALIZATION
------------------------------------

When possible, normalize categories to one of:
- Food
- Transport
- Shopping
- Entertainment
- Utilities
- Health
- Education
- Rent
- Travel
- Other

------------------------------------
FINAL INSTRUCTION
------------------------------------

Respond ONLY with the JSON object.
If the output is not valid JSON, you have failed.
`;

const SYSTEM_PROMPT = FINAL_PROMPT_TEMPLATE
  .replace("{{TODAY}}", todayISO)
  .replace("{{CURRENT_MONTH}}", currentMonthISO)
  .replace("{{TOOL_SCHEMAS_JSON}}", JSON.stringify(TOOL_SCHEMAS, null, 2));

/**
 * Get LLM API key for user (BYOK or default)
 * 
 * @param {string} userId - User ID
 * @returns {object} - { provider, apiKey }
 */
async function getLLMApiKey(userId) {
  // Try to get user's own key first
  const userKey = await getUserLLMKey(userId);
  
  if (userKey) {
    const decryptedKey = decryptKey(userKey.encrypted_key);
    return {
      provider: userKey.provider,
      apiKey: decryptedKey,
    };
  }
  
  // Fall back to default
  const defaultProvider = process.env.DEFAULT_LLM_PROVIDER || 'gemini';
  const defaultKey = defaultProvider === 'gemini' 
    ? process.env.DEFAULT_GEMINI_API_KEY
    : process.env.DEFAULT_OPENAI_API_KEY;
  
  if (!defaultKey) {
    throw new Error('No LLM API key available (user BYOK not set, default not configured)');
  }
  console.log("Using default LLM API key for provider:", defaultProvider);
  console.log("Default API Key:", defaultKey);
  
  return {
    provider: defaultProvider,
    apiKey: defaultKey,
  };
}

/**
 * Call Gemini API
 */
async function callGemini(apiKey, userMessage) {
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=" +
    apiKey;
  
  console.log("Gemini API URL:", url);

  const response = await axios.post(url, {
    contents: [
      {
        role: "user",
        parts: [{ text: SYSTEM_PROMPT }],
      },
      {
        role: "user",
        parts: [{ text: userMessage }],
      },
    ],
    generationConfig: {
      temperature: 0,
      // maxOutputTokens: 1024,
    },
  });
  if(response === null || response === undefined){
    throw new Error('Gemini API returned no response');
  }
  console.log("Gemini API response:", response.data);
  if (!response.data || !response.data.candidates || response.data.candidates.length === 0) {
    throw new Error('Gemini API returned invalid response');
  }

  return response.data.candidates[0].content.parts[0].text.trim();
}


/**
 * Call OpenAI API
 */
async function callOpenAI(apiKey, userMessage) {
  const url = 'https://api.openai.com/v1/chat/completions';
  
  const response = await axios.post(
    url,
    {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.1,
      max_tokens: 500,
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  return response.data.choices[0].message.content.trim();
}

/**
 * Parse LLM intent into tool call
 * 
 * @param {string} userId - User ID (for BYOK)
 * @param {string} userMessage - Natural language input
 * @returns {object} - { tool, arguments }
 */
export async function parseIntent(userId, userMessage) {
  if (!userMessage || typeof userMessage !== 'string') {
    throw new Error('Invalid user message');
  }
  console.log("in parseintent function with userId:", userId);
  try {
    // Get API key (user's or default)
    const { provider, apiKey } = await getLLMApiKey(userId);
    console.log("Using LLM provider:", provider);
    console.log("Using LLM API key:", apiKey);
    
    // Call appropriate LLM
    let llmResponse;
    if (provider === 'gemini') {
      llmResponse = await callGemini(apiKey, userMessage);
    } else if (provider === 'openai') {
      llmResponse = await callOpenAI(apiKey, userMessage);
    } else {
      throw new Error(`Unknown LLM provider: ${provider}`);
    }
    
    // Parse JSON response
    const parsed = parseJSONResponse(llmResponse);
    
    // Validate against allowed tools
    validateToolCall(parsed);
    
    return parsed;
    
  } catch (error) {
    console.error('LLM intent parsing failed:', error.message);
    throw error;
  }
}

/**
 * Parse JSON from LLM response (handle markdown code blocks)
 */
function parseJSONResponse(text) {
  let cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  // 🔒 Attempt to auto-close JSON if truncated
  if (!cleaned.endsWith("}")) {
    const lastBrace = cleaned.lastIndexOf("}");
    if (lastBrace !== -1) {
      cleaned = cleaned.slice(0, lastBrace + 1);
    }
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("RAW LLM OUTPUT:", text);
    throw new Error(`LLM returned invalid JSON`);
  }
}


/**
 * Validate tool call against schemas
 */
function validateToolCall(toolCall) {
  // Check structure
  if (!toolCall.tool || !toolCall.arguments) {
    throw new Error('Invalid tool call structure: missing tool or arguments');
  }
  
  // Check if tool is allowed
  if (!ALLOWED_TOOLS.includes(toolCall.tool)) {
    throw new Error(`Unknown or disallowed tool: ${toolCall.tool}`);
  }
  
  // Validate required parameters
  const schema = TOOL_SCHEMAS[toolCall.tool];
  const params = schema.parameters;
  
  for (const [paramName, paramSchema] of Object.entries(params)) {
    if (paramSchema.required && !(paramName in toolCall.arguments)) {
      throw new Error(`Missing required parameter: ${paramName} for tool ${toolCall.tool}`);
    }
  }
  
  // Type validation could be added here
  
  return true;
}

/**
 * Get available tools (for documentation/debugging)
 */
export function getAvailableTools() {
  return {
    tools: ALLOWED_TOOLS,
    schemas: TOOL_SCHEMAS,
  };
}

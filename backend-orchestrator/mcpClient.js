import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const EXPENSE_MCP_URL = process.env.EXPENSE_MCP_URL;
const FASTMCP_API_KEY = process.env.FASTMCP_API_KEY;
const MCP_TIMEOUT_MS = 30_000;

if (!EXPENSE_MCP_URL) throw new Error("EXPENSE_MCP_URL not configured");
if (!FASTMCP_API_KEY) throw new Error("FASTMCP_API_KEY not configured");
function parseSSEPayload(raw) {
  if (typeof raw !== "string") {
    throw new Error("Expected SSE text response");
  }

  const lines = raw.split("\n");

  for (const line of lines) {
    if (line.startsWith("data:")) {
      const json = line.replace("data:", "").trim();
      return JSON.parse(json);
    }
  }

  throw new Error("No data event found in SSE response");
}



/**
 * Execute MCP tool
 */
// export async function executeMCPTool(toolName, toolArguments, userId) {
//   if (!toolName || !userId) {
//     throw new Error("Missing toolName or userId");
//   }

//   const payload = {
//     jsonrpc: "2.0",
//     method: "tools.call",
//     params: {
//       name: toolName,
//       input: {
//         ...toolArguments,
//         user_id: userId,
//       },
//     },
//     id: `req_${Date.now()}`,
//   };

//   try {
//     const response = await axios.post(MCP_URL, payload, {
//   timeout: MCP_TIMEOUT_MS,
//   headers: {
//     "Content-Type": "application/json",
//     "Accept": "application/json, text/event-stream",
//     "Authorization": `Bearer ${FASTMCP_API_KEY}`,
//   },
// });

// // 🔥 THIS IS THE FIX
// const sseMessage = parseSSEPayload(response.data);
// console.log("MCP SSE message:", sseMessage);

// if (sseMessage.error) {
//   throw new Error(sseMessage.error.message);
// }


// return {
//   success: true,
//   tool: toolName,
//   result: sseMessage.result,
// };


//     // return {
//     //   success: true,
//     //   tool: toolName,
//     //   result: res.data.result,
//     // };
//   } catch (err) {
//     if (err.response?.data) {
//       console.error("❌ MCP error response:", err.response.data);
//       throw new Error(err.response.data.error?.message || "MCP execution failed");
//     }
//     throw err;
//   }
// }
export async function executeMCPTool(toolName, toolArguments, userId) {
  if (!EXPENSE_MCP_URL) {
    throw new Error("MCP server URL not configured");
  }

  const enrichedArguments = {
    ...toolArguments,
    user_id: userId,
  };

  const response = await axios.post(
    EXPENSE_MCP_URL,
    {
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: toolName,
        arguments: enrichedArguments, // ✅ REQUIRED
      },
      id: `req_${Date.now()}`,
    },
    {
      timeout: MCP_TIMEOUT_MS,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "Authorization": `Bearer ${process.env.FASTMCP_API_KEY}`,
      },
    }
  );
  console.log("MCP raw response data:", response.data);
  // Parse SSE
  const sse = parseSSEPayload(response.data);

  console.log("MCP SSE message:", sse);

  if (sse.error) {
    throw new Error(sse.error.message);
  }

  return {
    success: true,
    tool: toolName,
    result: sse.result,
  };
}

/**
 * List tools
 */
export async function listMCPTools() {
  const res = await axios.post(
    MCP_URL,
    {
      jsonrpc: "2.0",
      method: "tools.list",
      params: {},
      id: Date.now(),
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "Authorization": `Bearer ${FASTMCP_API_KEY}`,
      },
    }
  );

  return res.data.result?.tools || [];
}

/**
 * Health check
 */
export async function healthCheckMCP() {
  try {
    const res = await axios.post(
      MCP_URL,
      {
        jsonrpc: "2.0",
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: {
            name: "backend-orchestrator",
            version: "1.0.0",
          },
        },
        id: Date.now(),
      },
      {
        headers: {
          "Accept": "application/json, text/event-stream",
          "Authorization": `Bearer ${FASTMCP_API_KEY}`,
        },
        timeout: 5000,
      }
    );

    return { healthy: true };
  } catch (e) {
    return { healthy: false, error: e.message };
  }
}

/**
 * Validation (unchanged)
 */
export function validateToolArguments(toolName, args) {
  if (!args || typeof args !== "object") {
    throw new Error("Tool arguments must be an object");
  }

  if (toolName === "add_expense") {
    if (typeof args.amount !== "number") {
      throw new Error("Invalid amount");
    }
    if (!args.date) {
      throw new Error("Missing date");
    }
  }

  return true;
}

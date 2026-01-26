/**
 * MCP Client Module (FastMCP Cloud – Official)
 *
 * Responsibilities:
 * - Execute MCP tool calls using official FastMCP client
 * - List available tools
 * - Health check MCP server
 * - Validate tool arguments
 *
 * IMPORTANT:
 * - This file lives ONLY in backend
 * - Uses FastMCP client (NO raw JSON-RPC)
 * - Safe for FastMCP Cloud
 */

import dotenv from "dotenv";
import { Client } from "@fastmcp/client";

dotenv.config();

const EXPENSE_MCP_URL = process.env.EXPENSE_MCP_URL;

if (!EXPENSE_MCP_URL) {
  throw new Error("❌ EXPENSE_MCP_URL not configured");
}

/**
 * Singleton FastMCP client
 */
const mcpClient = new Client({
  url: EXPENSE_MCP_URL,
});

/**
 * Execute an MCP tool
 *
 * @param {string} toolName
 * @param {object} toolArguments
 * @param {string} userId
 */
export async function executeMCPTool(toolName, toolArguments, userId) {
  if (!toolName || !userId) {
    throw new Error("Missing toolName or userId");
  }

  console.log("🔧 MCP CALL:", toolName, toolArguments, "user:", userId);

  try {
    const result = await mcpClient.callTool(
      toolName,
      toolArguments,
      {
        headers: {
          "X-User-Id": userId, // ✅ correct way for FastMCP Cloud
        },
      }
    );

    return {
      success: true,
      tool: toolName,
      result,
    };
  } catch (err) {
    console.error("❌ MCP execution failed:", err.message);
    throw err;
  }
}

/**
 * List available MCP tools
 */
export async function listMCPTools() {
  try {
    const tools = await mcpClient.listTools();
    return tools;
  } catch (err) {
    console.error("❌ Failed to list MCP tools:", err.message);
    throw err;
  }
}

/**
 * MCP Health Check
 */
export async function healthCheckMCP() {
  try {
    // FastMCP client initializes lazily; listTools is enough
    await mcpClient.listTools();
    return {
      healthy: true,
    };
  } catch (err) {
    return {
      healthy: false,
      error: err.message,
    };
  }
}

/**
 * Validate tool arguments before execution
 */
export function validateToolArguments(toolName, args) {
  if (!args || typeof args !== "object") {
    throw new Error("Tool arguments must be an object");
  }

  switch (toolName) {
    case "add_expense":
      if (typeof args.amount !== "number") {
        throw new Error("add_expense requires numeric amount");
      }
      if (!args.date || !/^\d{4}-\d{2}-\d{2}$/.test(args.date)) {
        throw new Error("add_expense requires date YYYY-MM-DD");
      }
      break;

    case "update_expense":
    case "delete_expense":
      if (!args.expense_id) {
        throw new Error("expense_id is required");
      }
      break;
  }

  return true;
}

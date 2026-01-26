/**
 * Execute Routes
 * 
 * POST /execute - Execute MCP tool (after LLM selection)
 * GET /execute/health - Check MCP server health
 */

import express from 'express';
import { executeMCPTool, validateToolArguments, healthCheckMCP, listMCPTools } from '../mcpClient.js';
import { authenticate, validateRequest } from '../middleware.js';

const router = express.Router();

/**
 * POST /execute
 * Execute an MCP tool with validated parameters
 * 
 * Body:
 * {
 *   "tool": "add_expense",
 *   "arguments": {
 *     "date": "2026-01-14",
 *     "amount": 50,
 *     "category": "Food"
 *   }
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "tool": "add_expense",
 *   "result": { ... }
 * }
 */
router.post('/', authenticate, validateRequest(['tool', 'arguments']), async (req, res) => {
  try {
    const { tool, arguments: toolArguments } = req.body;
    
    // Validate tool arguments
    validateToolArguments(tool, toolArguments);
    
    // Execute MCP tool (user_id injected automatically)
    console.log("Executing tool for user:", req.user.userId, "Tool:", tool);
    const result = await executeMCPTool(tool, toolArguments, req.user.userId);
    
    res.json(result);
    
  } catch (error) {
    console.error('Tool execution failed:', error.message);
    
    res.status(500).json({
      error: 'Tool execution failed',
      message: error.message,
    });
  }
});

/**
 * POST /execute/combined
 * Combined intent parsing + execution
 * Convenience endpoint that does both steps
 * 
 * Body:
 * {
 *   "text": "add 50 rupees burger to my expenses"
 * }
 * 
 * Response:
 * {
 *   "intent": {
 *     "tool": "add_expense",
 *     "arguments": { ... }
 *   },
 *   "execution": {
 *     "success": true,
 *     "result": { ... }
 *   }
 * }
 */
router.post('/combined', authenticate, validateRequest(['text']), async (req, res) => {
  try {
    const { text } = req.body;
    
    // Import parseIntent dynamically to avoid circular dependency
    const { parseIntent } = await import('../llm.js');
    
    // Step 1: Parse intent
    const intent = await parseIntent(req.user.userId, text);
    
    // Check if LLM returned an error
    if (intent.error) {
      return res.status(400).json({
        error: 'Cannot process request',
        message: intent.error,
      });
    }
    
    // Step 2: Validate arguments
    validateToolArguments(intent.tool, intent.arguments);
    
    // Step 3: Execute tool
    const execution = await executeMCPTool(intent.tool, intent.arguments, req.user.userId);
    
    res.json({
      intent,
      execution,
    });
    
  } catch (error) {
    console.error('Combined execution failed:', error.message);
    
    res.status(500).json({
      error: 'Execution failed',
      message: error.message,
    });
  }
});

/**
 * GET /execute/health
 * Check MCP server health status
 */
router.get('/health', authenticate, async (req, res) => {
  try {
    const health = await healthCheckMCP();
    
    const statusCode = health.healthy ? 200 : 503;
    
    res.status(statusCode).json(health);
    
  } catch (error) {
    res.status(503).json({
      healthy: false,
      error: error.message,
    });
  }
});

/**
 * GET /execute/tools
 * List available tools from MCP server
 * (For debugging/validation)
 */
router.get('/tools', authenticate, async (req, res) => {
  try {
    const tools = await listMCPTools();
    
    res.json({
      tools,
      count: tools.length,
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to list MCP tools',
      message: error.message,
    });
  }
});

export default router;

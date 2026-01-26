/**
 * LLM Intent Routes
 * 
 * POST /llm/intent - Parse natural language into tool call
 * POST /llm/keys - Store user's LLM API key (BYOK)
 * DELETE /llm/keys - Remove user's LLM API key
 * GET /llm/tools - Get available tools
 */

import express from 'express';
import { parseIntent, getAvailableTools } from '../llm.js';
import { authenticate, validateRequest } from '../middleware.js';
import { storeUserLLMKey, deleteUserLLMKey, getUserLLMKey } from '../db.js';
import { encryptKey, decryptKey } from '../crypto.js';

const router = express.Router();

/**
 * POST /llm/intent
 * Convert natural language to structured tool call
 * 
 * Body:
 * {
 *   "text": "add 50 rupees burger to my expenses"
 * }
 * 
 * Response:
 * {
 *   "tool": "add_expense",
 *   "arguments": {
 *     "date": "2026-01-14",
 *     "amount": 50,
 *     "category": "Food",
 *     "merchant": "Burger"
 *   }
 * }
 */
router.post('/intent', authenticate, validateRequest(['text']), async (req, res) => {
  console.log("🔥 LLM INTENT HIT", req.body);
  try {
    const { text } = req.body;
  
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        error: 'Empty text input',
      });
    }
    console.log("Parsing intent for user:", req.user.userId);
    
    const result = await parseIntent(req.user.userId, text);
    
    res.json(result);
    
  } catch (error) {
    console.error('Intent parsing failed:', error.message);
    
    res.status(500).json({
      error: 'Failed to parse intent',
      message: error.message,
    });
  }
});

/**
 * POST /llm/keys
 * Store user's own LLM API key (BYOK - Bring Your Own Key)
 * 
 * Body:
 * {
 *   "provider": "gemini" | "openai",
 *   "apiKey": "user-api-key"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "provider": "gemini",
 *   "storedAt": "2026-01-14T..."
 * }
 */
router.post('/keys', authenticate, validateRequest([ 'apiKey']), async (req, res) => {
  try {
    const { apiKey } = req.body;
    const provider = req.body.provider || process.env.DEFAULT_LLM_PROVIDER || 'gemini';
    
    // Validate provider
    if (!['gemini', 'openai'].includes(provider)) {
      return res.status(400).json({
        error: 'Invalid provider',
        message: 'Must be "gemini" or "openai"',
      });
    }
    
    // Validate API key format (basic check)
    if (!apiKey || apiKey.length < 10) {
      return res.status(400).json({
        error: 'Invalid API key format',
      });
    }
    
    // Encrypt and store
    const encryptedKey = encryptKey(apiKey);
    
    const result = await storeUserLLMKey(req.user.userId, provider, encryptedKey);
    
    res.json({
      success: true,
      provider: result.provider,
      storedAt: result.updated_at,
      message: 'API key stored securely',
    });
    
  } catch (error) {
    console.error('Failed to store LLM key:', error.message);
    
    res.status(500).json({
      error: 'Failed to store API key',
      message: error.message,
    });
  }
});

/**
 * GET /llm/keys
 * Check if user has stored an API key
 * Does NOT return the actual key
 */
router.get('/keys', authenticate, async (req, res) => {
  try {
    const keyInfo = await getUserLLMKey(req.user.userId);
    
    if (!keyInfo) {
      return res.json({
        hasKey: false,
        message: 'No API key stored - using default',
      });
    }
    
    res.json({
      hasKey: true,
      provider: keyInfo.provider,
      storedAt: keyInfo.updated_at,
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to check API key',
      message: error.message,
    });
  }
});

/**
 * DELETE /llm/keys
 * Remove user's stored API key
 */
router.delete('/keys', authenticate, async (req, res) => {
  try {
    const result = await deleteUserLLMKey(req.user.userId);
    
    if (!result) {
      return res.status(404).json({
        error: 'No API key found to delete',
      });
    }
    
    res.json({
      success: true,
      message: 'API key deleted - will use default',
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete API key',
      message: error.message,
    });
  }
});

/**
 * GET /llm/tools
 * Get list of available tools and their schemas
 */
router.get('/tools', authenticate, (req, res) => {
  try {
    const tools = getAvailableTools();
    
    res.json(tools);
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get tools',
      message: error.message,
    });
  }
});

export default router;

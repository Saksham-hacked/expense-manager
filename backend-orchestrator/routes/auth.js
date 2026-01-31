/**
 * Authentication Routes
 * 
 * POST /auth/google - Authenticate with Google OAuth
 * POST /auth/logout - Invalidate session
 * GET /auth/session - Get current session info
 */

import express from 'express';
// import { authenticateUser, invalidateSession, verifySession } from '../auth.js';
import { authenticateUser } from '../auth.js';
import { authenticate } from '../middleware.js';

const router = express.Router();

/**
 * POST /auth/google
 * Authenticate user with Google ID token
 * 
 * Body:
 * {
 *   "idToken": "google-id-token-here"
 * }
 * 
 * Response:
 * {
 *   "sessionToken": "session-token",
 *   "user": {
 *     "userId": "google-sub",
 *     "email": "user@example.com",
 *     "createdAt": "2026-01-14T..."
 *   }
 * }
 */
// router.post('/google', async (req, res) => {
//   try {
//     const { idToken } = req.body;
    
//     if (!idToken) {
//       return res.status(400).json({
//         error: 'Missing idToken in request body',
//       });
//     }
    
//     const result = await authenticateUser(idToken);
    
//     res.json(result);
    
//   } catch (error) {
//     console.error('Authentication failed:', error.message);
    
//     res.status(401).json({
//       error: 'Authentication failed',
//       message: error.message,
//     });
//   }
// });
router.post('/google', async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Missing accessToken' });
    }

    const result = await authenticateUser(accessToken);
    res.json(result);

  } catch (err) {
    res.status(401).json({
      error: 'Authentication failed',
      message: err.message,
    });
  }
});

/**
 * POST /auth/logout
 * Invalidate current session
 */
// router.post('/logout', authenticate, (req, res) => {
//   try {
//     const sessionToken = req.headers.authorization.substring(7);
    
//     const deleted = invalidateSession(sessionToken);
    
//     res.json({
//       success: deleted,
//       message: 'Session invalidated',
//     });
    
//   } catch (error) {
//     res.status(500).json({
//       error: 'Logout failed',
//       message: error.message,
//     });
//   }
// });

/**
 * GET /auth/session
 * Get current session information
 */
// router.get('/session', authenticate, (req, res) => {
//   res.json({
//     user: req.user,
//     message: 'Session active',
//   });
// });
router.get('/session', authenticate, (req, res) => {
  res.json({
    user: req.user,
    message: 'JWT valid',
  });
});

// Example: routes/auth.js or similar
router.post('/google/exchange', async (req, res) => {
  const { code, redirectUri } = req.body;
  
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,  // ✅ Safe on server
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      return res.status(400).json({ error: tokens.error_description || 'Token exchange failed' });
    }

    res.json({ access_token: tokens.access_token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

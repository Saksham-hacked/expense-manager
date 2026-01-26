// /**
//  * Google OAuth Authentication Module
//  * 
//  * Handles user authentication via Google OAuth 2.0
//  * - Verifies Google ID tokens
//  * - Extracts user identity (sub, email)
//  * - Creates/fetches user records
//  * - Issues backend session tokens
//  * 
//  * SECURITY NOTES:
//  * - MCP servers NEVER authenticate users
//  * - Backend injects user_id into all MCP calls
//  * - Sessions are stateless (could use JWT in production)
//  */

// // import { OAuth2Client } from 'google-auth-library';
// import crypto from 'crypto';
// import dotenv from 'dotenv';
// import { createOrGetUser } from './db.js';

// dotenv.config();

// // const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// // In-memory session store (use Redis in production)
// const sessions = new Map();

// // Session expiry (24 hours)
// const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;

// /**
//  * Verify Google ID token and extract user info
//  * 
//  * @param {string} idToken - Google ID token from client
//  * @returns {object} - User payload { sub, email, name, picture }
//  */
// // export async function verifyGoogleToken(idToken) {
// //   try {
// //     const ticket = await client.verifyIdToken({
// //       idToken,
// //       audience: process.env.GOOGLE_CLIENT_ID,
// //     });
    
// //     const payload = ticket.getPayload();
    
// //     return {
// //       sub: payload.sub,           // Google user ID (stable)
// //       email: payload.email,
// //       emailVerified: payload.email_verified,
// //       name: payload.name,
// //       picture: payload.picture,
// //     };
    
// //   } catch (error) {
// //     console.error('Google token verification failed:', error.message);
// //     throw new Error('Invalid Google token');
// //   }
// // }
// export async function verifyGoogleToken(accessToken) {
//   const response = await fetch(
//     "https://www.googleapis.com/oauth2/v3/userinfo",
//     {
//       headers: {
//         Authorization: `Bearer ${accessToken}`,
//       },
//     }
//   );

//   if (!response.ok) {
//     throw new Error("Invalid Google access token");
//   }

//   const payload = await response.json();

//   return {
//     sub: payload.sub,                 // Google user ID
//     email: payload.email,
//     emailVerified: payload.email_verified,
//     name: payload.name,
//     picture: payload.picture,
//   };
// }


// /**
//  * Authenticate user with Google token
//  * Creates user record if new, returns session token
//  * 
//  * @param {string} idToken - Google ID token
//  * @returns {object} - { sessionToken, user }
//  */
// export async function authenticateUser(idToken) {
//   // Verify token with Google
//   const googleUser = await verifyGoogleToken(idToken);
  
//   if (!googleUser.emailVerified) {
//     throw new Error('Email not verified');
//   }
  
//   // Create or get user from our database
//   const user = await createOrGetUser(googleUser.sub, googleUser.email);
  
//   // Generate session token
//   const sessionToken = generateSessionToken();
  
//   // Store session
//   sessions.set(sessionToken, {
//     userId: user.user_id,
//     email: user.email,
//     createdAt: Date.now(),
//     expiresAt: Date.now() + SESSION_EXPIRY_MS,
//   });
  
//   return {
//     sessionToken,
//     user: {
//       userId: user.user_id,
//       email: user.email,
//       createdAt: user.created_at,
//     },
//   };
// }

// /**
//  * Verify session token and return user info
//  * 
//  * @param {string} sessionToken - Backend session token
//  * @returns {object} - Session data or null
//  */
// export function verifySession(sessionToken) {
//   const session = sessions.get(sessionToken);
  
//   if (!session) {
//     return null;
//   }
  
//   // Check expiry
//   if (Date.now() > session.expiresAt) {
//     sessions.delete(sessionToken);
//     return null;
//   }
  
//   return session;
// }

// /**
//  * Invalidate a session (logout)
//  * 
//  * @param {string} sessionToken
//  */
// export function invalidateSession(sessionToken) {
//   return sessions.delete(sessionToken);
// }

// /**
//  * Generate a secure random session token
//  * 
//  * @returns {string} - Random token
//  */
// function generateSessionToken() {
//   return crypto.randomBytes(32).toString('base64url');
// }

// /**
//  * Clean up expired sessions (run periodically)
//  */
// export function cleanupExpiredSessions() {
//   const now = Date.now();
//   let cleaned = 0;
  
//   for (const [token, session] of sessions.entries()) {
//     if (now > session.expiresAt) {
//       sessions.delete(token);
//       cleaned++;
//     }
//   }
  
//   if (cleaned > 0) {
//     console.log(`🧹 Cleaned up ${cleaned} expired sessions`);
//   }
// }

// // Run cleanup every hour
// setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

// /**
//  * Get session statistics (for monitoring)
//  */
// export function getSessionStats() {
//   return {
//     activeSessions: sessions.size,
//     sessions: Array.from(sessions.values()).map(s => ({
//       userId: s.userId,
//       createdAt: new Date(s.createdAt),
//       expiresAt: new Date(s.expiresAt),
//     })),
//   };
// }



import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { createOrGetUser } from './db.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Verify Google access token
 */
export async function verifyGoogleToken(accessToken) {
  const response = await fetch(
    'https://www.googleapis.com/oauth2/v3/userinfo',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Invalid Google access token');
  }

  return await response.json();
}

/**
 * Authenticate user and issue JWT
 */
export async function authenticateUser(googleAccessToken) {
  const googleUser = await verifyGoogleToken(googleAccessToken);

  if (!googleUser.email_verified) {
    throw new Error('Email not verified');
  }

  const user = await createOrGetUser(
    googleUser.sub,
    googleUser.email
  );

  const token = jwt.sign(
    {
      userId: user.user_id,
      email: user.email,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );

  return {
    token,
    user: {
      userId: user.user_id,
      email: user.email,
      createdAt: user.created_at,
    },
  };
}

/**
 * Verify JWT
 */
export function verifyJWT(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

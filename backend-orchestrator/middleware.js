/**
 * Express Middleware
 * 
 * Authentication, validation, and security middleware
 */

// import { verifySession } from './auth.js';

/**
 * Authentication middleware
 * Verifies session token and attaches user to request
 */
// export function authenticate(req, res, next) {
//   const authHeader = req.headers.authorization;
  
//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     return res.status(401).json({
//       error: 'Missing or invalid authorization header',
//       message: 'Expected: Authorization: Bearer <session_token>',
//     });
//   }
  
//   const sessionToken = authHeader.substring(7);
  
//   const session = verifySession(sessionToken);
  
//   if (!session) {
//     return res.status(401).json({
//       error: 'Invalid or expired session',
//       message: 'Please authenticate again',
//     });
//   }
  
//   // Attach user info to request
//   req.user = {
//     userId: session.userId,
//     email: session.email,
//   };
  
//   next();
// }

import { verifyJWT } from './auth.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Missing Authorization header',
    });
  }

  const token = authHeader.substring(7);
  const payload = verifyJWT(token);

  if (!payload) {
    return res.status(401).json({
      error: 'Invalid or expired token',
    });
  }

  req.user = {
    userId: payload.userId,
    email: payload.email,
  };

  next();
}


/**
 * Request validation middleware
 * Validates required fields in request body
 */
export function validateRequest(requiredFields) {
  return (req, res, next) => {
    const missing = [];
    
    for (const field of requiredFields) {
      if (!(field in req.body)) {
        missing.push(field);
      }
    }
    
    if (missing.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missing,
      });
    }
    console.log("✅ Validation passed for fields:", requiredFields);
    
    next();
  };
}

/**
 * Error handling middleware
 * Catches and formats errors
 */
export function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  
  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const status = err.status || 500;
  const message = isDevelopment ? err.message : 'Internal server error';
  
  res.status(status).json({
    error: message,
    ...(isDevelopment && { stack: err.stack }),
  });
}

/**
 * Not found middleware
 */
export function notFound(req, res) {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
  });
}

/**
 * Request logging middleware
 */
export function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  
  next();
}

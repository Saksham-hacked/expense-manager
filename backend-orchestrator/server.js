/**
 * Backend Orchestrator Server
 * 
 * AI-Driven MCP Orchestrator with Multi-User Support and BYOK
 * 
 * Purpose:
 * - Authenticate users via Google OAuth
 * - Use LLM to translate natural language → MCP tool calls
 * - Execute validated MCP tools with user isolation
 * - Store encrypted user API keys (BYOK)
 * 
 * Architecture Philosophy:
 * - Backend does NOT contain business logic
 * - LLM decides tools (NOT manual code routing)
 * - MCP servers are pure capability executors
 * - Strict multi-user isolation via user_id injection
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { initializeDatabase } from './db.js';
import { requestLogger, errorHandler, notFound } from './middleware.js';

// Routes
import authRoutes from './routes/auth.js';
import llmRoutes from './routes/llm.js';
import executeRoutes from './routes/execute.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

// Helmet for security headers
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
// app.use(cors({
//   origin: (origin, callback) => {
//     // Allow requests with no origin (mobile apps, Postman, etc.)
//     if (!origin) return callback(null, true);
    
//     if (allowedOrigins.includes(origin) || origin.startsWith('chrome-extension://')) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true,
// }));

// import cors from "cors";

app.use(
  cors({
    origin: (origin, callback) => {
      // 1. Allow requests with no origin (Chrome extension, Postman, curl)
      if (!origin) {
        return callback(null, true);
      }

      // 2. Allow Chrome extensions
      if (origin.startsWith("chrome-extension://")) {
        return callback(null, true);
      }

      // 3. Allow localhost (dev)
      if (origin.startsWith("http://localhost")) {
        return callback(null, true);
      }

      // 4. For everything else → DISALLOW WITHOUT ERROR
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors());



// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
});

app.use(limiter);

// ============================================================================
// PARSING MIDDLEWARE
// ============================================================================

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ============================================================================
// LOGGING
// ============================================================================

app.use(requestLogger);

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/', (req, res) => {
  res.json({
    service: 'Backend Orchestrator',
    version: '1.0.0',
    status: 'running',
    architecture: 'AI-driven MCP orchestrator',
    features: [
      'Google OAuth authentication',
      'LLM-driven tool selection',
      'MCP server integration',
      'Multi-user isolation',
      'BYOK (Bring Your Own Key)',
    ],
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ============================================================================
// API ROUTES
// ============================================================================

app.use('/auth', authRoutes);
app.use('/llm', llmRoutes);
app.use('/execute', executeRoutes);
// ============================================================================
// PRIVACY POLICY
// ============================================================================

app.get('/privacy', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Privacy Policy</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      background: #0f172a;
      color: #e5e7eb;
      padding: 40px;
      max-width: 900px;
      margin: auto;
      line-height: 1.6;
    }
    h1, h2 {
      color: #38bdf8;
    }
    a {
      color: #38bdf8;
    }
  </style>
</head>
<body>
  <h1>Privacy Policy</h1>

  <p><strong>Last updated:</strong> ${new Date().toISOString().split('T')[0]}</p>

  <h2>Overview</h2>
  <p>
    This application is an AI-powered expense management system delivered via a Chrome Extension
    and a backend orchestrator. We prioritize user privacy and data security.
  </p>

  <h2>Data We Collect</h2>
  <ul>
    <li>Google account identifier (via Google OAuth)</li>
    <li>Email address (for authentication only)</li>
    <li>User-provided API keys (BYOK), stored encrypted</li>
  </ul>

  <h2>Data We Do NOT Collect</h2>
  <ul>
    <li>Passwords</li>
    <li>Payment or banking details</li>
    <li>Expense data on this server</li>
    <li>LLM prompts or responses beyond execution</li>
  </ul>

  <h2>How Data Is Used</h2>
  <p>
    Data is used solely to authenticate users, securely execute requested actions,
    and provide AI-powered expense tooling. No data is sold, shared, or used for advertising.
  </p>

  <h2>Security</h2>
  <ul>
    <li>JWT-based stateless authentication</li>
    <li>AES-256-GCM encryption for stored API keys</li>
    <li>Strict user isolation via user_id injection</li>
  </ul>

  <h2>Third-Party Services</h2>
  <ul>
    <li>Google OAuth for authentication</li>
    <li>Optional LLM providers via user-supplied API keys</li>
  </ul>

  <h2>User Control</h2>
  <p>
    Users may delete their stored API keys at any time.
    No data is retained beyond what is required for functionality.
  </p>

  <h2>Contact</h2>
  <p>
    For privacy concerns, contact kaushishsaksham@gmail.com.
  </p>

</body>
</html>
  `);
});


// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use(notFound);
app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function startServer() {
  try {
    console.log('🚀 Starting Backend Orchestrator...');
    
    // Initialize database
    console.log('📦 Initializing database...');
    await initializeDatabase();
    
    // Start server
    app.listen(PORT, () => {
      console.log('');
      console.log('✅ Backend Orchestrator is running');
      console.log('');
      console.log(`   Port:        ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Health:      http://localhost:${PORT}/health`);
      console.log('');
      console.log('📋 Available endpoints:');
      console.log('   POST   /auth/google       - Authenticate with Google');
      console.log('   POST   /auth/logout       - Logout');
      console.log('   GET    /auth/session      - Get session info');
      console.log('');
      console.log('   POST   /llm/intent        - Parse natural language');
      console.log('   POST   /llm/keys          - Store LLM API key (BYOK)');
      console.log('   GET    /llm/keys          - Check stored key');
      console.log('   DELETE /llm/keys          - Remove stored key');
      console.log('   GET    /llm/tools         - List available tools');
      console.log('');
      console.log('   POST   /execute           - Execute MCP tool');
      console.log('   POST   /execute/combined  - Parse + Execute in one call');
      console.log('   GET    /execute/health    - MCP server health');
      console.log('   GET    /execute/tools     - List MCP tools');
      console.log('');
      console.log('🔐 Security features enabled:');
      console.log('   ✓ Helmet security headers');
      console.log('   ✓ CORS protection');
      console.log('   ✓ Rate limiting (100 req/15min)');
      console.log('   ✓ AES-256-GCM encryption');
      console.log('');
      console.log('🧠 LLM Integration:');
      console.log(`   Provider: ${process.env.DEFAULT_LLM_PROVIDER || 'not configured'}`);
      console.log('   BYOK:     Enabled');
      console.log('');
      console.log('🔧 MCP Server:');
      console.log(`   URL: ${process.env.EXPENSE_MCP_URL || 'not configured'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

export default app;
